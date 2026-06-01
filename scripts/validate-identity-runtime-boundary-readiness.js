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

const status = JSON.parse(read('repo_status.json'));
const packageJson = JSON.parse(read('package.json'));
const apiPackageJson = JSON.parse(read('apps/api/package.json'));
const workflow = read('.github/workflows/ci.yml');
const apiRuntime = read('apps/api/src/runtime/api-runtime.ts');
const identityRuntime = read('apps/api/src/runtime/identity-runtime.ts');
const identityMiddleware = read('apps/api/src/runtime/identity-runtime.middleware.ts');
const identityTest = read('apps/api/src/runtime/identity-runtime.e2e.test.ts');
const contracts = read('packages/contracts/src/index.ts');
const openApi = read('packages/contracts/openapi/aura-note.v1.yaml');
const backendSpec = read('docs/BACKEND_BUILD_SPEC.md');
const identityDoc = read('docs/IDENTITY_ACCESS_FOUNDATION.md');
const testPlan = read('docs/TEST_PLAN.md');
const productionPlan = read('docs/PRODUCTION_BUILD_PLAN.md');
const rbac = read('docs/RBAC_ABAC_MATRIX.md');
const modes = read('docs/STANDALONE_AND_CLINICOS_MODES.md');
const events = read('docs/API_EVENT_CONTRACTS.md');
const gaps = read('SPEC_GAPS.md');
const runLog = read('RUN_LOG.md');
const checkpoint = read('CHECKPOINT_REPORT.md');
const workOrderReadme = read('work_orders/README.md');

const checks = [];

function check(id, description, passed, evidence) {
  checks.push({ id, description, passed: Boolean(passed), evidence });
}

[
  'apps/api/src/runtime/identity-runtime.ts',
  'apps/api/src/runtime/identity-runtime.middleware.ts',
  'apps/api/src/runtime/identity-runtime.e2e.test.ts',
  'scripts/validate-identity-runtime-boundary-readiness.js'
].forEach((relativePath) => {
  check(`file.${relativePath}`, `${relativePath} exists`, exists(relativePath), relativePath);
});

check(
  'runtime.middleware-wired',
  'shared API runtime installs the identity runtime middleware after correlation',
  apiRuntime.includes('auraIdentityRuntimeMiddleware') &&
    apiRuntime.indexOf('auraCorrelationMiddleware') < apiRuntime.indexOf('auraIdentityRuntimeMiddleware'),
  'apps/api/src/runtime/api-runtime.ts'
);
check(
  'runtime.auth-mode-required',
  'identity runtime requires AURA_NOTE_AUTH_MODE outside health',
  identityRuntime.includes('AUTH_MODE_REQUIRED') && identityRuntime.includes('AURA_NOTE_AUTH_MODE'),
  'apps/api/src/runtime/identity-runtime.ts'
);
check(
  'runtime.local-modes',
  'identity runtime represents explicit local demo and strict local synthetic modes',
  identityRuntime.includes("'local_demo'") && identityRuntime.includes("'local_synthetic'"),
  'apps/api/src/runtime/identity-runtime.ts'
);
check(
  'runtime.production-fail-closed',
  'OIDC, SAML, and ClinicOS delegated modes fail closed until configured',
  identityRuntime.includes("'production_oidc'") &&
    identityRuntime.includes("'production_saml'") &&
    identityRuntime.includes("'clinicos_delegate'") &&
    identityRuntime.includes('IDENTITY_ADAPTER_NOT_CONFIGURED'),
  'apps/api/src/runtime/identity-runtime.ts'
);
check(
  'runtime.synthetic-forbidden',
  'synthetic headers are forbidden outside local/demo modes',
  identityRuntime.includes('SYNTHETIC_HEADERS_FORBIDDEN') && identityRuntime.includes('synthetic_headers_forbidden'),
  'apps/api/src/runtime/identity-runtime.ts'
);
check(
  'runtime.identity-states',
  'disabled user, expired session, wrong tenant/site, wrong purpose, and delegated denial states are implemented',
  ['DISABLED_USER_DENIED', 'SESSION_EXPIRED', 'TENANT_SITE_SCOPE_DENIED', 'PURPOSE_OF_USE_DENIED', 'DELEGATED_IDENTITY_NOT_CONFIGURED'].every((snippet) =>
    identityRuntime.includes(snippet)
  ),
  'apps/api/src/runtime/identity-runtime.ts'
);
check(
  'runtime.normalized-context',
  'identity runtime normalizes tenant/site/user/session/purpose/provider headers for service contexts',
  ['x-aura-user-id', 'x-aura-session-id', 'x-aura-purpose-of-use', 'x-aura-identity-provider'].every((snippet) =>
    identityRuntime.includes(snippet)
  ),
  'apps/api/src/runtime/identity-runtime.ts'
);
check(
  'runtime.audit-safe-logging',
  'identity middleware emits audit-safe accepted/denied metadata without raw tokens',
  identityMiddleware.includes('identity.accepted') &&
    identityMiddleware.includes('identity.denied') &&
    identityMiddleware.includes('liveCredentialPresent: false') &&
    identityMiddleware.includes('rawToken') === false,
  'apps/api/src/runtime/identity-runtime.middleware.ts'
);
check(
  'runtime.response-labels',
  'identity boundary labels local/demo posture through response headers',
  apiRuntime.includes('x-aura-auth-mode') &&
    apiRuntime.includes('x-aura-identity-source') &&
    identityMiddleware.includes("response.setHeader('x-aura-auth-mode'"),
  'apps/api/src/runtime/api-runtime.ts'
);

