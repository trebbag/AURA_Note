#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

const status = JSON.parse(readText('repo_status.json'));
const packageJson = JSON.parse(readText('package.json'));
const workflow = readText('.github/workflows/ci.yml');
const plan = readText('docs/PRODUCTION_BUILD_PLAN.md');
const continuation = readText('docs/POST_P11_CONTINUATION_PLAN.md');
const transcriptionReview = readText('docs/PRODUCTION_TRANSCRIPTION_PROVIDER_REVIEW.md');
const workOrderIndex = readText('work_orders/README.md');
const specGaps = readText('SPEC_GAPS.md');
const runLog = readText('RUN_LOG.md');

const checks = [];

function check(id, description, passed, evidence) {
  checks.push({ id, description, passed: Boolean(passed), evidence });
}

check('status.wo056-done', 'WO-056 is marked done', status.work_orders?.['WO-056'] === 'done', status.work_orders?.['WO-056']);
check('status.next-null', 'No next work order is active after WO-056 planning/control completion', status.next_work_order === null, status.next_work_order);
check('status.p11-retained', 'P11 remains current checkpoint', status.current_checkpoint === 'P11', status.current_checkpoint);
check('work-order.file', 'WO-056 work-order file exists', exists('work_orders/WO-056_live_transcription_provider_review_intake.md'), 'work_orders/WO-056_live_transcription_provider_review_intake.md');
check('work-order.index', 'Work-order index records WO-056 completion', workOrderIndex.includes('WO-056') && workOrderIndex.includes('transcription provider'), 'work_orders/README.md');
check('plan.wo056', 'Production build plan includes WO-056', plan.includes('## WO-056 ') && plan.includes('Live Transcription Provider'), 'docs/PRODUCTION_BUILD_PLAN.md');
check('continuation.promoted', 'Continuation plan records live transcription provider review as promoted to WO-056', continuation.includes('Promoted as `WO-056`') && continuation.includes('Live transcription provider'), 'docs/POST_P11_CONTINUATION_PLAN.md');
check('transcription-review.exists', 'Production transcription provider review document exists', exists('docs/PRODUCTION_TRANSCRIPTION_PROVIDER_REVIEW.md'), 'docs/PRODUCTION_TRANSCRIPTION_PROVIDER_REVIEW.md');

[
  'Provider and contracting posture',
  'Credential source and secret handling',
  'Audio capture and transport',
  'Consent, notice, and recording exceptions',
  'Raw audio and transcript retention',
  'Diarization and speaker labels',
  'Confidence and source metadata',
  'Retry, dead-letter, and operational support',
  'Privacy, security, and audit evidence'
].forEach((snippet) => {
  check(`transcription-review.decision.${snippet.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, `Transcription review includes decision: ${snippet}`, transcriptionReview.includes(snippet), snippet);
});

[
  'transcription.provider_config_reviewed.v1',
  'transcription.credential_configured.v1',
  'transcription.credential_disabled.v1',
  'recording.consent_recorded.v1',
  'recording.consent_denied.v1',
  'recording.exception_used.v1',
  'recording.chunk_upload_authorized.v1',
  'recording.chunk_upload_denied.v1',
  'transcription.job_requested.v1',
  'transcription.job_denied.v1',
  'transcription.provider_request_sent.v1',
  'transcription.provider_request_failed.v1',
  'transcription.segment_received.v1',
  'transcription.segment_low_confidence.v1',
  'transcription.correction_recorded.v1',
  'transcription.dead_lettered.v1',
  'transcription.replay_requested.v1',
  'transcription.raw_audio_retention_purged.v1',
  'transcription.transcript_retention_preserved.v1',
  'transcription.incident_recorded.v1'
].forEach((eventName) => {
  check(`transcription-review.event.${eventName}`, `Transcription review includes future event ${eventName}`, transcriptionReview.includes(eventName), eventName);
});

check(
  'spec-gaps.current',
  'SPEC_GAPS reflects post-WO-056 or later post-P11 planning/control with no active gaps',
  specGaps.includes('No active gaps as of post-`WO-056` live transcription provider review intake') ||
    specGaps.includes('No active gaps as of post-`WO-057` external AI private/BAA pathway review intake') ||
    specGaps.includes('No active gaps as of post-`WO-058` production EHR writeback credentialing review intake'),
  'SPEC_GAPS.md'
);
check('spec-gaps.deferred-transcription', 'SPEC_GAPS preserves live transcription provider as deferred before live use', specGaps.includes('Live transcription provider and PHI-bearing audio transport') && specGaps.includes('future approved transcription implementation work order'), 'SPEC_GAPS.md');
check('runlog.wo056', 'RUN_LOG records WO-056 evidence', runLog.includes('WO-056 live transcription provider review intake'), 'RUN_LOG.md');
check('package.script', 'package.json exposes transcription live review readiness script', packageJson.scripts?.['transcription:live-review-readiness'] === 'node scripts/validate-transcription-live-review-readiness.js', packageJson.scripts?.['transcription:live-review-readiness']);
check('ci.script', 'CI runs transcription live review readiness before post-P11 readiness', workflow.includes('pnpm transcription:live-review-readiness') && workflow.indexOf('pnpm transcription:live-review-readiness') < workflow.indexOf('pnpm post-p11:readiness'), '.github/workflows/ci.yml');

[
  'liveTranscriptionCredentials=true',
  'phiAudioTransportEnabled=true',
  'liveProviderCallsEnabled=true',
  'productionRawAudioStorageEnabled=true',
  'realDiarizationProductionEnabled=true',
  'supportTranscriptPhiAccessEnabled=true',
  'externalAiTranscriptionEnabled=true',
  'transcriptionProductionLaunchApproved=true',
  'productionLaunchApproved=true'
].forEach((needle) => {
  check(`prohibited.${needle}`, `WO-056 files do not enable ${needle}`, ![plan, continuation, transcriptionReview, runLog].some((contents) => contents.includes(needle)), needle);
});

const failed = checks.filter((item) => !item.passed);
const result = {
  status: failed.length === 0 ? 'ready_transcription_live_review_planning_only' : 'blocked',
  checkedAt: new Date().toISOString(),
  workOrder: 'WO-056',
  nextWorkOrder: status.next_work_order,
  liveTranscriptionCredentials: false,
  phiAudioTransportEnabled: false,
  liveProviderCallsEnabled: false,
  productionRawAudioStorageEnabled: false,
  productionLaunchApproved: false,
  totalChecks: checks.length,
  passedChecks: checks.length - failed.length,
  failedChecks: failed.length,
  failures: failed
};

console.log(JSON.stringify(result, null, 2));

if (failed.length > 0) {
  process.exitCode = 1;
}
