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

const packageJson = JSON.parse(read('package.json'));
const status = JSON.parse(read('repo_status.json'));
const workflow = read('.github/workflows/ci.yml');
const supportPage = read('apps/web/app/aura-note/support/status/page.tsx');
const browserSpec = read('apps/web/e2e/aura-note-routes.spec.ts');
const productionPlan = read('docs/PRODUCTION_BUILD_PLAN.md');
const launchOpsDoc = read('docs/LAUNCH_OPERATIONS_READINESS.md');
const runbook = read('docs/runbooks/WO-049_LAUNCH_OPS_RUNBOOK.md');
const testPlan = read('docs/TEST_PLAN.md');
const backendSpec = read('docs/BACKEND_BUILD_SPEC.md');
const uxSpec = read('docs/UX_BUILD_SPEC.md');
const dataModel = read('docs/DATA_MODEL.md');
const events = read('docs/API_EVENT_CONTRACTS.md');
const rbac = read('docs/RBAC_ABAC_MATRIX.md');
const standaloneModes = read('docs/STANDALONE_AND_CLINICOS_MODES.md');
const specGaps = read('SPEC_GAPS.md');
const runLog = read('RUN_LOG.md');
const workOrderReadme = read('work_orders/README.md');

const checks = [];

function check(id, description, passed, evidence) {
  checks.push({ id, description, passed: Boolean(passed), evidence });
}

check(
  'package.launch-script',
  'launch:ops-readiness command exists and includes performance, browser, and verifier gates',
  packageJson.scripts?.['launch:ops-readiness'] ===
    'pnpm performance:launch-baseline && pnpm --filter @aura-note/web test:e2e && node scripts/validate-launch-ops-readiness.js',
  packageJson.scripts?.['launch:ops-readiness']
);

check(
  'package.performance-script',
  'performance launch baseline command exists',
  packageJson.scripts?.['performance:launch-baseline'] === 'node scripts/simulate-launch-performance-baseline.js',
  packageJson.scripts?.['performance:launch-baseline']
);

check('ci.launch-gate', 'CI runs launch ops readiness directly or through launch readiness before production readiness', workflow.includes('pnpm launch:ops-readiness') || workflow.includes('pnpm launch:readiness'), '.github/workflows/ci.yml');
check('script.performance-exists', 'Synthetic performance harness exists', exists('scripts/simulate-launch-performance-baseline.js'), 'scripts/simulate-launch-performance-baseline.js');
check('doc.launch-ops-exists', 'Launch operations readiness document exists', exists('docs/LAUNCH_OPERATIONS_READINESS.md'), 'docs/LAUNCH_OPERATIONS_READINESS.md');
check('doc.runbook-exists', 'WO-049 launch ops runbook exists', exists('docs/runbooks/WO-049_LAUNCH_OPS_RUNBOOK.md'), 'docs/runbooks/WO-049_LAUNCH_OPS_RUNBOOK.md');

[
  'productionLaunchReady=false',
  'synthetic_load_baseline',
  'Rollback rehearsal',
  'Vendor outage drill',
  'Access review drill',
  'no production traffic'
].forEach((snippet) => {
  check(`support-page.${snippet}`, `Support page exposes ${snippet}`, supportPage.includes(snippet), snippet);
  check(`browser.${snippet}`, `Browser test asserts ${snippet}`, browserSpec.includes(snippet), snippet);
});

[
  'local/staging/production environment matrix',
  'release promotion ladder',
  'rollback rehearsal',
  'synthetic performance baseline',
  'reliability drill catalog',
  'incident response',
  'access review',
  'support escalation',
  'productionLaunchReady=false',
  'no production deployment'
].forEach((snippet) => {
  check(`launch-doc.${snippet}`, `Launch ops doc includes ${snippet}`, launchOpsDoc.includes(snippet), snippet);
});

