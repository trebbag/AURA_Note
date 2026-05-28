#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const contracts = read('packages/contracts/src/index.ts');
const security = read('packages/security/src/index.ts');
const supportService = read('apps/api/src/support/support.service.ts');
const supportController = read('apps/api/src/support/support.controller.ts');
const supportTests = `${read('apps/api/src/support/support.service.test.ts')}\n${read('apps/api/src/support/support.e2e.test.ts')}`;
const supportPage = read('apps/web/app/aura-note/support/status/page.tsx');
const browserTests = read('apps/web/e2e/aura-note-routes.spec.ts');
const openApi = read('packages/contracts/openapi/aura-note.v1.yaml');
const checkpointReport = read('CHECKPOINT_REPORT.md');
const runLog = read('RUN_LOG.md');
const status = JSON.parse(read('repo_status.json'));
const packageJson = JSON.parse(read('package.json'));
const nextWorkOrderNumber = Number.parseInt(String(status.next_work_order || '').replace('WO-', ''), 10);
const hasAdvancedPastWo043 = status.next_work_order === null || (Number.isFinite(nextWorkOrderNumber) && nextWorkOrderNumber >= 44);

const requiredSnippets = [
  'observability.status_checked.v1',
  'support.status_checked.v1',
  'incident.runbook_viewed.v1',
  'degraded_mode.acknowledged.v1',
  'access_review.evidence_recorded.v1',
  'operational.readiness_checked.v1',
  'support_operations:record',
  'production-siem-placeholder',
  'production-apm-placeholder',
  'getOperationalReadiness',
  'recordOperationalEvidence',
  '/support/operations/readiness',
  '/support/operations/evidence',
  'productionLaunchReady: false',
  'vendorSinksConfigured: false',
  'Operational evidence states'
];

const corpus = [contracts, security, supportService, supportController, supportTests, supportPage, browserTests, openApi].join('\n');
const missing = requiredSnippets.filter((snippet) => !corpus.includes(snippet));
const p8Recorded = checkpointReport.includes('P8') && checkpointReport.includes('WO-043');
const statusAdvanced = status.work_orders?.['WO-043'] === 'done' && hasAdvancedPastWo043;
const runLogRecorded = runLog.includes('WO-043 production observability support operations and status views');

const result = {
  status: missing.length === 0 && p8Recorded && statusAdvanced && runLogRecorded ? 'ready_synthetic' : 'blocked',
  checkedAt: new Date().toISOString(),
  workOrder: 'WO-043',
  evidenceType: 'production_observability_support_operations_synthetic_readiness',
  liveSiemTouched: false,
  liveApmTouched: false,
  productionCredentials: false,
  productionPhiLogs: false,
  productionLaunchReady: false,
  packageScriptPresent:
    packageJson.scripts?.['observability:production-readiness'] ===
    'pnpm --filter @aura-note/security test && pnpm --filter @aura-note/api test && node scripts/validate-observability-production-readiness.js',
  missing,
  p8Recorded,
  statusAdvanced,
  runLogRecorded
};

console.log(JSON.stringify(result, null, 2));

if (result.status !== 'ready_synthetic' || !result.packageScriptPresent) {
  process.exitCode = 1;
}
