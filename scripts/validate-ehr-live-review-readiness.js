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
const ehrReview = readText('docs/PRODUCTION_EHR_WRITEBACK_CREDENTIALING_REVIEW.md');
const workOrderIndex = readText('work_orders/README.md');
const specGaps = readText('SPEC_GAPS.md');
const runLog = readText('RUN_LOG.md');

const checks = [];

function check(id, description, passed, evidence) {
  checks.push({ id, description, passed: Boolean(passed), evidence });
}

check('status.wo058-done', 'WO-058 is marked done', status.work_orders?.['WO-058'] === 'done', status.work_orders?.['WO-058']);
check('status.next-null', 'No next work order is active after WO-058 planning/control completion', status.next_work_order === null, status.next_work_order);
check('status.p11-retained', 'P11 remains current checkpoint', status.current_checkpoint === 'P11', status.current_checkpoint);
check('work-order.file', 'WO-058 work-order file exists', exists('work_orders/WO-058_production_ehr_writeback_credentialing_review_intake.md'), 'work_orders/WO-058_production_ehr_writeback_credentialing_review_intake.md');
check('work-order.index', 'Work-order index records WO-058 completion', workOrderIndex.includes('WO-058') && workOrderIndex.includes('Production EHR writeback'), 'work_orders/README.md');
check('plan.wo058', 'Production build plan includes WO-058', plan.includes('## WO-058 ') && plan.includes('Production EHR Writeback'), 'docs/PRODUCTION_BUILD_PLAN.md');
check('continuation.promoted', 'Continuation plan records production EHR writeback credentialing review as promoted to WO-058', continuation.includes('Promoted as `WO-058`') && continuation.includes('Production EHR writeback credentialing review'), 'docs/POST_P11_CONTINUATION_PLAN.md');
check('ehr-review.exists', 'Production EHR writeback credentialing review document exists', exists('docs/PRODUCTION_EHR_WRITEBACK_CREDENTIALING_REVIEW.md'), 'docs/PRODUCTION_EHR_WRITEBACK_CREDENTIALING_REVIEW.md');

[
  'Production athenahealth credentialing and vendor posture',
  'Vendor-neutral EHR adapter scope',
  'Credential source and secret handling',
  'Writeback scope and payload policy',
  'Human approval and role boundaries',
  'Idempotency, retry, dead-letter, and reconciliation',
  'Attachment, document, and task semantics',
  'Sandbox, staging, and production promotion',
  'Error taxonomy and support operations',
  'Audit/events and evidence retention',
  'ClinicOS integration handoff boundaries'
].forEach((snippet) => {
  check(`ehr-review.decision.${snippet.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, `EHR review includes decision: ${snippet}`, ehrReview.includes(snippet), snippet);
});

[
  'ehr.vendor_config_reviewed.v1',
  'ehr.credential_configured.v1',
  'ehr.credential_disabled.v1',
  'ehr.writeback_scope_approved.v1',
  'ehr.writeback_payload_prepared.v1',
  'ehr.writeback_approved.v1',
  'ehr.writeback_denied.v1',
  'ehr.writeback_idempotency_replayed.v1',
  'ehr.writeback_request_sent.v1',
  'ehr.writeback_request_failed.v1',
  'ehr.writeback_delivery_confirmed.v1',
  'ehr.writeback_dead_lettered.v1',
  'ehr.writeback_reconciliation_completed.v1',
  'ehr.attachment_exported.v1',
  'ehr.task_handoff_created.v1',
  'ehr.incident_recorded.v1'
].forEach((eventName) => {
  check(`ehr-review.event.${eventName}`, `EHR review includes future event ${eventName}`, ehrReview.includes(eventName), eventName);
});

check(
  'spec-gaps.current',
  'SPEC_GAPS reflects post-WO-058 or later post-P11 planning/control with no active gaps',
  specGaps.includes('No active gaps as of post-`WO-058` production EHR writeback credentialing review intake') ||
    specGaps.includes('No active gaps as of post-`WO-059` ClinicOS live integration review intake'),
  'SPEC_GAPS.md'
);
check('spec-gaps.deferred-ehr', 'SPEC_GAPS preserves production EHR credentialing and live writeback delivery as deferred before live use', specGaps.includes('Production EHR credentialing and live writeback delivery') && specGaps.includes('future approved EHR implementation work order'), 'SPEC_GAPS.md');
check('runlog.wo058', 'RUN_LOG records WO-058 evidence', runLog.includes('WO-058 production EHR writeback credentialing review intake'), 'RUN_LOG.md');
check('package.script', 'package.json exposes EHR live review readiness script', packageJson.scripts?.['ehr:live-review-readiness'] === 'node scripts/validate-ehr-live-review-readiness.js', packageJson.scripts?.['ehr:live-review-readiness']);
check('ci.script', 'CI runs EHR live review readiness before post-P11 readiness', workflow.includes('pnpm ehr:live-review-readiness') && workflow.indexOf('pnpm ehr:live-review-readiness') < workflow.indexOf('pnpm post-p11:readiness'), '.github/workflows/ci.yml');

[
  'productionEhrCredentials=true',
  'rawEhrPayloadStorageEnabled=true',
  'liveWritebackDeliveryEnabled=true',
  'autonomousWritebackEnabled=true',
  'writebackWithoutHumanApprovalEnabled=true',
  'claimSubmissionEnabled=true',
  'chargeFinalizationEnabled=true',
  'medicalNecessityDeterminationEnabled=true',
  'ehrProductionLaunchApproved=true',
  'productionLaunchApproved=true'
].forEach((needle) => {
  check(`prohibited.${needle}`, `WO-058 files do not enable ${needle}`, ![plan, continuation, ehrReview, runLog].some((contents) => contents.includes(needle)), needle);
});

const failed = checks.filter((item) => !item.passed);
const result = {
  status: failed.length === 0 ? 'ready_ehr_live_review_planning_only' : 'blocked',
  checkedAt: new Date().toISOString(),
  workOrder: 'WO-058',
  nextWorkOrder: status.next_work_order,
  productionEhrCredentials: false,
  rawEhrPayloadStorageEnabled: false,
  liveWritebackDeliveryEnabled: false,
  writebackWithoutHumanApprovalEnabled: false,
  claimSubmissionEnabled: false,
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
