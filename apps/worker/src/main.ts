import type { EhrWritebackQueueDto, RawAudioRetentionMetadataDto } from '@aura-note/contracts';

export function getWorkerStatus() {
  return {
    service: 'aura-note-worker',
    status: 'cp2_export_writeback_scaffold_ready',
    checkpoint: 'CP-2',
    implementedJobs: ['raw_audio_retention_candidate_scan', 'export_artifact_status_scan', 'ehr_writeback_queue_status_scan'],
    jobsDeferredToWorkOrders: ['ai_queue', 'live_ehr_writeback', 'analytics']
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

if (require.main === module) {
  console.log(JSON.stringify(getWorkerStatus(), null, 2));
}
