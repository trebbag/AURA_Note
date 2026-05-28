const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assertIncludes(relativePath, needles) {
  const content = read(relativePath);
  for (const needle of needles) {
    if (!content.includes(needle)) {
      throw new Error(`${relativePath} is missing required frontend runtime evidence: ${needle}`);
    }
  }
}

function assertNoLaunchClaims() {
  const forbidden = [
    'production launch approved',
    'HIPAA certified',
    'SOC2 certified',
    'autonomous claim submission enabled',
    'live PHI processing enabled'
  ];
  const files = [
    'docs/FRONTEND_RUNTIME_INTEGRATION.md',
    'RUN_LOG.md',
    'CHECKPOINT_REPORT.md',
    'repo_status.json'
  ];
  for (const file of files) {
    const content = read(file).toLowerCase();
    for (const phrase of forbidden) {
      if (content.includes(phrase.toLowerCase())) {
        throw new Error(`${file} contains prohibited launch/certification claim: ${phrase}`);
      }
    }
  }
}

const requiredRoutes = [
  '/aura-note/runtime-integration',
  '/aura-note/schedule',
  '/aura-note/drafts',
  '/aura-note/workspace/[appointmentId]',
  '/aura-note/finalization/[noteId]',
  '/aura-note/finalized',
  '/aura-note/finalized/[noteId]',
  '/aura-note/operations',
  '/aura-note/platform',
  '/aura-note/integrations/ehr',
  '/aura-note/integrations/clinicos',
  '/aura-note/ai-governance',
  '/aura-note/coaching',
  '/aura-note/support/status'
];

assertIncludes('package.json', ['"frontend:runtime-integration-readiness"']);
assertIncludes('.github/workflows/ci.yml', ['pnpm frontend:runtime-integration-readiness']);
assertIncludes('playwright.config.ts', ['AURA_NOTE_API_BASE_URL', 'AURA_NOTE_API_E2E_PORT', 'pnpm --filter @aura-note/api exec tsx src/main.ts']);
assertIncludes('apps/web/lib/aura-note-api-client.ts', [
  "from '@aura-note/contracts'",
  'createAuraNoteApiClient',
  'frontendRuntimeBillingAttestationStatements'
]);
assertIncludes('apps/web/app/aura-note/runtime-integration/page.tsx', [
  'Frontend Runtime Integration Evidence',
  'typed API responses',
  'persisted_backend_refetch'
]);
assertIncludes('apps/web/e2e/aura-note-routes.spec.ts', [
  'frontend runtime integration gate exercises backend-backed appointment through finalization export and reload evidence',
  'createAppointment',
  'signAndDispatch',
  'generateFinalNotePdf',
  'page.reload()'
]);
assertIncludes('docs/FRONTEND_RUNTIME_INTEGRATION.md', [
  'Runtime Inventory',
  'Playwright Evidence',
  'synthetic/local evidence only',
  'P10 launch-candidate readiness remains blocked'
]);

const inventory = read('docs/FRONTEND_RUNTIME_INTEGRATION.md');
for (const route of requiredRoutes) {
  if (!inventory.includes(route)) {
    throw new Error(`docs/FRONTEND_RUNTIME_INTEGRATION.md is missing route inventory entry for ${route}`);
  }
}
for (const state of ['loading', 'empty', 'ready', 'saving', 'failed', 'permission-denied', 'read-only']) {
  if (!inventory.includes(state)) {
    throw new Error(`docs/FRONTEND_RUNTIME_INTEGRATION.md is missing required state vocabulary ${state}`);
  }
}

const status = JSON.parse(read('repo_status.json'));
if (status.work_orders?.['WO-048'] !== 'done' || status.next_work_order !== 'WO-049') {
  throw new Error('repo_status.json must mark WO-048 done and advance next_work_order to WO-049 before frontend runtime readiness passes');
}

assertIncludes('RUN_LOG.md', ['WO-048', 'frontend:runtime-integration-readiness']);
assertIncludes('docs/TEST_PLAN.md', ['WO-048', 'frontend:runtime-integration-readiness']);
assertIncludes('docs/UX_BUILD_SPEC.md', ['WO-048', 'Frontend Runtime Integration Gate']);
assertIncludes('docs/BACKEND_BUILD_SPEC.md', ['WO-048', 'typed API client']);
assertIncludes('work_orders/README.md', ['WO-048` is complete']);
assertNoLaunchClaims();

console.log(
  JSON.stringify(
    {
      status: 'ready_synthetic',
      workOrder: 'WO-048',
      gate: 'frontend_runtime_integration',
      runtimeRouteAdded: true,
      typedApiClientEvidence: true,
      backendBackedWorkflowPlaywrightEvidence: true,
      launchCandidateClaimed: false,
      livePhiOrVendorTouched: false
    },
    null,
    2
  )
);
