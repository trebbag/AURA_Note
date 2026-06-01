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
      throw new Error(`${relativePath} is missing required WO-066 standalone workflow evidence: ${needle}`);
    }
  }
}

function assertNoForbiddenClaims() {
  const forbidden = [
    'production launch approved',
    'HIPAA certified',
    'live PHI processing enabled',
    'autonomous diagnosis enabled',
    'claim submission enabled',
    'charge finalization enabled',
    'medical necessity determined'
  ];
  for (const file of ['docs/FRONTEND_RUNTIME_INTEGRATION.md', 'docs/TEST_PLAN.md', 'docs/UX_BUILD_SPEC.md', 'RUN_LOG.md', 'SPEC_GAPS.md', 'repo_status.json']) {
    const content = read(file).toLowerCase();
    for (const phrase of forbidden) {
      if (content.includes(phrase.toLowerCase())) {
        throw new Error(`${file} contains prohibited standalone workflow claim: ${phrase}`);
      }
    }
  }
}

assertIncludes('package.json', ['"standalone:workflow-readiness"']);
assertIncludes('.github/workflows/ci.yml', ['pnpm standalone:workflow-readiness']);
assertIncludes('apps/web/e2e/aura-note-routes.spec.ts', [
  'standalone workflow completion proves daily-use flow without ClinicOS dependency',
  'createFinalizedNoteForTest',
  'AURA Note Runtime Home',
  'day schedule',
  'This viewer cannot reopen the active editor.',
  'Claim submission remains disabled.',
  'AURA Note authoritative',
  'does not build ClinicOS modules'
]);
assertIncludes('docs/FRONTEND_RUNTIME_INTEGRATION.md', [
  'Status as of `WO-066`',
  'standalone workflow completion',
  'without ClinicOS dependency'
]);
assertIncludes('docs/TEST_PLAN.md', ['WO-066', 'standalone:workflow-readiness']);
assertIncludes('docs/UX_BUILD_SPEC.md', ['WO-066', 'standalone workflow']);
assertIncludes('docs/PRODUCTION_BUILD_PLAN.md', ['Implementation status as of `WO-066`']);
assertIncludes('work_orders/README.md', ['`WO-066` is complete', '`WO-067` is the next active CR-3 work order']);
assertIncludes('RUN_LOG.md', ['WO-066 standalone workflow completion', 'standalone:workflow-readiness']);
assertIncludes('SPEC_GAPS.md', ['No active gaps as of post-`WO-066` standalone workflow completion / CR-2 review']);
if (!exists('work_orders/WO-067_mode_resolver_adapter_runtime_wiring.md')) {
  throw new Error('WO-067 active work-order file must exist after WO-066 advances CR-3');
}

const status = JSON.parse(read('repo_status.json'));
if (status.work_orders?.['WO-066'] !== 'done') {
  throw new Error('repo_status.json must mark WO-066 done before standalone workflow readiness passes');
}
if (status.next_work_order !== 'WO-067') {
  throw new Error(`repo_status.json must advance next_work_order to WO-067; found ${status.next_work_order}`);
}
if (status.work_orders?.['WO-067'] !== 'todo') {
  throw new Error('repo_status.json must mark WO-067 todo after WO-066 is complete');
}
if (status.current_checkpoint !== 'CR-3') {
  throw new Error(`repo_status.json must advance current_checkpoint to CR-3 after CR-2 completion; found ${status.current_checkpoint}`);
}

assertNoForbiddenClaims();

console.log(
  JSON.stringify(
    {
      status: 'ready_synthetic',
      workOrder: 'WO-066',
      checkpoint: 'CR-2 complete; CR-3 active',
      gate: 'standalone_workflow_readiness',
      browserWorkflowEvidence: true,
      clinicOsDependencyRequired: false,
      productionLaunchClaimed: false,
      livePhiOrVendorTouched: false,
      nextWorkOrder: status.next_work_order
    },
    null,
    2
  )
);
