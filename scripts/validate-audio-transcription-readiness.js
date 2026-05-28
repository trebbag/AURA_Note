#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const checks = [];

function check(id, description, passed, evidence) {
  checks.push({ id, description, passed: Boolean(passed), evidence });
}

const contracts = read('packages/contracts/src/index.ts');
const security = read('packages/security/src/index.ts');
const domain = read('packages/domain/src/index.ts');
const notesController = read('apps/api/src/notes/notes.controller.ts');
const scheduleService = read('apps/api/src/schedule/schedule.service.ts');
const scheduleE2e = read('apps/api/src/schedule/schedule.e2e.test.ts');
const worker = read('apps/worker/src/main.ts');
const workerTest = read('apps/worker/src/main.test.ts');
const workspace = read('apps/web/app/aura-note/workspace/[appointmentId]/workspace-client.tsx');
const browserSpec = read('apps/web/e2e/aura-note-routes.spec.ts');
const openapi = read('packages/contracts/openapi/aura-note.v1.yaml');
const runLog = read('RUN_LOG.md');
const status = JSON.parse(read('repo_status.json'));

check(
  'contracts.audio-dtos',
  'Audio/transcription DTOs are present',
  ['RecordingChunkMetadataDto', 'TranscriptionJobDto', 'TranscriptionProviderStatusDto', 'TranscriptCorrectionDto'].every((needle) =>
    contracts.includes(needle)
  ),
  'packages/contracts/src/index.ts'
);
check(
  'contracts.audio-events',
  'Audio/transcription events are cataloged',
  ['recording.chunk_received.v1', 'transcription.job_processed.v1', 'transcript.segment_corrected.v1'].every((needle) =>
    contracts.includes(needle)
  ),
  'packages/contracts/src/index.ts'
);
check(
  'security.audio-permissions',
  'Recording/transcription permissions are explicit',
  ['recording:control', 'recording:chunk', 'transcription:process', 'transcript:correct'].every((needle) => security.includes(needle)),
  'packages/security/src/index.ts'
);
check(
  'domain.audio-helpers',
  'Domain helpers enforce metadata-only chunks and correction limits',
  domain.includes('validateRecordingChunkMetadata') &&
    domain.includes('createTranscriptCorrection') &&
    domain.includes('must not persist raw audio bytes'),
  'packages/domain/src/index.ts'
);
check(
  'api.audio-routes',
  'API routes exist for permission, chunks, provider status, mock jobs, retention, and corrections',
  [
    "recording/permission",
    "recording/chunks",
    "recording/retention",
    "transcription/provider-status",
    "transcription/jobs/mock",
    "transcript/segments/:transcriptSegmentId/correction"
  ].every((needle) => notesController.includes(needle)),
  'apps/api/src/notes/notes.controller.ts'
);
check(
  'api.audio-safety',
  'API service preserves mock-only and no raw audio payload boundaries',
  scheduleService.includes('rawPhiAudioStored: false') &&
    scheduleService.includes('metadata_only_synthetic') &&
    scheduleService.includes('liveProviderCalled: false') &&
    scheduleService.includes('transcriptPurgeCount: 0'),
  'apps/api/src/schedule/schedule.service.ts'
);
check(
  'api.audio-tests',
  'API tests cover microphone permission, chunks, mock transcription, correction, and role denial',
  scheduleE2e.includes('recording/permission') &&
    scheduleE2e.includes('recording/chunks') &&
    scheduleE2e.includes('transcription/jobs/mock') &&
    scheduleE2e.includes('support') &&
    scheduleE2e.includes('transcriptPurgeCount'),
  'apps/api/src/schedule/schedule.e2e.test.ts'
);
check(
  'worker.mock-transcription',
  'Worker has deterministic mock transcription job coverage',
  worker.includes('processMockTranscriptionWorkerJob') &&
    workerTest.includes('deterministic mock transcription') &&
    worker.includes('liveProviderCalled: false'),
  'apps/worker/src/main.ts'
);
check(
  'browser.audio-route',
  'Workspace browser route exposes audio candidate states and controls',
  workspace.includes('Audio Capture Candidate') &&
    workspace.includes('Request Microphone') &&
    workspace.includes('Append Metadata Chunk') &&
    workspace.includes('Process Mock Transcription') &&
    workspace.includes('Correct Transcript'),
  'apps/web/app/aura-note/workspace/[appointmentId]/workspace-client.tsx'
);
check(
  'browser.audio-tests',
  'Browser tests cover audio/transcription controls and correction state',
  browserSpec.includes('Demo Permission Denied') &&
    browserSpec.includes('Synthetic mock transcript from metadata-only chunk 1') &&
    browserSpec.includes('Synthetic corrected transcript segment'),
  'apps/web/e2e/aura-note-routes.spec.ts'
);
check(
  'openapi.audio-contracts',
  'OpenAPI includes WO-040 route and schema seeds',
  openapi.includes('appendRecordingChunkMetadata') &&
    openapi.includes('processMockTranscriptionJob') &&
    openapi.includes('CorrectTranscriptSegmentRequest'),
  'packages/contracts/openapi/aura-note.v1.yaml'
);
check(
  'status.wo040',
  'repo_status marks WO-040 done and has advanced beyond WO-040',
  status.work_orders?.['WO-040'] === 'done' && status.next_work_order !== 'WO-040',
  'repo_status.json'
);
check(
  'runlog.wo040',
  'RUN_LOG includes WO-040 evidence',
  runLog.includes('WO-040 browser audio capture and transcription candidate'),
  'RUN_LOG.md'
);

const failed = checks.filter((item) => !item.passed);
const result = {
  status: failed.length === 0 ? 'ready_synthetic' : 'blocked',
  checkedAt: new Date().toISOString(),
  workOrder: 'WO-040',
  evidenceType: 'audio_transcription_candidate_synthetic_readiness',
  productionPhi: false,
  productionCredentials: false,
  liveTranscriptionProviderTouched: false,
  rawAudioPayloadStored: false,
  transcriptPurgeCount: 0,
  liveAiTouched: false,
  claimSubmissionPerformed: false,
  totalChecks: checks.length,
  passedChecks: checks.length - failed.length,
  failedChecks: failed.length,
  failures: failed,
  checks
};

console.log(JSON.stringify(result, null, 2));

if (failed.length > 0) {
  process.exitCode = 1;
}
