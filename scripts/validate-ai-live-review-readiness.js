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
const aiReview = readText('docs/PRODUCTION_AI_PRIVATE_BAA_PATHWAY_REVIEW.md');
const workOrderIndex = readText('work_orders/README.md');
const specGaps = readText('SPEC_GAPS.md');
const runLog = readText('RUN_LOG.md');

const checks = [];

function check(id, description, passed, evidence) {
  checks.push({ id, description, passed: Boolean(passed), evidence });
}

check('status.wo057-done', 'WO-057 is marked done', status.work_orders?.['WO-057'] === 'done', status.work_orders?.['WO-057']);
check('status.next-production-build-safe', 'Post-P11 planning/control remains valid while commercial-readiness runtime work is active', status.next_work_order === null || status.next_work_order === 'WO-061' || status.next_work_order === 'WO-062' || status.next_work_order === 'WO-063', status.next_work_order);
check('status.checkpoint-production-build-safe', 'P11 or commercial-readiness checkpoint remains current', status.current_checkpoint === 'P11' || status.current_checkpoint === 'CR-0' || status.current_checkpoint === 'CR-1', status.current_checkpoint);
check('work-order.file', 'WO-057 work-order file exists', exists('work_orders/WO-057_external_ai_private_baa_pathway_review_intake.md'), 'work_orders/WO-057_external_ai_private_baa_pathway_review_intake.md');
check('work-order.index', 'Work-order index records WO-057 completion', workOrderIndex.includes('WO-057') && workOrderIndex.includes('AI'), 'work_orders/README.md');
check('plan.wo057', 'Production build plan includes WO-057', plan.includes('## WO-057 ') && plan.includes('External AI'), 'docs/PRODUCTION_BUILD_PLAN.md');
check('continuation.promoted', 'Continuation plan records external AI private/BAA pathway review as promoted to WO-057', continuation.includes('Promoted as `WO-057`') && continuation.includes('External AI private/BAA pathway'), 'docs/POST_P11_CONTINUATION_PLAN.md');
check('ai-review.exists', 'Production AI private/BAA pathway review document exists', exists('docs/PRODUCTION_AI_PRIVATE_BAA_PATHWAY_REVIEW.md'), 'docs/PRODUCTION_AI_PRIVATE_BAA_PATHWAY_REVIEW.md');

[
  'Provider and deployment posture',
  'Credential source and model access',
  'Prompt registry and model configuration',
  'PHI scrubbing and de-identification',
  'Source freshness and evidence packaging',
  'Output schema validation and safety filters',
  'Evaluation harness and regression thresholds',
  'Human review and role boundaries',
  'Observability, audit, and governance events'
].forEach((snippet) => {
  check(`ai-review.decision.${snippet.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, `AI review includes decision: ${snippet}`, aiReview.includes(snippet), snippet);
});

[
  'ai.provider_config_reviewed.v1',
  'ai.credential_configured.v1',
  'ai.credential_disabled.v1',
  'ai.prompt_approved.v1',
  'ai.prompt_version_published.v1',
  'ai.prompt_version_rolled_back.v1',
  'ai.model_config_approved.v1',
  'ai.context_package_created.v1',
  'ai.phi_scrubbed.v1',
  'ai.phi_rejected.v1',
  'ai.request_authorized.v1',
  'ai.request_denied.v1',
  'ai.provider_request_sent.v1',
  'ai.provider_request_failed.v1',
  'ai.output_schema_validated.v1',
  'ai.output_rejected.v1',
  'ai.suggestion_created.v1',
  'ai.human_review_recorded.v1',
  'ai.override_recorded.v1',
  'ai.evaluation_run_completed.v1',
  'ai.regression_blocked_release.v1',
  'ai.incident_recorded.v1'
].forEach((eventName) => {
  check(`ai-review.event.${eventName}`, `AI review includes future event ${eventName}`, aiReview.includes(eventName), eventName);
});

check(
  'spec-gaps.current',
  'SPEC_GAPS reflects post-WO-057 or later post-P11 planning/control with no active gaps',
  specGaps.includes('No active gaps as of post-`WO-057` external AI private/BAA pathway review intake') ||
    specGaps.includes('No active gaps as of post-`WO-058` production EHR writeback credentialing review intake') ||
    specGaps.includes('No active gaps as of post-`WO-059` ClinicOS live integration review intake') ||
    specGaps.includes('No active gaps as of post-`WO-060` commercial readiness rebaseline/runtime rails review') ||
    specGaps.includes('No active gaps as of post-`WO-061` runtime persistence switchover review') ||
    specGaps.includes('No active gaps as of post-`WO-062` API runtime hardening and request-boundary review'),
  'SPEC_GAPS.md'
);
check('spec-gaps.deferred-ai', 'SPEC_GAPS preserves external AI provider and PHI governance as deferred before live use', specGaps.includes('External AI provider and PHI governance') && specGaps.includes('future approved AI implementation work order'), 'SPEC_GAPS.md');
check('runlog.wo057', 'RUN_LOG records WO-057 evidence', runLog.includes('WO-057 external AI private/BAA pathway review intake'), 'RUN_LOG.md');
check('package.script', 'package.json exposes AI live review readiness script', packageJson.scripts?.['ai:live-review-readiness'] === 'node scripts/validate-ai-live-review-readiness.js', packageJson.scripts?.['ai:live-review-readiness']);
check('ci.script', 'CI runs AI live review readiness before post-P11 readiness', workflow.includes('pnpm ai:live-review-readiness') && workflow.indexOf('pnpm ai:live-review-readiness') < workflow.indexOf('pnpm post-p11:readiness'), '.github/workflows/ci.yml');

[
  'liveAiCredentials=true',
  'rawPhiToExternalAiEnabled=true',
  'liveModelCallsEnabled=true',
  'productionPromptStoreEnabled=true',
  'supportAiPhiContentAccessEnabled=true',
  'autonomousDiagnosisEnabled=true',
  'autonomousCodingFinalizationEnabled=true',
  'autonomousChargeFinalizationEnabled=true',
  'medicalNecessityDeterminationEnabled=true',
  'claimSubmissionEnabled=true',
  'aiProductionLaunchApproved=true',
  'productionLaunchApproved=true'
].forEach((needle) => {
  check(`prohibited.${needle}`, `WO-057 files do not enable ${needle}`, ![plan, continuation, aiReview, runLog].some((contents) => contents.includes(needle)), needle);
});

const failed = checks.filter((item) => !item.passed);
const result = {
  status: failed.length === 0 ? 'ready_ai_live_review_planning_only' : 'blocked',
  checkedAt: new Date().toISOString(),
  workOrder: 'WO-057',
  nextWorkOrder: status.next_work_order,
  liveAiCredentials: false,
  rawPhiToExternalAiEnabled: false,
  liveModelCallsEnabled: false,
  productionPromptStoreEnabled: false,
  autonomousFinalizationEnabled: false,
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
