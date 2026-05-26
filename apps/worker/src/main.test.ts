import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { evaluateEhrWritebackQueue, evaluateRawAudioRetention, getWorkerStatus } from './main';

describe('worker scaffold', () => {
  it('reports the CP-2 export and writeback scaffold', () => {
    const status = getWorkerStatus();

    assert.equal(status.status, 'cp2_export_writeback_scaffold_ready');
    assert.equal(status.checkpoint, 'CP-2');
    assert.equal(status.implementedJobs.includes('raw_audio_retention_candidate_scan'), true);
    assert.equal(status.implementedJobs.includes('ehr_writeback_queue_status_scan'), true);
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

  it('preserves writeback failure and disabled queue states for UI/support review', () => {
    const [failed, disabled] = evaluateEhrWritebackQueue([
      {
        writebackJobId: 'writeback-001',
        noteId: 'note-001',
        target: 'final_note',
        vendor: 'athenahealth',
        status: 'failed',
        configured: true,
        humanApproved: true,
        retryable: false,
        failedAt: '2026-05-26T20:00:00.000Z',
        failureReason: 'Synthetic adapter failure'
      },
      {
        writebackJobId: 'writeback-002',
        noteId: 'note-001',
        target: 'final_note',
        vendor: 'athenahealth',
        status: 'not_configured',
        configured: false,
        humanApproved: false,
        retryable: true
      }
    ]);

    assert.equal(failed?.retryable, true);
    assert.equal(disabled?.retryable, false);
  });
});