[
  'build, migrate, smoke, rollback',
  'failure drill',
  'disabled vendor',
  'retention deletion recovery window',
  'support escalation',
  'founder/clinical/compliance/security approval'
].forEach((snippet) => {
  check(`runbook.${snippet}`, `Runbook includes ${snippet}`, runbook.includes(snippet), snippet);
});

[
  ['docs.PRODUCTION_BUILD_PLAN', productionPlan, 'Implementation status as of `WO-049`'],
  ['docs.TEST_PLAN', testPlan, 'WO-049 launch operations readiness'],
  ['docs.BACKEND_BUILD_SPEC', backendSpec, 'WO-049 launch operations readiness'],
  ['docs.UX_BUILD_SPEC', uxSpec, '`WO-049` extends `/aura-note/support/status`'],
  ['docs.DATA_MODEL', dataModel, '`WO-049` adds no new PHI-bearing persistence'],
  ['docs.API_EVENT_CONTRACTS', events, 'deployment.smoke_checked.v1'],
  ['docs.RBAC_ABAC_MATRIX', rbac, 'launch_operations:view'],
  ['docs.STANDALONE_AND_CLINICOS_MODES', standaloneModes, 'WO-049 launch operations readiness'],
  ['work_orders.README', workOrderReadme, '`WO-049` is complete'],
  ['RUN_LOG', runLog, 'WO-049 launch operations readiness'],
  ['SPEC_GAPS', specGaps, 'No active gaps as of post-`WO-049` launch operations readiness review']
].forEach(([id, contents, snippet]) => {
  const passed =
    id !== 'SPEC_GAPS'
      ? contents.includes(snippet)
      : contents.includes(snippet) ||
        contents.includes('No active gaps as of post-`WO-050` beta pilot launch gate and P10 review') ||
        contents.includes('No active gaps as of post-`WO-051` claim/payer decision gate and P11 review') ||
        contents.includes('No active gaps as of post-`WO-052` post-P11 continuation rails review') ||
        contents.includes('No active gaps as of post-`WO-053` production identity/account lifecycle review intake') ||
        contents.includes('No active gaps as of post-`WO-054` production PHI persistence/database operations review intake');
  check(id, `${id} includes ${snippet} or later P10 no-active-gap evidence`, passed, snippet);
});

check('status.wo049-done', 'WO-049 is marked done', status.work_orders?.['WO-049'] === 'done', status.work_orders?.['WO-049']);
check('status.wo050-or-later', 'Repo status is advanced to WO-050 or later while WO-049 remains done', (status.next_work_order === null || ['WO-050', 'WO-051'].includes(status.next_work_order)) && ['todo', 'done'].includes(status.work_orders?.['WO-050']), {
  next_work_order: status.next_work_order,
  WO050: status.work_orders?.['WO-050']
});

const prohibitedLaunchClaims = [
  'production launch approved',
  'production deployed',
  'HIPAA compliant',
  'claim submission enabled',
  'live PHI enabled',
  'production traffic: true'
];

const launchCorpus = [launchOpsDoc, runbook, supportPage, runLog, status.notes ?? ''].join('\n').toLowerCase();
const foundProhibitedClaims = prohibitedLaunchClaims.filter((claim) => launchCorpus.includes(claim));
check('safety.no-prohibited-launch-claims', 'WO-049 does not claim production launch or prohibited live behavior', foundProhibitedClaims.length === 0, foundProhibitedClaims);

const failed = checks.filter((item) => !item.passed);
const result = {
  status: failed.length === 0 ? 'ready_synthetic' : 'blocked',
  workOrder: 'WO-049',
  evidenceType: 'synthetic_launch_operations_readiness',
  launchCandidateApproved: false,
  productionDeploymentExecuted: false,
  productionCredentials: false,
  livePhiOrVendorTouched: false,
  claimSubmission: false,
  totalChecks: checks.length,
  passedChecks: checks.length - failed.length,
  failedChecks: failed.length,
  failures: failed
};

console.log(JSON.stringify(result, null, 2));

if (failed.length > 0) {
  process.exitCode = 1;
}
