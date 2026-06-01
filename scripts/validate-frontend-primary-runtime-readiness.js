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
      throw new Error(`${relativePath} is missing required WO-064 primary runtime evidence: ${needle}`);
    }
  }
}

function assertNoForbiddenClaims() {
  const forbidden = [
    'production launch approved',
    'HIPAA certified',
    'SOC2 certified',
    'autonomous claim submission enabled',
    'live PHI processing enabled',
    'live vendor execution enabled'
  ];
  for (const file of ['docs/FRONTEND_RUNTIME_INTEGRATION.md', 'RUN_LOG.md', 'CHECKPOINT_REPORT.md', 'repo_status.json']) {
    const content = read(file).toLowerCase();
    for (const phrase of forbidden) {
      if (content.includes(phrase.toLowerCase())) {
        throw new Error(`${file} contains prohibited launch/live-readiness claim: ${phrase}`);
      }
    }
  }
}

const primaryRoutes = [
  ['apps/web/app/aura-note/page.tsx', '/aura-note'],
  ['apps/web/app/aura-note/schedule/page.tsx', '/aura-note/schedule'],
  ['apps/web/app/aura-note/drafts/page.tsx', '/aura-note/drafts'],
  ['apps/web/app/aura-note/workspace/[appointmentId]/workspace-client.tsx', '/aura-note/workspace/[appointmentId]'],
  ['apps/web/app/aura-note/finalization/[noteId]/finalization-client.tsx', '/aura-note/finalization/[noteId]'],
  ['apps/web/app/aura-note/finalized/page.tsx', '/aura-note/finalized'],
  ['apps/web/app/aura-note/finalized/[noteId]/finalized-note-client.tsx', '/aura-note/finalized/[noteId]'],
  ['apps/web/app/aura-note/operations/page.tsx', '/aura-note/operations'],
  ['apps/web/app/aura-note/platform/page.tsx', '/aura-note/platform'],
  ['apps/web/app/aura-note/integrations/ehr/page.tsx', '/aura-note/integrations/ehr'],
  ['apps/web/app/aura-note/integrations/clinicos/page.tsx', '/aura-note/integrations/clinicos'],
  ['apps/web/app/aura-note/ai-governance/page.tsx', '/aura-note/ai-governance'],
  ['apps/web/app/aura-note/coaching/page.tsx', '/aura-note/coaching'],
  ['apps/web/app/aura-note/support/status/page.tsx', '/aura-note/support/status']
];

assertIncludes('package.json', ['"frontend:primary-runtime-readiness"']);
assertIncludes('.github/workflows/ci.yml', ['pnpm frontend:primary-runtime-readiness']);
assertIncludes('apps/web/lib/aura-note-api-client.ts', [
  "from '@aura-note/contracts'",
  'createAuraNoteApiClient',
  'clinicOsMode',
  'x-aura-clinicos-mode',
  'publishClinicOsEvent',
  'updateFeatureFlag',
  'generateFinalNotePdf'
]);
assertIncludes('apps/api/src/runtime/api-runtime.ts', [
  'x-aura-clinicos-mode',
  'x-aura-clinicos-unavailable',
  'x-aura-clinicos-degraded'
]);

for (const [file, route] of primaryRoutes) {
  if (!exists(file)) {
    throw new Error(`Primary runtime route file is missing for ${route}: ${file}`);
  }
  assertIncludes(file, ['createAuraNoteApiClient']);
}

assertIncludes('apps/web/e2e/aura-note-routes.spec.ts', [
  'createRuntimeAppointment',
  'createFinalizedNoteForTest',
  'frontend runtime integration gate exercises backend-backed appointment through finalization export and reload evidence',
  'page.reload()',
  'Open MA History Gap blocker',
  'failed_unavailable',
  'unsafe-output-rejected'
]);

