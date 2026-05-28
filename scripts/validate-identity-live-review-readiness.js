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
const identityReview = readText('docs/PRODUCTION_IDENTITY_ACCOUNT_LIFECYCLE_REVIEW.md');
const workOrderIndex = readText('work_orders/README.md');
const specGaps = readText('SPEC_GAPS.md');
const runLog = readText('RUN_LOG.md');

const checks = [];

function check(id, description, passed, evidence) {
  checks.push({ id, description, passed: Boolean(passed), evidence });
}

check('status.wo053-done', 'WO-053 is marked done', status.work_orders?.['WO-053'] === 'done', status.work_orders?.['WO-053']);
check('status.next-null', 'No next work order is active after WO-053 planning/control completion', status.next_work_order === null, status.next_work_order);
check('status.p11-retained', 'P11 remains current checkpoint', status.current_checkpoint === 'P11', status.current_checkpoint);
check('work-order.file', 'WO-053 work-order file exists', exists('work_orders/WO-053_production_identity_account_lifecycle_review_intake.md'), 'work_orders/WO-053_production_identity_account_lifecycle_review_intake.md');
check('work-order.index', 'Work-order index records WO-053 completion', workOrderIndex.includes('WO-053') && workOrderIndex.includes('production identity'), 'work_orders/README.md');
check('plan.wo053', 'Production build plan includes WO-053', plan.includes('## WO-053 ') && plan.includes('Production Identity'), 'docs/PRODUCTION_BUILD_PLAN.md');
check('continuation.promoted', 'Continuation plan records production identity as promoted to WO-053', continuation.includes('Promoted as `WO-053`') && continuation.includes('Production identity'), 'docs/POST_P11_CONTINUATION_PLAN.md');
check('identity-review.exists', 'Production identity review document exists', exists('docs/PRODUCTION_IDENTITY_ACCOUNT_LIFECYCLE_REVIEW.md'), 'docs/PRODUCTION_IDENTITY_ACCOUNT_LIFECYCLE_REVIEW.md');

[
  'Production identity provider',
  'MFA requirements',
  'Disabled-user source of truth',
  'Session timeout',
  'Break-glass policy',
  'Support access boundaries',
  'Access-review cadence',
  'ClinicOS delegated identity mapping',
  'Secret manager'
].forEach((snippet) => {
  check(`identity-review.decision.${snippet.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, `Identity review includes decision: ${snippet}`, identityReview.includes(snippet), snippet);
});

[
  'identity.user_provisioned.v1',
  'identity.user_disabled.v1',
  'identity.role_assigned.v1',
  'identity.delegated_identity_denied.v1',
  'identity.break_glass_approved.v1',
  'identity.support_access_closed.v1',
  'identity.access_review_completed.v1'
].forEach((eventName) => {
  check(`identity-review.event.${eventName}`, `Identity review includes future event ${eventName}`, identityReview.includes(eventName), eventName);
});

check(
  'spec-gaps.current',
  'SPEC_GAPS reflects post-WO-053 or later post-P11 planning/control with no active gaps',
    specGaps.includes('No active gaps as of post-`WO-053` production identity/account lifecycle review intake') ||
    specGaps.includes('No active gaps as of post-`WO-054` production PHI persistence/database operations review intake') ||
    specGaps.includes('No active gaps as of post-`WO-055` production Azure storage/deletion/restore review intake') ||
    specGaps.includes('No active gaps as of post-`WO-056` live transcription provider review intake') ||
    specGaps.includes('No active gaps as of post-`WO-057` external AI private/BAA pathway review intake') ||
    specGaps.includes('No active gaps as of post-`WO-058` production EHR writeback credentialing review intake'),
  'SPEC_GAPS.md'
);
check('spec-gaps.deferred-identity', 'SPEC_GAPS preserves production identity as deferred before live use', specGaps.includes('Production identity provider and account lifecycle') && specGaps.includes('future approved identity implementation work order'), 'SPEC_GAPS.md');
check('runlog.wo053', 'RUN_LOG records WO-053 evidence', runLog.includes('WO-053 production identity and account lifecycle review intake'), 'RUN_LOG.md');
check('package.script', 'package.json exposes identity live-review readiness script', packageJson.scripts?.['identity:live-review-readiness'] === 'node scripts/validate-identity-live-review-readiness.js', packageJson.scripts?.['identity:live-review-readiness']);
check('ci.script', 'CI runs identity live-review readiness before post-P11 readiness', workflow.includes('pnpm identity:live-review-readiness') && workflow.indexOf('pnpm identity:live-review-readiness') < workflow.indexOf('pnpm post-p11:readiness'), '.github/workflows/ci.yml');

[
  'productionIdentityProviderEnabled=true',
  'liveOidcEnabled=true',
  'liveSamlEnabled=true',
  'clinicosDelegatedIdentityEnabled=true',
  'productionCredentials=true',
  'productionPhi=true',
  'productionLaunchApproved=true',
  'breakGlassRuntimeEnabled=true'
].forEach((needle) => {
  check(`prohibited.${needle}`, `WO-053 files do not enable ${needle}`, ![plan, continuation, identityReview, runLog].some((contents) => contents.includes(needle)), needle);
});

const failed = checks.filter((item) => !item.passed);
const result = {
  status: failed.length === 0 ? 'ready_identity_live_review_planning_only' : 'blocked',
  checkedAt: new Date().toISOString(),
  workOrder: 'WO-053',
  nextWorkOrder: status.next_work_order,
  liveIdentityEnabled: false,
  productionCredentials: false,
  productionPhi: false,
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
