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

function assertExists(relativePath) {
  if (!exists(relativePath)) {
    throw new Error(`Missing WO-065 Figma handoff artifact: ${relativePath}`);
  }
}

function assertIncludes(relativePath, needles) {
  const content = read(relativePath);
  for (const needle of needles) {
    if (!content.includes(needle)) {
      throw new Error(`${relativePath} is missing required WO-065 evidence: ${needle}`);
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
    'production ready'
  ];
  const files = [
    'docs/FIGMA_SCREEN_INVENTORY.md',
    'docs/FIGMA_COMPONENT_INVENTORY.md',
    'docs/FIGMA_STATE_MATRIX.md',
    'docs/FIGMA_WORKFLOW_MAP.md',
    'docs/FIGMA_ROLE_AND_PERMISSION_VIEWS.md',
    'docs/FIGMA_DATA_AND_API_MAP.md',
    'docs/FIGMA_CONTENT_COPY_GUIDE.md',
    'docs/FIGMA_HANDOFF_CHECKLIST.md',
    'RUN_LOG.md',
    'SPEC_GAPS.md',
    'repo_status.json'
  ];

  for (const file of files) {
    const content = read(file).toLowerCase();
    for (const phrase of forbidden) {
      if (content.includes(phrase.toLowerCase())) {
        throw new Error(`${file} contains prohibited launch/live-readiness claim: ${phrase}`);
      }
    }
  }
}

const handoffDocs = [
  'docs/FIGMA_SCREEN_INVENTORY.md',
  'docs/FIGMA_COMPONENT_INVENTORY.md',
  'docs/FIGMA_STATE_MATRIX.md',
  'docs/FIGMA_WORKFLOW_MAP.md',
  'docs/FIGMA_ROLE_AND_PERMISSION_VIEWS.md',
  'docs/FIGMA_DATA_AND_API_MAP.md',
  'docs/FIGMA_CONTENT_COPY_GUIDE.md',
  'docs/FIGMA_HANDOFF_CHECKLIST.md'
];

const requiredSurfaces = [
  'Standalone home',
  'Schedule Builder',
  'patient shell',
  'chart context',
  'Draft Notes',
  'Documentation Workspace',
  'Audio and transcription',
  'Suggestions',
  'Visit Selections',
  'Compliance',
  'History Gap',
  'Finalization Wizard',
  'Finalized Notes',
  'Export',
  'writeback',
  'task inbox',
  'MA worklist',
  'billing review',
  'Settings',
  'templates',
  'dot phrases',
  'estimates',
  'rules catalog',
  'EHR',
  'ClinicOS',
  'AI Governance',
  'Coaching',
  'Support status',
  'commercial readiness'
];

const requiredStates = [
  'empty',
  'loading',
  'ready',
  'saving',
  'blocked',
  'failed',
  'permission-denied',
  'read-only',
  'degraded',
  'disabled',
  'finalized',
  'demo fixture'
];

const requiredRoles = [
  'clinician',
  'MA',
  'billing staff',
  'admin',
  'authorized admin',
  'compliance/privacy lead',
  'support',
  'service account/integration'
];

for (const doc of handoffDocs) {
  assertExists(doc);
}

assertExists('apps/web/app/aura-note/figma-handoff/page.tsx');

assertIncludes('docs/FIGMA_SCREEN_INVENTORY.md', requiredSurfaces);
assertIncludes('docs/FIGMA_STATE_MATRIX.md', requiredStates);
assertIncludes('docs/FIGMA_ROLE_AND_PERMISSION_VIEWS.md', requiredRoles);
assertIncludes('docs/FIGMA_DATA_AND_API_MAP.md', [
  'typed API client',
  'persisted backend state',
  'documented disabled adapter mock',
  'transient UI state',
  'Storybook/demo-only fixture',
  'Event/audit expectation'
]);
assertIncludes('docs/FIGMA_CONTENT_COPY_GUIDE.md', [
  'draft',
  'candidate',
  'human review required',
  'submittedClaim=false',
  'no raw PHI to external AI',
  'production launch not approved'
]);
assertIncludes('docs/FIGMA_HANDOFF_CHECKLIST.md', [
  '/aura-note/figma-handoff',
  'pnpm figma:handoff-readiness',
  'typed API clients',
  'ClinicOS-integrated mode remains adapter-bound'
]);
assertIncludes('apps/web/app/aura-note/figma-handoff/page.tsx', [
  'Figma Handoff Inventory',
  'requiredStates',
  'roleViews',
  'screenInventory',
  'workflowMap',
  'metadata-only',
  'no live PHI',
  'ClinicOS-integrated mode'
]);
assertIncludes('apps/web/e2e/aura-note-routes.spec.ts', [
  "/aura-note/figma-handoff",
  'Figma Handoff Inventory',
  'Screen inventory',
  'AI suggestions remain draft-only'
]);
assertIncludes('package.json', ['"figma:handoff-readiness"']);
assertIncludes('.github/workflows/ci.yml', ['pnpm figma:handoff-readiness']);
assertIncludes('docs/FRONTEND_RUNTIME_INTEGRATION.md', ['/aura-note/figma-handoff', 'Figma handoff']);
assertIncludes('docs/FIGMA_HANDOFF_PLAN.md', ['Status as of `WO-065`']);
assertIncludes('docs/TEST_PLAN.md', ['WO-065', 'figma:handoff-readiness']);
assertIncludes('docs/UX_BUILD_SPEC.md', ['WO-065', 'Figma handoff']);
assertIncludes('docs/PRODUCTION_BUILD_PLAN.md', ['Implementation status as of `WO-065`']);
assertIncludes('work_orders/README.md', ['`WO-065` is complete']);
const workOrderIndex = read('work_orders/README.md');
if (
  !workOrderIndex.includes('`WO-066` is the next active CR-2 work order') &&
  !workOrderIndex.includes('`WO-067` is the next active CR-3 work order')
) {
  throw new Error('work_orders/README.md must retain WO-066 or later next-work-order evidence after WO-065');
}
assertIncludes('RUN_LOG.md', ['WO-065 Figma-ready basic UI scaffold and screen inventory', 'figma:handoff-readiness']);
const specGaps = read('SPEC_GAPS.md');
if (
  !specGaps.includes('No active gaps as of post-`WO-065` Figma handoff inventory review') &&
  !specGaps.includes('No active gaps as of post-`WO-066` standalone workflow completion / CR-2 review')
) {
  throw new Error('SPEC_GAPS.md must retain WO-065 or later no-active-gap evidence');
}

const status = JSON.parse(read('repo_status.json'));
if (status.work_orders?.['WO-065'] !== 'done') {
  throw new Error('repo_status.json must mark WO-065 done before Figma handoff readiness passes');
}
const nextWorkOrderNumber = status.next_work_order ? Number(String(status.next_work_order).slice(3)) : null;
if (nextWorkOrderNumber !== null && nextWorkOrderNumber < 66) {
  throw new Error(`repo_status.json must keep WO-066 or later as next_work_order after WO-065; found ${status.next_work_order}`);
}
if (!['todo', 'in_progress', 'done'].includes(status.work_orders?.['WO-066'])) {
  throw new Error('repo_status.json must keep WO-066 represented as todo, in_progress, or done after WO-065 is complete');
}

assertNoForbiddenClaims();

console.log(
  JSON.stringify(
    {
      status: 'ready_synthetic',
      workOrder: 'WO-065',
      gate: 'figma_handoff_readiness',
      handoffDocsChecked: handoffDocs.length,
      requiredSurfacesChecked: requiredSurfaces.length,
      requiredStatesChecked: requiredStates.length,
      roleViewsChecked: requiredRoles.length,
      route: '/aura-note/figma-handoff',
      productionLaunchClaimed: false,
      livePhiOrVendorTouched: false,
      nextWorkOrder: status.next_work_order
    },
    null,
    2
  )
);
