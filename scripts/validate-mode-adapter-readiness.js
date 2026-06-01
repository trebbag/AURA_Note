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

function assertIncludes(relativePath, needles) {
  const content = read(relativePath);
  for (const needle of needles) {
    if (!content.includes(needle)) {
      throw new Error(`${relativePath} is missing required WO-067 mode adapter evidence: ${needle}`);
    }
  }
}

function assertNoForbiddenClaims() {
  const forbidden = [
    'live ClinicOS sync enabled',
    'delegated identity enabled',
    'raw ClinicOS payload storage enabled',
    'production launch approved',
    'claim submission enabled',
    'charge finalization enabled',
    'medical necessity determined'
  ];
  for (const file of ['RUN_LOG.md', 'SPEC_GAPS.md', 'repo_status.json', 'docs/STANDALONE_AND_CLINICOS_MODES.md', 'docs/BACKEND_BUILD_SPEC.md']) {
    const content = read(file).toLowerCase();
    for (const phrase of forbidden) {
      if (content.includes(phrase.toLowerCase())) {
        throw new Error(`${file} contains prohibited WO-067 live/launch claim: ${phrase}`);
      }
    }
  }
}

assertIncludes('package.json', ['"mode:adapter-readiness"', 'validate-mode-adapter-readiness.js']);
assertIncludes('.github/workflows/ci.yml', ['pnpm mode:adapter-readiness']);
assertIncludes('apps/api/src/runtime/mode-resolver.ts', [
  'resolveAuraRuntimeModeFromHeaders',
  'scheduleSource',
  'patientContext',
  'visitGraph',
  'aiGovernance',
  'chargeIntegrity',
  'liveDelegationEnabled: false',
  'rawPayloadStorageEnabled: false',
  'permissionBoundary:'
]);
assertIncludes('apps/api/src/runtime/mode-resolver.test.ts', [
  'defaults to standalone authority',
  'metadata-only adapter seams',
  'fails closed for degraded or unavailable ClinicOS states'
]);
assertIncludes('apps/api/src/integrations/clinicos.service.ts', [
  'resolveAuraRuntimeModeFromHeaders',
  'modeAdapterBoundaries',
  'modeAdapterBoundaryCount',
  'liveDelegationEnabled: false',
  'rawPayloadStorageEnabled: false'
]);
assertIncludes('apps/api/src/integrations/clinicos.service.test.ts', [
  'marks degraded ClinicOS mode as fail-closed without live delegation',
  'denies cross-tenant service-account attempts'
]);
assertIncludes('apps/api/src/integrations/clinicos.e2e.test.ts', [
  'modeAdapterBoundaries',
  'failed_unavailable',
  'liveDelegationEnabled'
]);
assertIncludes('packages/contracts/src/index.ts', [
  'AuraModeAdapterBoundaryDto',
  'AuraModeAdapterSeamDto',
  'modeAdapterBoundaries'
]);
assertIncludes('packages/contracts/openapi/aura-note.v1.yaml', ['AuraModeAdapterBoundary', 'modeAdapterBoundaries']);
assertIncludes('packages/testing/src/index.ts', ['modeAdapterBoundaries', 'liveDelegationEnabled: false']);
assertIncludes('docs/STANDALONE_AND_CLINICOS_MODES.md', ['WO-067', 'ModeResolver runtime boundary', 'mode:adapter-readiness']);
assertIncludes('docs/BACKEND_BUILD_SPEC.md', ['WO-067', 'ModeResolver', 'AURA Note remains authoritative']);
assertIncludes('docs/API_EVENT_CONTRACTS.md', ['WO-067', 'modeAdapterBoundaryCount']);
assertIncludes('docs/RBAC_ABAC_MATRIX.md', ['WO-067', 'ClinicOS cannot bypass AURA Note permissions']);
assertIncludes('docs/DATA_MODEL.md', ['WO-067', 'modeAdapterBoundaries']);
assertIncludes('docs/TEST_PLAN.md', ['WO-067', 'mode:adapter-readiness']);
assertIncludes('docs/PRODUCTION_BUILD_PLAN.md', ['Implementation status as of `WO-067`']);
assertIncludes('work_orders/README.md', ['`WO-067` is complete', '`WO-068`']);
assertIncludes('RUN_LOG.md', ['WO-067 ModeResolver and adapter runtime wiring', 'mode:adapter-readiness']);
const specGaps = read('SPEC_GAPS.md');
if (
  !specGaps.includes('No active gaps as of post-`WO-067` ModeResolver and adapter runtime wiring review') &&
  !specGaps.includes('No active gaps as of post-`WO-068` transcription runtime boundary review') &&
  !specGaps.includes('No active gaps as of post-`WO-069` athenahealth sandbox and vendor-neutral EHR runtime boundary review') &&
  !specGaps.includes('No active gaps as of post-`WO-070` AI governance runtime boundary review') &&
  !specGaps.includes('No active gaps as of post-`WO-075` commercial readiness decision gate review')
) {
  throw new Error('SPEC_GAPS.md must retain WO-067 or later no-active-gap evidence');
}

if (!exists('work_orders/WO-068_transcription_runtime_boundary_provider_ready_interface.md')) {
  throw new Error('WO-068 active work-order file must exist after WO-067 advances CR-3');
}

const status = JSON.parse(read('repo_status.json'));
if (status.work_orders?.['WO-067'] !== 'done') {
  throw new Error('repo_status.json must mark WO-067 done before mode adapter readiness passes');
}
if (![null, 'WO-068', 'WO-069', 'WO-070', 'WO-071'].includes(status.next_work_order)) {
  throw new Error(`repo_status.json must be at WO-068 or later after WO-067; found ${status.next_work_order}`);
}
if (!['todo', 'done'].includes(status.work_orders?.['WO-068'])) {
  throw new Error('repo_status.json must mark WO-068 todo or done after WO-067 is complete');
}
if (!['CR-3', 'CR-4'].includes(status.current_checkpoint)) {
  throw new Error(`repo_status.json must remain in CR-3 or later CR-4 after WO-067; found ${status.current_checkpoint}`);
}

assertNoForbiddenClaims();

console.log(
  JSON.stringify(
    {
      status: 'ready_synthetic',
      workOrder: 'WO-067',
      checkpoint: 'CR-3 in progress',
      gate: 'mode_adapter_readiness',
      modeResolverRuntimeBoundary: true,
      adapterSeamsChecked: 10,
      clinicOsCanBypassAuraPermissions: false,
      liveClinicOsSyncEnabled: false,
      rawClinicOsPayloadStorageEnabled: false,
      productionLaunchClaimed: false,
      nextWorkOrder: status.next_work_order
    },
    null,
    2
  )
);