[
  'local demo auth posture is explicit',
  'strict local synthetic identity',
  'preview and production auth postures',
  'disabled users, expired sessions, wrong tenant/site, wrong purpose, and delegated identity',
  'support and billing role limits'
].forEach((snippet) => {
  check(`test.${snippet.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, `Identity runtime e2e covers ${snippet}`, identityTest.includes(snippet), 'apps/api/src/runtime/identity-runtime.e2e.test.ts');
});

check(
  'contracts.identity-runtime',
  'contracts seed identity runtime DTOs',
  contracts.includes('IdentityRuntimeBoundaryDecisionDto') && contracts.includes('AuraAuthModeDto'),
  'packages/contracts/src/index.ts'
);
check(
  'openapi.identity-runtime',
  'OpenAPI seeds identity runtime boundary schemas',
  openApi.includes('IdentityRuntimeBoundaryDecision') && openApi.includes('local_demo'),
  'packages/contracts/openapi/aura-note.v1.yaml'
);
check(
  'api-package.script',
  'API package exposes identity runtime test',
  apiPackageJson.scripts?.['test:identity-runtime']?.includes('identity-runtime.e2e.test.ts'),
  apiPackageJson.scripts?.['test:identity-runtime']
);
check(
  'api-package.explicit-demo',
  'API e2e suite runs under explicit local demo auth posture',
  apiPackageJson.scripts?.['test:e2e']?.startsWith('AURA_NOTE_AUTH_MODE=local_demo'),
  apiPackageJson.scripts?.['test:e2e']
);
check(
  'root.script',
  'root package exposes identity:runtime-boundary-readiness',
  packageJson.scripts?.['identity:runtime-boundary-readiness'] ===
    'pnpm --filter @aura-note/api test:identity-runtime && node scripts/validate-identity-runtime-boundary-readiness.js',
  packageJson.scripts?.['identity:runtime-boundary-readiness']
);
check(
  'ci.script',
  'CI runs identity runtime boundary readiness after API runtime hardening',
  workflow.includes('pnpm identity:runtime-boundary-readiness') &&
    workflow.indexOf('pnpm api:runtime-hardening-readiness') < workflow.indexOf('pnpm identity:runtime-boundary-readiness'),
  '.github/workflows/ci.yml'
);

[
  ['docs.identity', identityDoc],
  ['docs.backend', backendSpec],
  ['docs.test-plan', testPlan],
  ['docs.production-plan', productionPlan],
  ['docs.rbac', rbac],
  ['docs.modes', modes],
  ['docs.events', events]
].forEach(([id, text]) => {
  check(id, `${id} records WO-063 identity runtime boundary behavior`, text.includes('WO-063') && text.includes('AURA_NOTE_AUTH_MODE'), id);
});

check('status.wo063-done', 'repo_status marks WO-063 done', status.work_orders?.['WO-063'] === 'done', status.work_orders?.['WO-063']);
check(
  'status.next-wo064-or-later',
  'repo_status advances next work order to WO-064 or later after CR-1',
  status.next_work_order === null || Number.parseInt(String(status.next_work_order || '').replace('WO-', ''), 10) >= 64,
  status.next_work_order
);
check('status.checkpoint-cr2-or-later', 'repo_status advances to CR-2 or later after CR-1 checkpoint report', ['CR-2', 'CR-3', 'CR-4'].includes(status.current_checkpoint), status.current_checkpoint);
check(
  'work-order.readme',
  'work-order index records WO-063 completion and CR-1 closure',
  workOrderReadme.includes('`WO-063` is complete') && workOrderReadme.includes('CR-1'),
  'work_orders/README.md'
);
check('checkpoint.cr1', 'CHECKPOINT_REPORT records CR-1 evidence', checkpoint.includes('CR-1 Runtime Foundation Candidate') && checkpoint.includes('WO-063'), 'CHECKPOINT_REPORT.md');
check('runlog.wo063', 'RUN_LOG records WO-063 evidence', runLog.includes('WO-063 identity runtime boundary'), 'RUN_LOG.md');
check(
  'spec-gaps.wo063',
  'SPEC_GAPS records no active WO-063 gaps',
  gaps.includes('No active gaps as of post-`WO-063` identity runtime boundary review') ||
    gaps.includes('No active gaps as of post-`WO-069` athenahealth sandbox and vendor-neutral EHR runtime boundary review') ||
    gaps.includes('No active gaps as of post-`WO-070` AI governance runtime boundary review') ||
    gaps.includes('No active gaps as of post-`WO-075` commercial readiness decision gate review'),
  'SPEC_GAPS.md'
);

const prohibitedLaunchClaims = [
  'productionLaunchApproved=true',
  'productionLaunchReady=true',
  'liveOidcEnabled=true',
  'liveSamlEnabled=true',
  'liveClinicosDelegatedIdentityEnabled=true',
  'livePhiEnabled=true',
  'claimSubmissionEnabled=true'
];

const docsCorpus = [backendSpec, identityDoc, productionPlan, rbac, modes, events].join('\n');
prohibitedLaunchClaims.forEach((phrase) => {
  check(`prohibited.${phrase}`, `Docs do not claim ${phrase}`, !docsCorpus.includes(phrase), phrase);
});

const failed = checks.filter((item) => !item.passed);
const result = {
  status: failed.length === 0 ? 'ready_synthetic' : 'blocked',
  checkedAt: new Date().toISOString(),
  workOrder: 'WO-063',
  evidenceType: 'identity_runtime_boundary_fail_closed_auth_scaffold',
  productionLaunchReady: false,
  productionPhi: false,
  productionCredentials: false,
  liveIdentityProviderEnabled: false,
  liveClinicOsDelegationEnabled: false,
  autonomousClinicalCodingBillingEnabled: false,
  totalChecks: checks.length,
  passedChecks: checks.length - failed.length,
  failedChecks: failed.length,
  failures: failed,
  checks
};

console.log(JSON.stringify(result, null, 2));

if (failed.length > 0) {
  process.exitCode = 1;
}
