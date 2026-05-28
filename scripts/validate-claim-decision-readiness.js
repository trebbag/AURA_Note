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
const decisionDoc = read('docs/CLAIM_PAYER_DECISION_GATE.md');
const runbook = read('docs/runbooks/WO-051_CLAIM_PAYER_DECISION_RUNBOOK.md');
const supportPage = read('apps/web/app/aura-note/support/status/page.tsx');
const browserSpec = read('apps/web/e2e/aura-note-routes.spec.ts');
const productionPlan = read('docs/PRODUCTION_BUILD_PLAN.md');
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
const checkpointReport = read('CHECKPOINT_REPORT.md');
const workOrderReadme = read('work_orders/README.md');
const scheduleTests = read('apps/api/src/schedule/schedule.service.test.ts') + '\n' + read('apps/api/src/schedule/schedule.e2e.test.ts');
const operationsPage = read('apps/web/app/aura-note/operations/page.tsx');
const openApi = read('packages/contracts/openapi/aura-note.v1.yaml');

const checks = [];

function check(id, description, passed, evidence) {
  checks.push({ id, description, passed: Boolean(passed), evidence });
}

check(
  'package.claim-decision-script',
  'claim-decision readiness command exists',
  packageJson.scripts?.['claim-decision:readiness'] === 'node scripts/validate-claim-decision-readiness.js',
  packageJson.scripts?.['claim-decision:readiness']
);
check('ci.claim-decision', 'CI runs claim decision readiness before production readiness', workflow.includes('pnpm claim-decision:readiness'), '.github/workflows/ci.yml');
check('doc.decision-exists', 'Claim/payer decision document exists', exists('docs/CLAIM_PAYER_DECISION_GATE.md'), 'docs/CLAIM_PAYER_DECISION_GATE.md');
check('doc.runbook-exists', 'WO-051 claim/payer runbook exists', exists('docs/runbooks/WO-051_CLAIM_PAYER_DECISION_RUNBOOK.md'), 'docs/runbooks/WO-051_CLAIM_PAYER_DECISION_RUNBOOK.md');

[
  'submittedClaim=false',
  'claimSubmissionEnabled=false',
  'chargeFinalizationEnabled=false',
  'medicalNecessityDeterminationEnabled=false',
  'denialAutomationEnabled=false',
  'paymentPostingEnabled=false',
  'patientFinancialConclusionEnabled=false',
  'Option A: Keep claim submission out of AURA Note v1',
  'Future implementation criteria',
  'Prohibited current behavior',
  'P11 decision result'
].forEach((snippet) => {
  check(`decision-doc.${snippet}`, `Decision doc includes ${snippet}`, decisionDoc.includes(snippet), snippet);
});

[
  'limited decision entry criteria',
  'review participants',
  'decision checklist',
  'current safe default',
  'stop conditions',
  'follow-up work order criteria'
].forEach((snippet) => {
  check(`runbook.${snippet}`, `Runbook includes ${snippet}`, runbook.includes(snippet), snippet);
});

[
  'Claim/Payer Decision Gate',
  'Draft Claim Boundary',
  'No Live Clearinghouse',
  'No Payer API',
  'No Denial Automation',
  'No Payment Posting',
  'submittedClaim=false',
  'claimSubmissionEnabled=false'
].forEach((snippet) => {
  check(`support-page.${snippet}`, `Support page exposes ${snippet}`, supportPage.includes(snippet), snippet);
  check(`browser.${snippet}`, `Browser test asserts ${snippet}`, browserSpec.includes(snippet), snippet);
});

