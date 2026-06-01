#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function assertIncludes(relativePath, needles) {
  const content = read(relativePath);
  for (const needle of needles) {
    if (!content.includes(needle)) {
      throw new Error(`${relativePath} is missing required WO-068 transcription runtime evidence: ${needle}`);
    }
  }
}

function assertNoForbiddenClaims() {
  const forbidden = [
    'live transcription provider enabled',
    'live transcription vendor enabled',
    'raw PHI audio storage enabled',
    'external transcription called',
    'production launch approved',
    'claim submission enabled',
    'charge finalization enabled',
    'medical necessity determined'
  ];
  for (const file of ['RUN_LOG.md', 'SPEC_GAPS.md', 'repo_status.json', 'docs/BACKEND_BUILD_SPEC.md', 'docs/AI_PHI_GOVERNANCE.md']) {
    const content = read(file).toLowerCase();
    for (const phrase of forbidden) {
      if (content.includes(phrase.toLowerCase())) {
        throw new Error(`${file} contains prohibited WO-068 live/launch claim: ${phrase}`);
      }
    }
  }
}

assertIncludes('package.json', ['"transcription:runtime-boundary-readiness"', 'validate-transcription-runtime-boundary-readiness.js']);
assertIncludes('.github/workflows/ci.yml', ['pnpm transcription:runtime-boundary-readiness']);
assertIncludes('apps/api/package.json', ['test:transcription-runtime', 'transcription-provider.test.ts']);
assertIncludes('apps/api/src/transcription/transcription-provider.ts', [
  'ServerSideTranscriptionProviderAdapter',
  'DeterministicMockTranscriptionProvider',
  'DisabledLiveTranscriptionProvider',
  'liveProviderCallsEnabled: false',
  'rawAudioPayloadStorageEnabled: false',
  'dead_lettered_metadata_only'
]);
assertIncludes('apps/api/src/transcription/transcription-provider.test.ts', [
  'processes deterministic mock chunks without live provider calls',
  'fails closed for disabled live provider requests',
  'surfaces documented runtime states'
]);
assertIncludes('apps/api/src/notes/notes.controller.ts', ['disabled-live-provider', 'requestDisabledLiveTranscriptionJob']);
assertIncludes('apps/api/src/schedule/schedule.service.ts', [
  'requestDisabledLiveTranscriptionJob',
  'transcription.job_denied.v1',
  'transcription.provider_disabled.v1',
  'this.transcriptionProvider.requestTranscription'
]);
assertIncludes('apps/api/src/schedule/schedule.service.test.ts', [
  'fails closed for disabled live transcription provider requests',
  'provider_unavailable',
  'dead_lettered_metadata_only'
]);
assertIncludes('apps/api/src/schedule/schedule.e2e.test.ts', [
  'transcription/jobs/disabled-live-provider',
  'server_side_adapter',
  'provider_unavailable'
]);
assertIncludes('apps/web/lib/aura-note-api-client.ts', ['requestDisabledLiveTranscriptionJob', 'providerStatus']);
assertIncludes('apps/web/app/aura-note/workspace/[appointmentId]/workspace-client.tsx', [
  'Verify Live Provider Disabled',
  'Transcription runtime states',
  'providerBoundary',
  'retryPolicy'
]);
assertIncludes('apps/web/e2e/aura-note-routes.spec.ts', [
  'Verify Live Provider Disabled',
  'provider_unavailable',
  'diarization_degraded'
]);
assertIncludes('apps/worker/src/main.ts', ['server_side_adapter', 'dead_lettered_metadata_only', 'rawAudioPayloadStorageEnabled: false']);
assertIncludes('apps/worker/src/main.test.ts', ['dead_lettered_metadata_only']);
assertIncludes('packages/contracts/src/index.ts', [
  'TranscriptionRuntimeStateDto',
  'TranscriptionRetryPolicyDto',
  'providerBoundary',
  'transcription.job_denied.v1',
  'transcription.provider_disabled.v1'
]);
assertIncludes('packages/contracts/openapi/aura-note.v1.yaml', [
  'requestDisabledLiveTranscriptionProviderJob',
  'server_side_adapter',
  'dead_lettered_metadata_only'
]);
assertIncludes('docs/BACKEND_BUILD_SPEC.md', ['WO-068', 'server-side transcription provider adapter']);
assertIncludes('docs/API_EVENT_CONTRACTS.md', ['WO-068', 'transcription.job_denied.v1', 'transcription.provider_disabled.v1']);
assertIncludes('docs/DATA_MODEL.md', ['WO-068', 'retry/dead-letter']);
assertIncludes('docs/RBAC_ABAC_MATRIX.md', ['WO-068', 'transcription runtime']);
assertIncludes('docs/AI_PHI_GOVERNANCE.md', ['WO-068', 'No raw PHI audio']);
assertIncludes('docs/STANDALONE_AND_CLINICOS_MODES.md', ['WO-068', 'ClinicOS cannot bypass']);
assertIncludes('docs/TEST_PLAN.md', ['WO-068', 'transcription:runtime-boundary-readiness']);
assertIncludes('docs/PRODUCTION_BUILD_PLAN.md', ['Implementation status as of `WO-068`']);
assertIncludes('work_orders/README.md', ['`WO-068` is complete', '`WO-069` is the next active CR-3 work order']);
assertIncludes('RUN_LOG.md', ['WO-068 transcription runtime boundary', 'transcription:runtime-boundary-readiness']);
assertIncludes('SPEC_GAPS.md', ['No active gaps as of post-`WO-068` transcription runtime boundary review']);

if (!exists('work_orders/WO-069_ehr_writeback_runtime_sandbox_boundary.md')) {
  throw new Error('WO-069 active work-order file must exist after WO-068 advances CR-3');
}

const status = JSON.parse(read('repo_status.json'));
if (status.work_orders?.['WO-068'] !== 'done') {
  throw new Error('repo_status.json must mark WO-068 done before transcription runtime readiness passes');
}
if (status.next_work_order !== 'WO-069') {
  throw new Error(`repo_status.json must advance next_work_order to WO-069 after WO-068; found ${status.next_work_order}`);
}
if (status.work_orders?.['WO-069'] !== 'todo') {
  throw new Error('repo_status.json must mark WO-069 todo after WO-068 is complete');
}
if (status.current_checkpoint !== 'CR-3') {
  throw new Error(`repo_status.json must remain in CR-3 after WO-068; found ${status.current_checkpoint}`);
}

assertNoForbiddenClaims();

console.log(
  JSON.stringify(
    {
      status: 'ready_synthetic',
      workOrder: 'WO-068',
      checkpoint: 'CR-3 in progress',
      gate: 'transcription_runtime_boundary_readiness',
      serverSideProviderBoundary: true,
      deterministicMockProvider: true,
      disabledLiveProviderFailsClosed: true,
      liveProviderCallsEnabled: false,
      rawPhiAudioStorageEnabled: false,
      transcriptPurgeCount: 0,
      nextWorkOrder: status.next_work_order
    },
    null,
    2
  )
);
