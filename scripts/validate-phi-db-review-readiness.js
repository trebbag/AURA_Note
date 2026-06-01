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
const dbReview = readText('docs/PRODUCTION_PHI_PERSISTENCE_DATABASE_OPERATIONS_REVIEW.md');
const workOrderIndex = readText('work_orders/README.md');
const specGaps = readText('SPEC_GAPS.md');
const runLog = readText('RUN_LOG.md');

const checks = [];

function check(id, description, passed, evidence) {
  checks.push({ id, description, passed: Boolean(passed), evidence });
}

check('status.wo054-done', 'WO-054 is marked done', status.work_orders?.['WO-054'] === 'done', status.work_orders?.['WO-054']);
check('status.next-production-build-safe', 'Post-P11 planning/control remains valid while commercial-readiness runtime work is active', status.next_work_order === null || Number.parseInt(String(status.next_work_order || '').replace('WO-', ''), 10) >= 61, status.next_work_order);
check('status.checkpoint-production-build-safe', 'P11 or commercial-readiness checkpoint remains current', status.current_checkpoint === 'P11' || status.current_checkpoint === 'CR-0' || status.current_checkpoint === 'CR-1' || status.current_checkpoint === 'CR-2' || status.current_checkpoint === 'CR-3', status.current_checkpoint);
check('work-order.file', 'WO-054 work-order file exists', exists('work_orders/WO-054_production_phi_persistence_database_ops_review_intake.md'), 'work_orders/WO-054_production_phi_persistence_database_ops_review_intake.md');
check('work-order.index', 'Work-order index records WO-054 completion', workOrderIndex.includes('WO-054') && workOrderIndex.includes('PHI persistence'), 'work_orders/README.md');
check('plan.wo054', 'Production build plan includes WO-054', plan.includes('## WO-054 ') && plan.includes('Production PHI Persistence'), 'docs/PRODUCTION_BUILD_PLAN.md');
check('continuation.promoted', 'Continuation plan records PHI persistence/database operations as promoted to WO-054', continuation.includes('Promoted as `WO-054`') && continuation.includes('Production PHI persistence'), 'docs/POST_P11_CONTINUATION_PLAN.md');
check('db-review.exists', 'Production PHI persistence/database operations review document exists', exists('docs/PRODUCTION_PHI_PERSISTENCE_DATABASE_OPERATIONS_REVIEW.md'), 'docs/PRODUCTION_PHI_PERSISTENCE_DATABASE_OPERATIONS_REVIEW.md');

[
  'Production database host',
  'Encryption/KMS posture',
  'Database role model',
  'Migration approval authority',
  'Backup cadence',
  'RLS expansion policy',
  'Tenant/site isolation test plan',
  'Support database access policy',
  'Incident response'
].forEach((snippet) => {
  check(`db-review.decision.${snippet.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, `Database review includes decision: ${snippet}`, dbReview.includes(snippet), snippet);
});

[
  'database.migration_approved.v1',
  'database.migration_applied.v1',
  'database.migration_rolled_back.v1',
  'database.backup_completed.v1',
  'database.restore_drill_completed.v1',
  'database.rls_policy_verified.v1',
  'database.tenant_isolation_verified.v1',
  'database.support_access_opened.v1',
  'database.support_access_closed.v1',
  'database.data_export_completed.v1',
  'database.incident_recorded.v1'
].forEach((eventName) => {
  check(`db-review.event.${eventName}`, `Database review includes future event ${eventName}`, dbReview.includes(eventName), eventName);
});

check(
  'spec-gaps.current',
  'SPEC_GAPS reflects post-WO-054 or later post-P11 planning/control with no active gaps',
  specGaps.includes('No active gaps as of post-`WO-054` production PHI persistence/database operations review intake') ||
    specGaps.includes('No active gaps as of post-`WO-055` production Azure storage/deletion/restore review intake') ||
    specGaps.includes('No active gaps as of post-`WO-056` live transcription provider review intake') ||
    specGaps.includes('No active gaps as of post-`WO-057` external AI private/BAA pathway review intake') ||
    specGaps.includes('No active gaps as of post-`WO-058` production EHR writeback credentialing review intake') ||
    specGaps.includes('No active gaps as of post-`WO-059` ClinicOS live integration review intake') ||
    specGaps.includes('No active gaps as of post-`WO-060` commercial readiness rebaseline/runtime rails review') ||
    specGaps.includes('No active gaps as of post-`WO-061` runtime persistence switchover review') ||
    specGaps.includes('No active gaps as of post-`WO-062` API runtime hardening and request-boundary review') ||
    specGaps.includes('No active gaps as of post-`WO-063` identity runtime boundary review') ||
    specGaps.includes('No active gaps as of post-`WO-069` athenahealth sandbox and vendor-neutral EHR runtime boundary review'),
  'SPEC_GAPS.md'
);
check('spec-gaps.deferred-db', 'SPEC_GAPS preserves production PHI persistence/database operations as deferred before live use', specGaps.includes('Production PHI persistence and database operations') && specGaps.includes('future approved database implementation work order'), 'SPEC_GAPS.md');
check('runlog.wo054', 'RUN_LOG records WO-054 evidence', runLog.includes('WO-054 production PHI persistence and database operations review intake'), 'RUN_LOG.md');
check('package.script', 'package.json exposes PHI database review readiness script', packageJson.scripts?.['persistence:phi-db-review-readiness'] === 'node scripts/validate-phi-db-review-readiness.js', packageJson.scripts?.['persistence:phi-db-review-readiness']);
check('ci.script', 'CI runs PHI database review readiness before post-P11 readiness', workflow.includes('pnpm persistence:phi-db-review-readiness') && workflow.indexOf('pnpm persistence:phi-db-review-readiness') < workflow.indexOf('pnpm post-p11:readiness'), '.github/workflows/ci.yml');

[
  'productionPhiPersistenceEnabled=true',
  'productionDatabaseCredentials=true',
  'liveMigrationEnabled=true',
  'productionDatabaseUrl=true',
  'supportDatabaseAccessEnabled=true',
  'productionBackupRestoreExecuted=true',
  'runtimeRepositoryReplacementEnabled=true',
  'productionPhi=true',
  'productionLaunchApproved=true'
].forEach((needle) => {
  check(`prohibited.${needle}`, `WO-054 files do not enable ${needle}`, ![plan, continuation, dbReview, runLog].some((contents) => contents.includes(needle)), needle);
});

const failed = checks.filter((item) => !item.passed);
const result = {
  status: failed.length === 0 ? 'ready_phi_database_review_planning_only' : 'blocked',
  checkedAt: new Date().toISOString(),
  workOrder: 'WO-054',
  nextWorkOrder: status.next_work_order,
  productionPhiPersistenceEnabled: false,
  productionDatabaseCredentials: false,
  liveMigrationEnabled: false,
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