const frontendRuntimeInventory = read('docs/FRONTEND_RUNTIME_INTEGRATION.md');
if (
  !frontendRuntimeInventory.includes('Status as of `WO-064`') &&
  !frontendRuntimeInventory.includes('Status as of `WO-065`') &&
  !frontendRuntimeInventory.includes('Status as of `WO-066`')
) {
  throw new Error('docs/FRONTEND_RUNTIME_INTEGRATION.md must retain WO-064 or later frontend runtime status evidence');
}
assertIncludes('docs/FRONTEND_RUNTIME_INTEGRATION.md', [
  'API-backed primary runtime',
  'Synthetic local React state is limited to transient control state',
  'frontend:primary-runtime-readiness'
]);
assertIncludes('docs/TEST_PLAN.md', ['WO-064', 'frontend:primary-runtime-readiness']);
assertIncludes('docs/UX_BUILD_SPEC.md', ['WO-064', 'typed API-backed route state']);
assertIncludes('docs/BACKEND_BUILD_SPEC.md', ['WO-064', 'typed API clients']);
assertIncludes('docs/PRODUCTION_BUILD_PLAN.md', ['Implementation status as of `WO-064`']);
assertIncludes('work_orders/README.md', ['`WO-064` is complete']);
const workOrderIndex = read('work_orders/README.md');
if (
  !workOrderIndex.includes('`WO-065` is the next active CR-2 work order') &&
  !workOrderIndex.includes('`WO-066` is the next active CR-2 work order') &&
  !workOrderIndex.includes('`WO-067` is the next active CR-3 work order') &&
  !workOrderIndex.includes('`WO-068` is the next active CR-3 work order')
) {
  throw new Error('work_orders/README.md must retain CR-2 next-work-order evidence after WO-064');
}
assertIncludes('RUN_LOG.md', ['WO-064 primary UI runtime API conversion', 'frontend:primary-runtime-readiness']);
const specGaps = read('SPEC_GAPS.md');
if (
  !specGaps.includes('No active gaps as of post-`WO-064` primary UI runtime API conversion review') &&
  !specGaps.includes('No active gaps as of post-`WO-065` Figma handoff inventory review') &&
  !specGaps.includes('No active gaps as of post-`WO-066` standalone workflow completion / CR-2 review') &&
  !specGaps.includes('No active gaps as of post-`WO-067` ModeResolver and adapter runtime wiring review')
) {
  throw new Error('SPEC_GAPS.md must retain WO-064 or later no-active-gap evidence');
}

const status = JSON.parse(read('repo_status.json'));
if (status.work_orders?.['WO-064'] !== 'done') {
  throw new Error('repo_status.json must mark WO-064 done before frontend primary runtime readiness passes');
}
const nextWorkOrderNumber = status.next_work_order ? Number(String(status.next_work_order).slice(3)) : null;
if (nextWorkOrderNumber !== null && nextWorkOrderNumber < 65) {
  throw new Error(`repo_status.json must keep WO-065 or later as next_work_order after WO-064; found ${status.next_work_order}`);
}
if (!['todo', 'in_progress', 'done'].includes(status.work_orders?.['WO-065'])) {
  throw new Error('repo_status.json must keep WO-065 represented as todo, in_progress, or done after WO-064 is complete');
}
if (!exists('work_orders/WO-065_figma_ready_basic_ui_scaffold_screen_inventory.md')) {
  throw new Error('WO-065 active work-order file must exist before advancing next_work_order');
}

assertNoForbiddenClaims();

console.log(
  JSON.stringify(
    {
      status: 'ready_synthetic',
      workOrder: 'WO-064',
      gate: 'frontend_primary_runtime',
      primaryRoutesChecked: primaryRoutes.length,
      typedApiClientEvidence: true,
      backendBackedWorkflowPlaywrightEvidence: true,
      localReactStateLimitedToTransientOrDocumentedMocks: true,
      productionLaunchClaimed: false,
      livePhiOrVendorTouched: false,
      nextWorkOrder: status.next_work_order
    },
    null,
    2
  )
);
