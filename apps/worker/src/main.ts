import type {
  AiGatewayInvocationResponseDto,
  ClinicOsIntegrationStatusDto,
  EhrAdapterStatusDto,
  EhrWritebackQueueDto,
  RawAudioRetentionMetadataDto
} from '@aura-note/contracts';

export function getWorkerStatus() {
  return {
    service: 'aura-note-worker',
    status: 'cp3_ai_gateway_scaffold_ready',
    checkpoint: 'CP-3-in-progress',
    implementedJobs: [
      'raw_audio_retention_candidate_scan',
      'export_artifact_status_scan',
      'ehr_writeback_queue_status_scan',
      'ehr_adapter_health_check_scan',
      'clinicos_mapping_outbox_scan',
      'ai_gateway_mock_invocation_status_scan'
    ],
    jobsDeferredToWorkOrders: ['live_ai_provider_queue', 'live_ehr_writeback', 'analytics']
  };
}

export function evaluateRawAudioRetention(
  records: RawAudioRetentionMetadataDto[],
  nowIso: string
): RawAudioRetentionMetadataDto[] {
  const now = new Date(nowIso);
  if (Number.isNaN(now.valueOf())) {
    throw new Error('retention scan requires a valid timestamp');
  }

  return records.map((record) => ({
    ...record,
    purgeEligible: new Date(record.purgeAfter) <= now
  }));
}

export function evaluateEhrWritebackQueue(records: EhrWritebackQueueDto[]): EhrWritebackQueueDto[] {
  return records.map((record) => {
    if (record.status === 'failed') {
      return { ...record, retryable: true };
    }
    if (record.status === 'disabled' || record.status === 'not_configured' || record.status === 'unsupported_by_vendor') {
      return { ...record, retryable: false };
    }
    return record;
  });
}

export function evaluateAiGatewayInvocationQueue(
  records: AiGatewayInvocationResponseDto[]
): Array<Pick<AiGatewayInvocationResponseDto, 'contextPackage' | 'response'>> {
  return records.map((record) => ({
    contextPackage: record.contextPackage,
    response: {
      ...record.response,
      rejected: record.response.rejected || record.contextPackage.rejectedPaths.length > 0,
      humanReviewRequired: true
    }
  }));
}

export function evaluateEhrAdapterHealth(records: EhrAdapterStatusDto[]): EhrAdapterStatusDto[] {
  return records.map((record) => {
    if (record.mode === 'disabled') {
      return { ...record, connected: false, health: 'disabled' };
    }
    if (record.health === 'failed') {
      return { ...record, connected: false };
    }
    return record;
  });
}

export function evaluateClinicOsOutbox(records: ClinicOsIntegrationStatusDto[]): ClinicOsIntegrationStatusDto[] {
  return records.map((record) => ({
    ...record,
    permissionsStillEnforcedByAuraNote: true,
    publishedEvents: record.publishedEvents.map((event) =>
      record.modeContext.availability === 'unavailable' ? { ...event, status: 'failed_unavailable' as const } : event
    )
  }));
}

if (require.main === module) {
  console.log(JSON.stringify(getWorkerStatus(), null, 2));
}
