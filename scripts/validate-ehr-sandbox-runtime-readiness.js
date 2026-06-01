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

const checks = [
  {
    id: 'contracts.runtime-boundary',
    path: 'packages/contracts/src/index.ts',
    snippets: [
      'EhrRuntimeBoundaryDto',
      'EhrPatientLookupResponseDto',
      'EhrAppointmentImportResponseDto',
      'EhrEncounterContextResponseDto',
      'ehr.writeback_acknowledged.v1'
    ]
  },
  {
    id: 'openapi.runtime-boundary',
    path: 'packages/contracts/openapi/aura-note.v1.yaml',
    snippets: [
      '/integrations/ehr/runtime-boundary',
      '/integrations/ehr/patients/search',
      '/integrations/ehr/appointments/import',
      '/integrations/ehr/encounters/{externalEncounterId}',
      'EhrRuntimeBoundaryResponse'
    ]
  },
  {
    id: 'adapters.vendor-neutral',
    path: 'packages/ehr-adapters/src/index.ts',
    snippets: [
      'getRuntimeBoundary',
      'vendor_neutral_ehr_adapter',
      'liveApiCallsEnabled: false',
      'rawPayloadStorageEnabled: false',
      'AthenahealthAdapter'
    ]
  },
  {
    id: 'api.routes',
    path: 'apps/api/src/integrations/ehr.controller.ts',
    snippets: [
      "@Get('runtime-boundary')",
      "@Get('patients/search')",
      "@Get('appointments/import')",
      "@Get('encounters/:externalEncounterId')"
    ]
  },
  {
    id: 'api.lifecycle',
    path: 'apps/api/src/integrations/ehr.service.ts',
    snippets: [
      'searchPatients',
      'importAppointments',
      'getEncounterContext',
      "'prepare_payload'",
      "'record_attempt'",
      "'acknowledge'",
      'payloadStored: false'
    ]
  },
  {
    id: 'browser.route',
    path: 'apps/web/app/aura-note/integrations/ehr/page.tsx',
    snippets: [
      'CR-3 / WO-069',
      'Sandbox Context',
      'vendor_neutral_ehr_adapter',
      'liveApiCallsEnabled=false',
      'rawPayloadStored=false',
      'Prepare Payload',
      'Acknowledge'
    ]
  },
  {
    id: 'tests.api',
    path: 'apps/api/src/integrations/ehr.e2e.test.ts',
    snippets: [
      '/api/v1/integrations/ehr/runtime-boundary',
      'ehr.patient_lookup_performed.v1',
      'ehr.appointment_imported.v1',
      'ehr.writeback_acknowledged.v1'
    ]
  },
  {
    id: 'tests.browser',
    path: 'apps/web/e2e/aura-note-routes.spec.ts',
    snippets: [
      'vendor_neutral_ehr_adapter',
      'Sandbox patient appointment encounter context',
      'Prepare Payload',
      'Acknowledge'
    ]
  },
  {
    id: 'docs.status',
    path: 'docs/TEST_PLAN.md',
    snippets: ['WO-069', 'ehr:sandbox-runtime-readiness']
  },
  {
    id: 'runlog.wo069',
    path: 'RUN_LOG.md',
    snippets: ['WO-069 athenahealth sandbox and vendor-neutral EHR runtime boundary']
  },
  {
    id: 'spec-gaps.wo069',
    path: 'SPEC_GAPS.md',
    snippets: ['No active gaps as of post-`WO-069` athenahealth sandbox and vendor-neutral EHR runtime boundary review']
  },
  {
    id: 'work-order.next',
    path: 'work_orders/WO-070_ai_governance_runtime_boundary_evaluation_harness.md',
    snippets: ['WO-070']
  }
];

const failures = [];
for (const check of checks) {
  if (!exists(check.path)) {
    failures.push({ id: check.id, path: check.path, missing: 'file exists' });
    continue;
  }
  const content = read(check.path);
  for (const snippet of check.snippets) {
    if (!content.includes(snippet)) {
      failures.push({ id: check.id, path: check.path, missing: snippet });
    }
  }
}

const packageJson = JSON.parse(read('package.json'));
if (packageJson.scripts?.['ehr:sandbox-runtime-readiness'] !== 'pnpm --filter @aura-note/ehr-adapters test && pnpm --filter @aura-note/api test:ehr-sandbox-runtime && node scripts/validate-ehr-sandbox-runtime-readiness.js') {
  failures.push({ id: 'package.script', path: 'package.json', missing: 'ehr:sandbox-runtime-readiness script' });
}

const apiPackageJson = JSON.parse(read('apps/api/package.json'));
if (!String(apiPackageJson.scripts?.['test:ehr-sandbox-runtime']).includes('src/integrations/ehr.e2e.test.ts')) {
  failures.push({ id: 'api.script', path: 'apps/api/package.json', missing: 'test:ehr-sandbox-runtime script' });
}

const workflow = read('.github/workflows/ci.yml');
if (!workflow.includes('pnpm ehr:sandbox-runtime-readiness')) {
  failures.push({ id: 'ci.script', path: '.github/workflows/ci.yml', missing: 'pnpm ehr:sandbox-runtime-readiness' });
}

const status = JSON.parse(read('repo_status.json'));
if (status.work_orders?.['WO-069'] !== 'done') {
  failures.push({ id: 'status.wo069', path: 'repo_status.json', missing: 'WO-069 done' });
}
if (status.next_work_order !== 'WO-070') {
  failures.push({ id: 'status.next', path: 'repo_status.json', missing: 'next_work_order WO-070' });
}
if (status.current_checkpoint !== 'CR-3') {
  failures.push({ id: 'status.checkpoint', path: 'repo_status.json', missing: 'CR-3' });
}

const forbidden = [
  'LIVE_ATHENAHEALTH',
  'ATHENAHEALTH_CLIENT_SECRET=',
  'PRODUCTION_EHR_URL=',
  'liveApiCallsEnabled: true',
  'liveWritebackEnabled: true',
  'rawPayloadStorageEnabled: true',
  'submittedClaim = true'
];
for (const term of forbidden) {
  for (const file of [
    'apps/api/src/integrations/ehr.service.ts',
    'packages/ehr-adapters/src/index.ts',
    'apps/web/app/aura-note/integrations/ehr/page.tsx',
    'packages/contracts/src/index.ts'
  ]) {
    if (exists(file) && read(file).includes(term)) {
      failures.push({ id: 'safety.no-live-ehr', path: file, missing: `remove ${term}` });
    }
  }
}

const result = {
  status: failures.length === 0 ? 'ready_synthetic' : 'failed',
  checkedAt: new Date().toISOString(),
  workOrder: 'WO-069',
  checkpoint: 'CR-3 in progress',
  gate: 'ehr_sandbox_runtime_readiness',
  vendorNeutralAdapterBoundary: true,
  primaryVendor: 'athenahealth',
  liveApiCallsEnabled: false,
  liveWritebackEnabled: false,
  rawPayloadStorageEnabled: false,
  claimSubmissionPerformed: false,
  nextWorkOrder: status.next_work_order,
  failedChecks: failures.length,
  failures
};

console.log(JSON.stringify(result, null, 2));
if (failures.length > 0) {
  process.exit(1);
}
