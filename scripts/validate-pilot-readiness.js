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
const pilotDoc = read('docs/PILOT_LAUNCH_READINESS.md');
const runbook = read('docs/runbooks/WO-050_BETA_PILOT_RUNBOOK.md');
const checkpointReport = read('CHECKPOINT_REPORT.md');
const testPlan = read('docs/TEST_PLAN.md');
const backendSpec = read('docs/BACKEND_BUILD_SPEC.md');
const uxSpec = read('docs/UX_BUILD_SPEC.md');
const dataModel = read('docs/DATA_MODEL.md');
const events = read('docs/API_EVENT_CONTRACTS.md');
const rbac = read('docs/RBAC_ABAC_MATRIX.md');
const standaloneModes = read('docs/STANDALONE_AND_CLINICOS_MODES.md');
const aiPhi = read('docs/AI_PHI_GOVERNANCE.md');
const specGaps = read('SPEC_GAPS.md');
const runLog = read('RUN_LOG.md');
const workOrderReadme = read('work_orders/README.md');

const checks = [];

function check(id, description, passed, evidence) {
  checks.push({ id, description, passed: Boolean(passed), evidence });
}

check(
  'package.pilot-script',
  'pilot:readiness command exists and runs smoke, frontend runtime, and verifier gates',
  packageJson.scripts?.['pilot:readiness'] ===
    'node scripts/simulate-pilot-launch-smoke.js && pnpm frontend:runtime-integration-readiness && node scripts/validate-pilot-readiness.js',
  packageJson.scripts?.['pilot:readiness']
);
check(
  'package.launch-script',
  'launch:readiness command chains launch ops and pilot readiness',
  packageJson.scripts?.['launch:readiness'] === 'pnpm launch:ops-readiness && pnpm pilot:readiness',
  packageJson.scripts?.['launch:readiness']
);
check('ci.launch-readiness', 'CI runs launch readiness gate', workflow.includes('pnpm launch:readiness'), '.github/workflows/ci.yml');
check('script.smoke-exists', 'Pilot launch smoke simulator exists', exists('scripts/simulate-pilot-launch-smoke.js'), 'scripts/simulate-pilot-launch-smoke.js');
check('doc.pilot-exists', 'Pilot launch readiness document exists', exists('docs/PILOT_LAUNCH_READINESS.md'), 'docs/PILOT_LAUNCH_READINESS.md');
check('doc.runbook-exists', 'WO-050 beta pilot runbook exists', exists('docs/runbooks/WO-050_BETA_PILOT_RUNBOOK.md'), 'docs/runbooks/WO-050_BETA_PILOT_RUNBOOK.md');
check('work-order.wo051-file', 'WO-051 work-order file exists for the next gate', exists('work_orders/WO-051_claim_submission_payer_integration_decision_gate.md'), 'work_orders/WO-051_claim_submission_payer_integration_decision_gate.md');

[
  'Pilot Launch Gate',
  'Tenant Onboarding',
  'Role Training',
  'Disabled Feature Inventory',
  'First-Week Monitoring',
  'Go/No-Go Approvals',
  'productionLaunchApproved=false',
  'submittedClaim=false'
].forEach((snippet) => {
  check(`support-page.${snippet}`, `Support page exposes ${snippet}`, supportPage.includes(snippet), snippet);
  check(`browser.${snippet}`, `Browser test asserts ${snippet}`, browserSpec.includes(snippet), snippet);
});

[
  'tenant onboarding/provisioning checklist',
  'role-training checklist',
  'disabled feature inventory',
  'first-week monitoring plan',
  'support escalation path',
  'rollback criteria',
  'go/no-go checklist',
  'founder/clinical/compliance/security approval',
  'productionLaunchApproved=false',
  'submittedClaim=false'
].forEach((snippet) => {
  check(`pilot-doc.${snippet}`, `Pilot readiness doc includes ${snippet}`, pilotDoc.includes(snippet), snippet);
});

[
  'limited pilot entry criteria',
  'tenant onboarding',
  'role training',
  'first-week monitoring',
  'rollback criteria',
  'approval placeholders',
  'stop conditions'
].forEach((snippet) => {
  check(`runbook.${snippet}`, `Runbook includes ${snippet}`, runbook.includes(snippet), snippet);
});

