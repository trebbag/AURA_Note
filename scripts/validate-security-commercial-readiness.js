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
const doc = read('docs/SECURITY_PRIVACY_COMPLIANCE_THREAT_MODEL.md');
const service = read('apps/api/src/support/support.service.ts');
const serviceTest = read('apps/api/src/support/support.service.test.ts');
const e2e = read('apps/api/src/support/support.e2e.test.ts');
const web = read('apps/web/app/aura-note/support/status/page.tsx');
const openapi = read('packages/contracts/openapi/aura-note.v1.yaml');
const workOrderReadme = read('work_orders/README.md');

[
  'WO-071',
  'not a HIPAA certification claim',
  'Cross-tenant or cross-site data exposure',
  'Unauthorized support access',
  'Raw PHI in logs or AI payloads',
  'Break-glass remains a disabled placeholder',
  'productionLaunchReady=false'
].forEach((snippet) => {
  check(`security-doc.${snippet.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, `Security package contains ${snippet}`, doc.includes(snippet), 'docs/SECURITY_PRIVACY_COMPLIANCE_THREAT_MODEL.md');
});

check('status.wo071-done', 'repo_status marks WO-071 done', status.work_orders?.['WO-071'] === 'done', status.work_orders?.['WO-071']);
check('status.cr4', 'repo_status records CR-4 after WO-071 through WO-075 batch', status.current_checkpoint === 'CR-4', status.current_checkpoint);
check('work-order.file', 'WO-071 work-order file exists', exists('work_orders/WO-071_security_privacy_compliance_threat_model_runtime_hardening.md'), 'work_orders/WO-071_security_privacy_compliance_threat_model_runtime_hardening.md');
check('work-order.index', 'Work-order index records WO-071 completion', workOrderReadme.includes('`WO-071` is complete'), 'work_orders/README.md');
check('api.endpoint', 'Commercial readiness endpoint exists', service.includes('getCommercialReadiness') && openapi.includes('/support/commercial-readiness'), 'support service and OpenAPI');
check('api.events', 'Security/privacy commercial events are emitted', service.includes('security.privacy_review_checked.v1') && service.includes('threat_model.reviewed.v1'), 'apps/api/src/support/support.service.ts');
check('api.denial', 'Commercial readiness denies ordinary clinicians', serviceTest.includes("getCommercialReadiness({ 'x-aura-role': 'clinician' })") && e2e.includes('/api/v1/support/commercial-readiness'), 'support tests');
check('web.cr4', 'Support route renders CR-4 commercial readiness evidence', web.includes('CR-4 Commercial Readiness') && web.includes('Commercial readiness review'), 'apps/web/app/aura-note/support/status/page.tsx');
check('no-launch', 'Security package does not claim production launch approval', !doc.includes('production launch approved') && !doc.includes('HIPAA certified'), 'docs/SECURITY_PRIVACY_COMPLIANCE_THREAT_MODEL.md');

const failed = checks.filter((item) => !item.passed);
console.log(JSON.stringify({
  status: failed.length === 0 ? 'ready_synthetic' : 'blocked',
  workOrder: 'WO-071',
  gate: 'security_commercial_readiness',
  legalCertificationClaimed: false,
  productionLaunchReady: false,
  failedChecks: failed.length,
  failures: failed,
  checks
}, null, 2));

if (failed.length > 0) {
  process.exitCode = 1;
}
