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
const packet = read('docs/COMMERCIAL_READINESS_REVIEW_PACKET.md');
const checkpoint = read('CHECKPOINT_REPORT.md');
const runLog = read('RUN_LOG.md');
const specGaps = read('SPEC_GAPS.md');
const packageJson = JSON.parse(read('package.json'));
const workflow = read('.github/workflows/ci.yml');
const supportService = read('apps/api/src/support/support.service.ts');
const openapi = read('packages/contracts/openapi/aura-note.v1.yaml');
const contracts = read('packages/contracts/src/index.ts');
const workOrderReadme = read('work_orders/README.md');

['WO-071', 'WO-072', 'WO-073', 'WO-074', 'WO-075'].forEach((workOrder) => {
  check(`status.${workOrder}`, `repo_status marks ${workOrder} done`, status.work_orders?.[workOrder] === 'done', status.work_orders?.[workOrder]);
  check(`runlog.${workOrder}`, `RUN_LOG records ${workOrder}`, runLog.includes(workOrder), 'RUN_LOG.md');
  check(`checkpoint.${workOrder}`, `CHECKPOINT_REPORT records ${workOrder}`, checkpoint.includes(workOrder), 'CHECKPOINT_REPORT.md');
});

[
  'WO-071_security_privacy_compliance_threat_model_runtime_hardening.md',
  'WO-072_observability_sre_support_incident_operations.md',
  'WO-073_billing_revenue_integrity_claim_decision_boundary.md',
  'WO-074_beta_pilot_commercial_readiness_package.md',
  'WO-075_commercial_readiness_decision_gate.md'
].forEach((file) => {
  check(`work-order-file.${file}`, `${file} exists`, exists(`work_orders/${file}`), `work_orders/${file}`);
});

[
  'Security/privacy/compliance',
  'Observability/support/incident ops',
  'Billing/revenue integrity',
  'Beta pilot package',
  'Production launch ready: false',
  'Disabled Capability Inventory'
].forEach((snippet) => {
  check(`packet.${snippet.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, `Commercial packet contains ${snippet}`, packet.includes(snippet), 'docs/COMMERCIAL_READINESS_REVIEW_PACKET.md');
});

check('status.cr4', 'repo_status records CR-4', status.current_checkpoint === 'CR-4', status.current_checkpoint);
check('status.next-null', 'repo_status stops after CR-4 with no active work order', status.next_work_order === null, status.next_work_order);
check('checkpoint.cr4', 'CR-4 checkpoint report exists', checkpoint.includes('CR-4 Commercial Readiness Review Candidate'), 'CHECKPOINT_REPORT.md');
check('spec-gaps.none', 'SPEC_GAPS records no active post-WO-075 gaps', specGaps.includes('No active gaps as of post-`WO-075` commercial readiness decision gate review'), 'SPEC_GAPS.md');
check('work-order.index', 'Work-order index records CR-4 completion', workOrderReadme.includes('CR-4 is complete') && workOrderReadme.includes('`WO-075` is complete'), 'work_orders/README.md');
check('api.contracts', 'Contracts expose commercial readiness DTO and events', contracts.includes('CommercialReadinessResponseDto') && contracts.includes('commercial.readiness_decision_checked.v1'), 'packages/contracts/src/index.ts');
check('api.openapi', 'OpenAPI exposes commercial readiness endpoint', openapi.includes('/support/commercial-readiness') && openapi.includes('CommercialReadinessResponse'), 'packages/contracts/openapi/aura-note.v1.yaml');
check(
  'api.service',
  'Support service exposes all CR-4 work-order evidence and launch false posture',
  ['WO-071', 'WO-072', 'WO-073', 'WO-074', 'WO-075'].every((workOrder) => supportService.includes(workOrder)) &&
    supportService.includes('productionLaunchReady: false'),
  'apps/api/src/support/support.service.ts'
);
check('script.package', 'package.json exposes commercial readiness gates', ['security:commercial-readiness', 'ops:commercial-readiness', 'billing:revenue-integrity-readiness', 'beta:pilot-package-readiness', 'commercial:readiness'].every((script) => Boolean(packageJson.scripts?.[script])), 'package.json');
check('script.ci', 'CI runs commercial readiness gates', ['pnpm security:commercial-readiness', 'pnpm ops:commercial-readiness', 'pnpm billing:revenue-integrity-readiness', 'pnpm beta:pilot-package-readiness', 'pnpm commercial:readiness'].every((snippet) => workflow.includes(snippet)), '.github/workflows/ci.yml');
check('no-launch-claim', 'Commercial packet does not claim production launch approval', !packet.includes('production launch approved') && !packet.includes('Production launch ready: true'), 'docs/COMMERCIAL_READINESS_REVIEW_PACKET.md');

const failed = checks.filter((item) => !item.passed);
console.log(JSON.stringify({
  status: failed.length === 0 ? 'review_ready_synthetic' : 'blocked',
  checkpoint: 'CR-4',
  gate: 'commercial_readiness',
  productionLaunchReady: false,
  liveVendorEnabled: false,
  claimSubmissionEnabled: false,
  failedChecks: failed.length,
  failures: failed,
  checks
}, null, 2));

if (failed.length > 0) {
  process.exitCode = 1;
}
