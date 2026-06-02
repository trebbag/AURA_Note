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
const clinicosReview = readText('docs/PRODUCTION_CLINICOS_LIVE_INTEGRATION_REVIEW.md');
const workOrderIndex = readText('work_orders/README.md');
const specGaps = readText('SPEC_GAPS.md');
const runLog = readText('RUN_LOG.md');

const checks = [];

function check(id, description, passed, evidence) {
  checks.push({ id, description, passed: Boolean(passed), evidence });
}

check('status.wo059-done', 'WO-059 is marked done', status.work_orders?.['WO-059'] === 'done', status.work_orders?.['WO-059']);
check('status.next-production-build-safe', 'Post-P11 planning/control remains valid while commercial-readiness runtime work is active', status.next_work_order === null || Number.parseInt(String(status.next_work_order || '').replace('WO-', ''), 10) >= 61, status.next_work_order);
check('status.checkpoint-production-build-safe', 'P11 or commercial-readiness checkpoint remains current', ['P11', 'CR-0', 'CR-1', 'CR-2', 'CR-3', 'CR-4'].includes(status.current_checkpoint), status.current_checkpoint);
check('work-order.file', 'WO-059 work-order file exists', exists('work_orders/WO-059_clinicos_live_integration_review_intake.md'), 'work_orders/WO-059_clinicos_live_integration_review_intake.md');
check('work-order.index', 'Work-order index records WO-059 completion', workOrderIndex.includes('WO-059') && workOrderIndex.includes('ClinicOS live integration'), 'work_orders/README.md');
check('plan.wo059', 'Production build plan includes WO-059', plan.includes('## WO-059 ') && plan.includes('ClinicOS Live Integration'), 'docs/PRODUCTION_BUILD_PLAN.md');
check('continuation.promoted', 'Continuation plan records ClinicOS live integration review as promoted to WO-059', continuation.includes('Promoted as `WO-059`') && continuation.includes('ClinicOS live integration review'), 'docs/POST_P11_CONTINUATION_PLAN.md');
check('clinicos-review.exists', 'Production ClinicOS live integration review document exists', exists('docs/PRODUCTION_CLINICOS_LIVE_INTEGRATION_REVIEW.md'), 'docs/PRODUCTION_CLINICOS_LIVE_INTEGRATION_REVIEW.md');