[
  ['docs.PRODUCTION_BUILD_PLAN', productionPlan, 'Implementation status as of `WO-051`'],
  ['docs.TEST_PLAN', testPlan, 'WO-051 claim/payer decision gate'],
  ['docs.BACKEND_BUILD_SPEC', backendSpec, 'WO-051 claim/payer decision gate'],
  ['docs.UX_BUILD_SPEC', uxSpec, '`WO-051` extends `/aura-note/support/status`'],
  ['docs.DATA_MODEL', dataModel, '`WO-051` adds no claim-submission persistence'],
  ['docs.API_EVENT_CONTRACTS', events, 'claim.strategy_decision_recorded.v1'],
  ['docs.RBAC_ABAC_MATRIX', rbac, 'claim_strategy:view'],
  ['docs.STANDALONE_AND_CLINICOS_MODES', standaloneModes, 'WO-051 claim/payer decision gate'],
  ['docs.AI_PHI_GOVERNANCE', aiPhi, 'WO-051 claim/payer decision gate'],
  ['work_orders.README', workOrderReadme, '`WO-051` is complete'],
  ['CHECKPOINT_REPORT', checkpointReport, 'P11 — Claim/Payer Decision Gate'],
  ['RUN_LOG', runLog, 'WO-051 claim/payer decision gate'],
  ['SPEC_GAPS', specGaps, 'No active gaps as of post-`WO-051` claim/payer decision gate and P11 review']
].forEach(([id, contents, snippet]) => {
  const passed =
    id !== 'SPEC_GAPS'
      ? contents.includes(snippet)
      : contents.includes(snippet) ||
        contents.includes('No active gaps as of post-`WO-052` post-P11 continuation rails review') ||
        contents.includes('No active gaps as of post-`WO-053` production identity/account lifecycle review intake') ||
        contents.includes('No active gaps as of post-`WO-054` production PHI persistence/database operations review intake') ||
        contents.includes('No active gaps as of post-`WO-055` production Azure storage/deletion/restore review intake') ||
        contents.includes('No active gaps as of post-`WO-056` live transcription provider review intake') ||
        contents.includes('No active gaps as of post-`WO-057` external AI private/BAA pathway review intake') ||
        contents.includes('No active gaps as of post-`WO-058` production EHR writeback credentialing review intake');
  check(id, `${id} includes ${snippet} or later post-P11 no-active-gap evidence`, passed, snippet);
});

check('status.wo051-done', 'WO-051 is marked done', status.work_orders?.['WO-051'] === 'done', status.work_orders?.['WO-051']);
check('status.no-next-work-order', 'No next work order remains after P11 decision gate', status.next_work_order === null, status.next_work_order);
check('status.p11', 'Current checkpoint remains P11', status.current_checkpoint === 'P11', status.current_checkpoint);

check('tests.submitted-claim-false', 'Existing tests prove draft claim preview remains unsubmitted', scheduleTests.includes('submittedClaim') && scheduleTests.includes('false'), 'schedule service/e2e tests');
check('ux.operations-claim-boundary', 'Operations route keeps claim submission disabled', operationsPage.includes('Claim submission remains disabled.'), 'apps/web/app/aura-note/operations/page.tsx');
check('openapi.no-claim-submit-route', 'OpenAPI does not expose a live claim submission route', !openApi.includes('/claims/submit') && !openApi.includes('submitClaim'), 'packages/contracts/openapi/aura-note.v1.yaml');

const latestRunLogSection = runLog.split('WO-051 claim/payer decision gate').pop() ?? runLog;
const corpus = [decisionDoc, runbook, supportPage, latestRunLogSection, checkpointReport, status.notes ?? ''].join('\n');
const prohibitedClaims = [
  'claim submission enabled',
  'submittedClaim=true',
  'live clearinghouse enabled',
  'payer API enabled',
  'denial automation enabled',
  'payment posting enabled',
  'medical necessity determination enabled',
  'charge finalization enabled',
  'patient financial conclusion enabled',
  'production payer credential present',
  'production payer credentials present',
  'live claim submitted'
];
const foundProhibitedClaims = prohibitedClaims.filter((claim) => corpus.toLowerCase().includes(claim.toLowerCase()));
check('safety.no-prohibited-claim-claims', 'WO-051 does not claim live claim/payer behavior', foundProhibitedClaims.length === 0, foundProhibitedClaims);

const failed = checks.filter((item) => !item.passed);
const result = {
  status: failed.length === 0 ? 'ready_decision_recorded_no_live_claims' : 'blocked',
  workOrder: 'WO-051',
  evidenceType: 'synthetic_claim_payer_decision_gate',
  p11CheckpointCompleteForDecisionPackage: failed.length === 0,
  submittedClaim: false,
  claimSubmissionEnabled: false,
  liveClearinghouseTouched: false,
  livePayerTouched: false,
  denialAutomationEnabled: false,
  paymentPostingEnabled: false,
  medicalNecessityDeterminationEnabled: false,
  chargeFinalizationEnabled: false,
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
