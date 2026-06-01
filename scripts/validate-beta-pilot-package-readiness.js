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
const doc = read('docs/BETA_PILOT_READINESS_PACKAGE.md');
const supportService = read('apps/api/src/support/support.service.ts');
const supportPage = read('apps/web/app/aura-note/support/status/page.tsx');
const smoke = read('scripts/simulate-pilot-launch-smoke.js');
const workOrderReadme = read('work_orders/README.md');

[
  'WO-074',
  'Onboarding Checklist',
  'Training Checklist',
  'Disabled feature inventory',
  'Pilot Smoke',
  'productionLaunchReady=false'
].forEach((snippet) => {
  check(`beta-doc.${snippet.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, `Beta package contains ${snippet}`, doc.includes(snippet), 'docs/BETA_PILOT_READINESS_PACKAGE.md');
});

check('status.wo074-done', 'repo_status marks WO-074 done', status.work_orders?.['WO-074'] === 'done', status.work_orders?.['WO-074']);
check('work-order.file', 'WO-074 work-order file exists', exists('work_orders/WO-074_beta_pilot_commercial_readiness_package.md'), 'work_orders/WO-074_beta_pilot_commercial_readiness_package.md');
check('work-order.index', 'Work-order index records WO-074 completion', workOrderReadme.includes('`WO-074` is complete'), 'work_orders/README.md');
check('api.beta-event', 'Commercial readiness API emits beta pilot package evidence', supportService.includes('beta.pilot_package_checked.v1') && supportService.includes('betaPilotPackageReady: true'), 'apps/api/src/support/support.service.ts');
check('web.beta', 'Support route exposes pilot launch gate and smoke evidence', supportPage.includes('Pilot Launch Gate') && supportPage.includes('Pilot Smoke Evidence'), 'apps/web/app/aura-note/support/status/page.tsx');
check('smoke.synthetic', 'Pilot smoke script remains synthetic/no-launch', smoke.includes('productionLaunchApproved') && smoke.includes('false'), 'scripts/simulate-pilot-launch-smoke.js');
check('no-real-beta', 'Beta package avoids real tenant or live PHI approval', !doc.includes('real tenant active') && !doc.includes('live PHI enabled'), 'docs/BETA_PILOT_READINESS_PACKAGE.md');

const failed = checks.filter((item) => !item.passed);
console.log(JSON.stringify({
  status: failed.length === 0 ? 'ready_synthetic' : 'blocked',
  workOrder: 'WO-074',
  gate: 'beta_pilot_package_readiness',
  betaPilotPackageReady: failed.length === 0,
  productionLaunchReady: false,
  failedChecks: failed.length,
  failures: failed,
  checks
}, null, 2));

if (failed.length > 0) {
  process.exitCode = 1;
}