[
  ['docs.PRODUCTION_BUILD_PLAN', productionPlan, 'Implementation status as of `WO-050`'],
  ['docs.TEST_PLAN', testPlan, 'WO-050 beta pilot and limited launch gate'],
  ['docs.BACKEND_BUILD_SPEC', backendSpec, 'WO-050 beta pilot and limited launch gate'],
  ['docs.UX_BUILD_SPEC', uxSpec, '`WO-050` extends `/aura-note/support/status`'],
  ['docs.DATA_MODEL', dataModel, '`WO-050` adds no PHI-bearing persistence'],
  ['docs.API_EVENT_CONTRACTS', events, 'launch.signoff_placeholder_recorded.v1'],
  ['docs.RBAC_ABAC_MATRIX', rbac, 'launch_pilot:view'],
  ['docs.STANDALONE_AND_CLINICOS_MODES', standaloneModes, 'WO-050 beta pilot launch gate'],
  ['docs.AI_PHI_GOVERNANCE', aiPhi, 'WO-050 beta pilot launch gate'],
  ['work_orders.README', workOrderReadme, '`WO-050` is complete'],
  ['CHECKPOINT_REPORT', checkpointReport, 'P10 — Launch Candidate'],
  ['RUN_LOG', runLog, 'WO-050 beta pilot and limited launch gate'],
  ['SPEC_GAPS', specGaps, 'No active gaps as of post-`WO-050` beta pilot launch gate and P10 review']
].forEach(([id, contents, snippet]) => {
  const passed =
    id !== 'SPEC_GAPS'
      ? contents.includes(snippet)
      : contents.includes(snippet) ||
        contents.includes('No active gaps as of post-`WO-051` claim/payer decision gate and P11 review') ||
        contents.includes('No active gaps as of post-`WO-052` post-P11 continuation rails review') ||
        contents.includes('No active gaps as of post-`WO-053` production identity/account lifecycle review intake');
  check(id, `${id} includes ${snippet} or later P11 no-active-gap evidence`, passed, snippet);
});

check('status.wo050-done', 'WO-050 is marked done', status.work_orders?.['WO-050'] === 'done', status.work_orders?.['WO-050']);
check('status.wo051-next-or-done', 'WO-051 is next active work order or already completed', (status.next_work_order === 'WO-051' && status.work_orders?.['WO-051'] === 'todo') || (status.next_work_order === null && status.work_orders?.['WO-051'] === 'done'), {
  next_work_order: status.next_work_order,
  WO051: status.work_orders?.['WO-051']
});

const prohibitedLaunchClaims = [
  'production launch approved',
  'production deployed',
  'productionLaunchApproved=true',
  'HIPAA compliant',
  'claim submission enabled',
  'submittedClaim=true',
  'live PHI enabled',
  'production traffic: true'
];

const latestRunLogSection = runLog.split('WO-050 beta pilot and limited launch gate').pop() ?? runLog;
const launchCorpus = [pilotDoc, runbook, supportPage, latestRunLogSection, checkpointReport, status.notes ?? ''].join('\n');
const lowerCorpus = launchCorpus.toLowerCase();
const foundProhibitedClaims = prohibitedLaunchClaims.filter((claim) => lowerCorpus.includes(claim.toLowerCase()));
check('safety.no-prohibited-launch-claims', 'WO-050 does not claim production launch or prohibited live behavior', foundProhibitedClaims.length === 0, foundProhibitedClaims);

const failed = checks.filter((item) => !item.passed);
const result = {
  status: failed.length === 0 ? 'ready_for_limited_launch_decision' : 'blocked',
  workOrder: 'WO-050',
  evidenceType: 'synthetic_beta_pilot_launch_gate',
  p10CheckpointCompleteForDecisionPackage: failed.length === 0,
  productionLaunchApproved: false,
  productionDeploymentExecuted: false,
  productionCredentials: false,
  livePhiOrVendorTouched: false,
  claimSubmission: false,
  nextWorkOrder: status.next_work_order,
  totalChecks: checks.length,
  passedChecks: checks.length - failed.length,
  failedChecks: failed.length,
  failures: failed
};

console.log(JSON.stringify(result, null, 2));

if (failed.length > 0) {
  process.exitCode = 1;
}
