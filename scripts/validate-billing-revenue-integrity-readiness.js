#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const checks = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function check(id, description, passed, evidence) {
  checks.push({ id, description, passed: Boolean(passed), evidence });
}

const status = JSON.parse(read('repo_status.json'));
const doc = read('docs/BILLING_REVENUE_INTEGRITY_BOUNDARY.md');
const operationsService = read('apps/api/src/operations/operations.service.ts');
const scheduleService = read('apps/api/src/schedule/schedule.service.ts');
const supportService = read('apps/api/src/support/support.service.ts');
const operationsTest = read('apps/api/src/operations/operations.e2e.test.ts');
const supportPage = read('apps/web/app/aura-note/support/status/page.tsx');
const workOrderReadme = read('work_orders/README.md');

[
  'WO-073',
  'submittedClaim=false',
  'claimSubmissionEnabled=false',
  'Medical-necessity determination disabled',
  'Patient summary',
  'Production launch remains blocked'
].forEach((snippet) => {
  check(`billing-doc.${snippet.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, `Billing package contains ${snippet}`, doc.includes(snippet), 'docs/BILLING_REVENUE_INTEGRITY_BOUNDARY.md');
});

check('status.wo073-done', 'repo_status marks WO-073 done', status.work_orders?.['WO-073'] === 'done', status.work_orders?.['WO-073']);
check('work-order.file', 'WO-073 work-order file exists', exists('work_orders/WO-073_billing_revenue_integrity_claim_decision_boundary.md'), 'work_orders/WO-073_billing_revenue_integrity_claim_decision_boundary.md');
check('work-order.index', 'Work-order index records WO-073 completion', workOrderReadme.includes('`WO-073` is complete'), 'work_orders/README.md');
check('api.draft-claim', 'Draft claim preview remains not submitted in runtime services', operationsService.includes('submittedClaim: false') && scheduleService.includes('submittedClaim: false'), 'operations and schedule services');
check('api.billing-event', 'Commercial readiness API emits billing revenue integrity evidence', supportService.includes('billing.revenue_integrity_checked.v1') && supportService.includes('submittedClaim: false'), 'apps/api/src/support/support.service.ts');
check('tests.submitted-claim', 'Operations e2e proves submittedClaim false', operationsTest.includes('submittedClaim, false'), 'apps/api/src/operations/operations.e2e.test.ts');
check('web.claim-boundary', 'Support route still exposes claim payer decision gate', supportPage.includes('Claim/Payer Decision Gate') && supportPage.includes('claimSubmissionEnabled=false'), 'apps/web/app/aura-note/support/status/page.tsx');
check('no-claim-submit', 'Billing package avoids live claim submission approval', !doc.includes('live claim submission enabled') && !doc.includes('production launch approved'), 'docs/BILLING_REVENUE_INTEGRITY_BOUNDARY.md');

const failed = checks.filter((item) => !item.passed);
console.log(JSON.stringify({
  status: failed.length === 0 ? 'ready_synthetic' : 'blocked',
  workOrder: 'WO-073',
  gate: 'billing_revenue_integrity_readiness',
  submittedClaim: false,
  claimSubmissionEnabled: false,
  autonomousBillingEnabled: false,
  productionLaunchReady: false,
  failedChecks: failed.length,
  failures: failed,
  checks
}, null, 2));

if (failed.length > 0) {
  process.exitCode = 1;
}