[
  'Live ClinicOS module contracts',
  'Delegated identity and permission boundary',
  'Tenant, site, user, and patient mapping',
  'Event-bus delivery and replay semantics',
  'Module-specific handoff boundaries',
  'Degraded mode and offline behavior',
  'Audit, observability, and incident response',
  'Data Cloud and analytics boundaries'
].forEach((snippet) => {
  check(`clinicos-review.decision.${snippet.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, `ClinicOS review includes decision: ${snippet}`, clinicosReview.includes(snippet), snippet);
});

[
  'clinicos.module_contract_reviewed.v1',
  'clinicos.service_account_configured.v1',
  'clinicos.service_account_disabled.v1',
  'clinicos.delegated_identity_reviewed.v1',
  'clinicos.tenant_mapping_reviewed.v1',
  'clinicos.site_mapping_reviewed.v1',
  'clinicos.user_mapping_reviewed.v1',
  'clinicos.patient_mapping_reviewed.v1',
  'clinicos.visitgraph_mapping_reviewed.v1',
  'clinicos.workos_task_mapping_reviewed.v1',
  'clinicos.charge_integrity_mapping_reviewed.v1',
  'clinicos.copilot_context_mapping_reviewed.v1',
  'clinicos.ai_governance_mapping_reviewed.v1',
  'clinicos.integration_hub_mapping_reviewed.v1',
  'clinicos.data_cloud_mapping_reviewed.v1',
  'clinicos.event_publication_authorized.v1',
  'clinicos.event_publication_denied.v1',
  'clinicos.event_publication_failed.v1',
  'clinicos.event_replay_requested.v1',
  'clinicos.reconciliation_completed.v1',
  'clinicos.degraded_mode_entered.v1',
  'clinicos.incident_recorded.v1'
].forEach((eventName) => {
  check(`clinicos-review.event.${eventName}`, `ClinicOS review includes future event ${eventName}`, clinicosReview.includes(eventName), eventName);
});

check(
  'spec-gaps.current',
  'SPEC_GAPS reflects post-WO-059 or later with no active gaps',
  specGaps.includes('No active gaps as of post-`WO-059` ClinicOS live integration review intake') ||
    specGaps.includes('No active gaps as of post-`WO-060` commercial readiness rebaseline/runtime rails review') ||
    specGaps.includes('No active gaps as of post-`WO-061` runtime persistence switchover review') ||
    specGaps.includes('No active gaps as of post-`WO-062` API runtime hardening and request-boundary review') ||
    specGaps.includes('No active gaps as of post-`WO-063` identity runtime boundary review') ||
    specGaps.includes('No active gaps as of post-`WO-069` athenahealth sandbox and vendor-neutral EHR runtime boundary review') ||
    specGaps.includes('No active gaps as of post-`WO-070` AI governance runtime boundary review') ||
    specGaps.includes('No active gaps as of post-`WO-075` commercial readiness decision gate review') ||
    specGaps.includes('No active gaps as of post-`WO-076` post-CR4 launch governance intake review'),
  'SPEC_GAPS.md'
);
check('spec-gaps.deferred-clinicos', 'SPEC_GAPS preserves ClinicOS live integration contracts and event-bus delivery as deferred before live use', specGaps.includes('ClinicOS live integration contracts and event-bus delivery') && specGaps.includes('future approved ClinicOS implementation work order'), 'SPEC_GAPS.md');
check('runlog.wo059', 'RUN_LOG records WO-059 evidence', runLog.includes('WO-059 ClinicOS live integration review intake'), 'RUN_LOG.md');
check('package.script', 'package.json exposes ClinicOS live review readiness script', packageJson.scripts?.['clinicos:live-review-readiness'] === 'node scripts/validate-clinicos-live-review-readiness.js', packageJson.scripts?.['clinicos:live-review-readiness']);
check('ci.script', 'CI runs ClinicOS live review readiness before post-P11 readiness', workflow.includes('pnpm clinicos:live-review-readiness') && workflow.indexOf('pnpm clinicos:live-review-readiness') < workflow.indexOf('pnpm post-p11:readiness'), '.github/workflows/ci.yml');

[
  'liveClinicosCredentials=true',
  'liveClinicosEventBusEnabled=true',
  'delegatedIdentityBypassEnabled=true',
  'rawClinicosPayloadStorageEnabled=true',
  'liveClinicosSynchronizationEnabled=true',
  'clinicosPermissionBypassEnabled=true',
  'runtimeClinicosBehaviorEnabled=true',
  'claimSubmissionEnabled=true',
  'chargeFinalizationEnabled=true',
  'medicalNecessityDeterminationEnabled=true',
  'clinicosProductionLaunchApproved=true',
  'productionLaunchApproved=true'
].forEach((needle) => {
  check(`prohibited.${needle}`, `WO-059 files do not enable ${needle}`, ![plan, continuation, clinicosReview, runLog].some((contents) => contents.includes(needle)), needle);
});

const failed = checks.filter((item) => !item.passed);
const result = {
  status: failed.length === 0 ? 'ready_clinicos_live_review_planning_only' : 'blocked',
  checkedAt: new Date().toISOString(),
  workOrder: 'WO-059',
  nextWorkOrder: status.next_work_order,
  liveClinicosCredentials: false,
  liveClinicosEventBusEnabled: false,
  delegatedIdentityBypassEnabled: false,
  rawClinicosPayloadStorageEnabled: false,
  runtimeClinicosBehaviorEnabled: false,
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
