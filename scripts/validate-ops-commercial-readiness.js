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
const doc = read('docs/COMMERCIAL_OBSERVABILITY_SUPPORT_OPERATIONS.md');
const service = read('apps/api/src/support/support.service.ts');
const supportPage = read('apps/web/app/aura-note/support/status/page.tsx');
const packageJson = JSON.parse(read('package.json'));
const workflow = read('.github/workflows/ci.yml');
const workOrderReadme = read('work_orders/README.md');

[
  'WO-072',
  'Incident Severity Taxonomy',
  'SIEM/APM',
  'Support status is metadata-only',
  'productionLaunchReady=false'
].forEach((snippet) => {
  check(`ops-doc.${snippet.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, `Operations package contains ${snippet}`, doc.includes(snippet), 'docs/COMMERCIAL_OBSERVABILITY_SUPPORT_OPERATIONS.md');
});

check('status.wo072-done', 'repo_status marks WO-072 done', status.work_orders?.['WO-072'] === 'done', status.work_orders?.['WO-072']);
check('work-order.file', 'WO-072 work-order file exists', exists('work_orders/WO-072_observability_sre_support_incident_operations.md'), 'work_orders/WO-072_observability_sre_support_incident_operations.md');
check('work-order.index', 'Work-order index records WO-072 completion', workOrderReadme.includes('`WO-072` is complete'), 'work_orders/README.md');
check('api.events', 'Support incident taxonomy event is emitted', service.includes('support.incident_taxonomy_checked.v1'), 'apps/api/src/support/support.service.ts');
check('api.sections', 'Commercial readiness API includes operations support section', service.includes('observability_support_incident_operations'), 'apps/api/src/support/support.service.ts');
check('web.sections', 'Support page renders required reviews and CR-4 work-order evidence', supportPage.includes('Required Final Reviews') && supportPage.includes('CR-4 work order evidence'), 'apps/web/app/aura-note/support/status/page.tsx');
check('script.package', 'package.json exposes ops commercial readiness', packageJson.scripts?.['ops:commercial-readiness']?.includes('validate-ops-commercial-readiness.js'), packageJson.scripts?.['ops:commercial-readiness']);
check('script.ci', 'CI runs ops commercial readiness', workflow.includes('pnpm ops:commercial-readiness'), '.github/workflows/ci.yml');
check('no-live-telemetry', 'Operations package keeps live telemetry vendors disabled', doc.includes('Live SIEM, APM, paging, and production on-call execution remain disabled'), 'docs/COMMERCIAL_OBSERVABILITY_SUPPORT_OPERATIONS.md');

const failed = checks.filter((item) => !item.passed);
console.log(JSON.stringify({
  status: failed.length === 0 ? 'ready_synthetic' : 'blocked',
  workOrder: 'WO-072',
  gate: 'ops_commercial_readiness',
  liveTelemetryVendorConfigured: false,
  productionLaunchReady: false,
  failedChecks: failed.length,
  failures: failed,
  checks
}, null, 2));

if (failed.length > 0) {
  process.exitCode = 1;
}
