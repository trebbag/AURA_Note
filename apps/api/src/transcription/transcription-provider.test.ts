import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  DeterministicMockTranscriptionProvider,
  DisabledLiveTranscriptionProvider
} from './transcription-provider';
import type { RecordingChunkMetadataDto } from '@aura-note/contracts';

const chunk: RecordingChunkMetadataDto = {
  chunkId: 'chunk-provider-001',
  appointmentId: 'appt-provider-001',
  noteId: 'note-provider-001',
  visitSessionId: 'visit-provider-001',
  sequence: 1,
  capturedAt: '2026-06-01T16:00:00.000Z',
  durationMs: 15000,
  contentLengthBytes: 0,
  checksum: 'metadata-only-provider-001',
  transportMode: 'metadata_only_synthetic',
  rawPhiAudioStored: false,
  accepted: true,
  duplicate: false
};

describe('server-side transcription provider boundary', () => {
  it('processes deterministic mock chunks without live provider calls', () => {
    let sequence = 1;
    const provider = new DeterministicMockTranscriptionProvider();
    const result = provider.requestTranscription({
      appointmentId: chunk.appointmentId,
      noteId: chunk.noteId,
      chunks: [chunk],
      existingSegmentCount: 0,
      existingSourceChunkIds: new Set(),
      nowIso: '2026-06-01T16:05:00.000Z',
      nextId: (prefix) => `${prefix}-${sequence++}`
    });

    assert.equal(result.providerStatus.providerBoundary, 'server_side_adapter');
    assert.equal(result.providerStatus.liveProviderCallsEnabled, false);
    assert.equal(result.providerStatus.rawAudioPayloadStorageEnabled, false);
    assert.equal(result.providerStatus.rawAudioRetentionPolicy, 'one_week');
    assert.equal(result.providerStatus.transcriptRetentionPolicy, 'indefinite');
    assert.equal(result.transcriptionJob.status, 'processed');
    assert.equal(result.transcriptionJob.liveProviderCalled, false);
    assert.equal(result.transcriptSegments[0]?.sourceChunkId, chunk.chunkId);
    assert.equal(result.transcriptSegments[0]?.confidence, 0.91);
  });

  it('fails closed for disabled live provider requests without credentials or governance approval', () => {
    let sequence = 1;
    const provider = new DisabledLiveTranscriptionProvider();
    const result = provider.requestTranscription({
      appointmentId: chunk.appointmentId,
      noteId: chunk.noteId,
      chunks: [chunk],
      existingSegmentCount: 0,
      existingSourceChunkIds: new Set(),
      nowIso: '2026-06-01T16:06:00.000Z',
      nextId: (prefix) => `${prefix}-${sequence++}`
    });

    assert.equal(result.providerStatus.mode, 'external_disabled');
    assert.equal(result.providerStatus.configured, false);
    assert.equal(result.providerStatus.liveProviderCallsEnabled, false);
    assert.equal(result.transcriptionJob.status, 'failed');
    assert.equal(result.transcriptionJob.liveProviderCalled, false);
    assert.equal(result.transcriptSegments.length, 0);
    assert.match(result.transcriptionJob.failedReason ?? '', /fail closed/);
  });

  it('surfaces documented runtime states for browser and API readiness evidence', () => {
    const provider = new DeterministicMockTranscriptionProvider();
    const states = provider.getStatus().runtimeStates ?? [];

    for (const expected of [
      'microphone_permission_denied',
      'device_unavailable',
      'upload_interrupted',
      'provider_unavailable',
      'low_confidence',
      'diarization_degraded',
      'correction_history',
      'recording_exception_approved'
    ]) {
      assert.equal(states.includes(expected as (typeof states)[number]), true);
    }
  });
});
