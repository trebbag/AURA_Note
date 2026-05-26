import type {
  AiGatewayInvocationResponseDto,
  ClinicOsIntegrationStatusDto,
  CoachingDashboardDto,
  CoachingReportDto,
  EhrAdapterStatusDto,
  EhrWritebackQueueDto,
  RawAudioRetentionMetadataDto,
  RetentionJobResultDto,
  TranscriptViewDto
} from '@aura-note/contracts';
import { createEventEnvelope } from '@aura-note/contracts';

export function getWorkerStatus() {
  return {
    service: 'aura-note-worker',
    status: 'cp4_hardening_scaffold_ready',
    checkpoint: 'CP-4-in-progress',
    implementedJobs: [
      'raw_audio_retention_candidate_scan',
      'transcript_retention_indefinite_scan',
      'export_artifact_status_scan',
      'ehr_writeback_queue_status_scan',
      'ehr_adapter_health_check_scan',
      'clinicos_mapping_outbox_scan',
      'ai_gateway_mock_invocation_status_scan',
      'coaching_signal_projection_refresh',
      'audit_export_bundle_generation',
      'structured_log_redaction_probe',
      'support_status_health_snapshot'
    ],
    jobsDeferredToWorkOrders: ['live_ai_provider_queue', 'live_ehr_writeback', 'production_analytics_warehouse', 'destructive_storage_purge']
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

export function evaluateCoachingSignalsForDashboard(records: CoachingReportDto[]): Pick<CoachingDashboardDto, 'aggregateOnly' | 'providerCount' | 'overallAverage'> {
  const signalScores = records.flatMap((record) => record.signals.map((signal) => signal.score));
  const providerIds = new Set(records.map((record) => record.clinicianId));
  return {
    aggregateOnly: true,
    providerCount: providerIds.size,
    overallAverage: signalScores.length === 0 ? 0 : Math.round(signalScores.reduce((sum, score) => sum + score, 0) / signalScores.length)
  };
}

export function evaluateRetentionJobRun(
  rawAudioRecords: RawAudioRetentionMetadataDto[],
  transcriptRecords: TranscriptViewDto[],
  nowIso: string,
  traceId = 'trace-retention-worker-synthetic'
): RetentionJobResultDto {
  const evaluatedRawAudio = evaluateRawAudioRetention(rawAudioRecords, nowIso);
  const purgeEligibleCount = evaluatedRawAudio.filter((record) => record.purgeEligible).length;
  return {
    jobRunId: 'retention-job-synthetic-001',
    status: 'completed',
    evaluatedAt: nowIso,
    policies: [
      {
        policyId: 'raw-audio-one-week',
        recordClass: 'audio_ephemeral',
        retentionRule: 'one_week',
        enforcedByJob: 'raw_audio_retention_candidate_scan',
        lastEvaluatedAt: nowIso,
        candidateCount: evaluatedRawAudio.length,
        purgeEligibleCount,
        destructivePurgeEnabled: false
      },
      {
        policyId: 'transcript-indefinite',
        recordClass: 'transcript',
        retentionRule: 'indefinite',
        enforcedByJob: 'transcript_retention_indefinite_scan',
        lastEvaluatedAt: nowIso,
        candidateCount: transcriptRecords.length,
        purgeEligibleCount: 0,
        destructivePurgeEnabled: false
      }
    ],
    auditEvent: {
      auditEventId: 'audit-retention-worker-synthetic-001',
      tenantId: 'tenant-synthetic-primary',
      siteId: 'site-synthetic-primary',
      actorUserId: 'aura-note-worker',
      action: 'retention.scan_completed',
      entityType: 'RetentionJob',
      entityId: 'retention-job-synthetic-001',
      traceId,
      createdAt: nowIso
    },
    domainEvents: [
      createEventEnvelope({
        eventId: 'evt-retention-worker-synthetic-001',
        eventType: 'retention.scan_completed.v1',
        tenantId: 'tenant-synthetic-primary',
        siteId: 'site-synthetic-primary',
        producer: 'aura-note-worker',
        traceId,
        idempotencyKey: 'idem-retention-worker-synthetic-001',
        sensitivity: 'restricted',
        retentionClass: 'audit',
        payload: {
          rawAudioCandidateCount: evaluatedRawAudio.length,
          rawAudioPurgeEligibleCount: purgeEligibleCount,
          transcriptCandidateCount: transcriptRecords.length,
          destructivePurgeEnabled: false
        }
      })
    ]
  };
}

if (require.main === module) {
  console.log(JSON.stringify(getWorkerStatus(), null, 2));
}
