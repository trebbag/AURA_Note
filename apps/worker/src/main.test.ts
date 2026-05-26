import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { evaluateRawAudioRetention, getWorkerStatus } from './main';

describe('worker scaffold', () => {
  it('reports the CP-1 raw audio retention scaffold', () => {
    const status = getWorkerStatus();

    assert.equal(status.status, 'cp1_retention_scaffold_ready');
    assert.equal(status.checkpoint, 'CP-1');
    assert.equal(status.implementedJobs.includes('raw_audio_retention_candidate_scan'), true);
  });

  it('marks raw audio records purge-eligible after the one-week retention window', () => {
    const [record] = evaluateRawAudioRetention(
      [
        {
          recordingId: 'recording-001',
          noteId: 'note-001',
          retentionClass: 'audio_ephemeral',
          capturedAt: '2026-05-26T15:00:00.000Z',
          purgeAfter: '2026-06-02T15:00:00.000Z',
          purgeEligible: false
        }
      ],
      '2026-06-02T15:00:00.000Z'
    );

    assert.equal(record?.purgeEligible, true);
  });
});
