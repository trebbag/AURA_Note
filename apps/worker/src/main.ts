import type { RawAudioRetentionMetadataDto } from '@aura-note/contracts';

export function getWorkerStatus() {
  return {
    service: 'aura-note-worker',
    status: 'cp1_retention_scaffold_ready',
    checkpoint: 'CP-1',
    implementedJobs: ['raw_audio_retention_candidate_scan'],
    jobsDeferredToWorkOrders: ['ai_queue', 'exports', 'writeback', 'analytics']
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

if (require.main === module) {
  console.log(JSON.stringify(getWorkerStatus(), null, 2));
}
