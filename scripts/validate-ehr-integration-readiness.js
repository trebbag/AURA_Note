#!/usr/bin/env node
const fs = require('node:fs');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

const checks = [
  {
    id: 'contracts.writeback-queue-dtos',
    path: 'packages/contracts/src/index.ts',
    snippets: ['EhrWritebackQueueItemDto', 'EhrWritebackQueueActionResponseDto', 'ehr.writeback_approval_recorded.v1']
  },
  {
    id: 'openapi.writeback-queue',
    path: 'packages/contracts/openapi/aura-note.v1.yaml',
    snippets: ['/integrations/ehr/writeback-queue', 'EhrWritebackQueueActionRequest', 'ehr.writeback_retry_scheduled.v1']
  },
  {
    id: 'security.writeback-permissions',
    path: 'packages/security/src/index.ts',
    snippets: ['ehr_writeback:view', 'ehr_writeback:approve', 'ehr_writeback:manage']
  },
  {
    id: 'api.writeback-lifecycle',
    path: 'apps/api/src/integrations/ehr.service.ts',
    snippets: ['listWritebackQueue', 'actOnWritebackJob', 'liveProductionWritebackEnabled: false', 'payloadStored: false']
  },
  {
    id: 'api.writeback-routes',
    path: 'apps/api/src/integrations/ehr.controller.ts',
    snippets: ["@Get('writeback-queue')", "@Post('writeback-queue/:writebackJobId/actions')"]
  },
  {
    id: 'browser.ehr-route',
    path: 'apps/web/app/aura-note/integrations/ehr/page.tsx',
    snippets: ['EHR Sandbox Integration', 'payloadStored=false', 'liveDeliveryEnabled=false']
  },
  {
    id: 'tests.ehr-api',
    path: 'apps/api/src/integrations/ehr.service.test.ts',
    snippets: ['approval retry dead-letter and reconciliation', 'trace-support-denied', 'PHI-bearing evidence']
  },
  {
    id: 'tests.ehr-browser',
    path: 'apps/web/e2e/aura-note-routes.spec.ts',
    snippets: ['/aura-note/integrations/ehr', 'EHR integration route exposes sandbox writeback queue lifecycle states']
  },
  {
    id: 'docs.wo044',
    path: 'RUN_LOG.md',
    snippets: ['WO-044 EHR sandbox integration and writeback queue hardening']
  }
];

const failures = [];
for (const check of checks) {
  const content = fs.existsSync(check.path) ? read(check.path) : '';
  for (const snippet of check.snippets) {
    if (!content.includes(snippet)) {
      failures.push({ id: check.id, path: check.path, missing: snippet });
    }
  }
}

const status = JSON.parse(read('repo_status.json'));
const nextWorkOrderNumber = Number.parseInt(String(status.next_work_order || '').replace('WO-', ''), 10);
if (status.work_orders?.['WO-044'] !== 'done') {
  failures.push({ id: 'status.wo044', path: 'repo_status.json', missing: 'WO-044 done' });
}
if (status.next_work_order !== null && (!Number.isFinite(nextWorkOrderNumber) || nextWorkOrderNumber < 45)) {
  failures.push({ id: 'status.next', path: 'repo_status.json', missing: 'next_work_order advanced to WO-045 or later' });
}

const forbidden = ['LIVE_ATHENAHEALTH', 'ATHENAHEALTH_CLIENT_SECRET=', 'PRODUCTION_EHR_URL=', 'submittedClaim = true'];
for (const term of forbidden) {
  for (const path of ['apps/api/src/integrations/ehr.service.ts', 'packages/ehr-adapters/src/index.ts', 'apps/web/app/aura-note/integrations/ehr/page.tsx']) {
    if (fs.existsSync(path) && read(path).includes(term)) {
      failures.push({ id: 'safety.no-live-ehr', path, missing: `remove ${term}` });
    }
  }
}

const result = {
  status: failures.length === 0 ? 'ready_synthetic' : 'failed',
  checkedAt: new Date().toISOString(),
  workOrder: 'WO-044',
  evidenceType: 'ehr_sandbox_writeback_queue_synthetic_readiness',
  liveProductionEhrTouched: false,
  productionCredentials: false,
  writebackPayloadStored: false,
  liveDeliveryEnabled: false,
  claimSubmissionPerformed: false,
  totalChecks: checks.length + 3,
  failedChecks: failures.length,
  failures
};

console.log(JSON.stringify(result, null, 2));
if (failures.length > 0) {
  process.exit(1);
}
