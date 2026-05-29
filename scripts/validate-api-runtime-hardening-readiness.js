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
const main = read('apps/api/src/main.ts');
const apiRuntime = read('apps/api/src/runtime/api-runtime.ts');
const validationPipe = read('apps/api/src/runtime/aura-validation.pipe.ts');
const exceptionFilter = read('apps/api/src/runtime/aura-exception.filter.ts');
const boundaryMiddleware = read('apps/api/src/runtime/request-boundary.middleware.ts');
const runtimeTest = read('apps/api/src/runtime/runtime-boundary.e2e.test.ts');
const openApi = read('packages/contracts/openapi/aura-note.v1.yaml');
const contracts = read('packages/contracts/src/index.ts');
const backendSpec = read('docs/BACKEND_BUILD_SPEC.md');
const testPlan = read('docs/TEST_PLAN.md');
const productionPlan = read('docs/PRODUCTION_BUILD_PLAN.md');
const gaps = read('SPEC_GAPS.md');
const runLog = read('RUN_LOG.md');
const workOrderReadme = read('work_orders/README.md');

const checks = [];

function check(id, description, passed, evidence) {
  checks.push({ id, description, passed: Boolean(passed), evidence });
}

[
  'apps/api/src/runtime/api-runtime.ts',
  'apps/api/src/runtime/aura-validation.pipe.ts',
  'apps/api/src/runtime/aura-exception.filter.ts',
  'apps/api/src/runtime/request-boundary.middleware.ts',
  'apps/api/src/runtime/runtime-log.ts',
  'apps/api/src/runtime/runtime-boundary.e2e.test.ts'
].forEach((relativePath) => {
  check(`file.${relativePath}`, `${relativePath} exists`, exists(relativePath), relativePath);
});

check('main.configure', 'main.ts uses shared API runtime configuration', main.includes('configureAuraApi(app)'), 'apps/api/src/main.ts');
check('runtime.global-prefix', 'shared runtime sets api/v1 global prefix', apiRuntime.includes("app.setGlobalPrefix('api/v1')"), 'apps/api/src/runtime/api-runtime.ts');
check('runtime.validation-pipe', 'shared runtime installs the global validation pipe', apiRuntime.includes('useGlobalPipes(new AuraRequestValidationPipe())'), 'apps/api/src/runtime/api-runtime.ts');
check('runtime.exception-filter', 'shared runtime installs the PHI-safe exception filter', apiRuntime.includes('useGlobalFilters(new AuraExceptionFilter())'), 'apps/api/src/runtime/api-runtime.ts');
check('runtime.security-headers', 'runtime applies security headers', boundaryMiddleware.includes('x-content-type-options') && boundaryMiddleware.includes('permissions-policy'), 'apps/api/src/runtime/request-boundary.middleware.ts');
check('runtime.correlation', 'runtime applies request and trace correlation headers', boundaryMiddleware.includes('x-aura-request-id') && boundaryMiddleware.includes('x-aura-trace-id'), 'apps/api/src/runtime/request-boundary.middleware.ts');
check('runtime.body-limit', 'runtime applies body-size guardrails', boundaryMiddleware.includes('AURA_MAX_BODY_BYTES') && runtimeTest.includes('PAYLOAD_TOO_LARGE'), 'apps/api/src/runtime/request-boundary.middleware.ts');
check('runtime.throttle-scaffold', 'runtime has local throttle/rate-limit scaffold', boundaryMiddleware.includes('RATE_LIMIT_MAX_REQUESTS') && boundaryMiddleware.includes('x-ratelimit-limit'), 'apps/api/src/runtime/request-boundary.middleware.ts');
check('runtime.missing-role', 'runtime fails closed when role context is missing outside health', boundaryMiddleware.includes('Missing AURA Note role context'), 'apps/api/src/runtime/request-boundary.middleware.ts');
check('runtime.invalid-context', 'runtime validates role and purpose-of-use headers', boundaryMiddleware.includes('Invalid AURA Note role context') && boundaryMiddleware.includes('Invalid AURA Note purpose-of-use context'), 'apps/api/src/runtime/request-boundary.middleware.ts');
check('validation.phi', 'validation pipe rejects forbidden PHI-like payloads outside governed AI package handling', validationPipe.includes('scanForForbiddenPhiKeys') && validationPipe.includes('isAiGatewayGovernedPayload'), 'apps/api/src/runtime/aura-validation.pipe.ts');
check('validation.raw-assets', 'validation pipe rejects raw transcript, raw audio, and production credential fields', validationPipe.includes('rawTranscript') && validationPipe.includes('rawAudio') && validationPipe.includes('productionConnectionString'), 'apps/api/src/runtime/aura-validation.pipe.ts');
check('errors.standard-envelope', 'exception filter emits ApiErrorEnvelope', exceptionFilter.includes('ApiErrorEnvelope') && exceptionFilter.includes('redacted: true'), 'apps/api/src/runtime/aura-exception.filter.ts');
check('errors.safe-ai-details', 'exception filter preserves audit-safe structured rejection details after redaction', exceptionFilter.includes('safeDetails') && exceptionFilter.includes('redactForStructuredLog'), 'apps/api/src/runtime/aura-exception.filter.ts');
check('logging.redacted', 'runtime log path uses structured log redaction', read('apps/api/src/runtime/runtime-log.ts').includes('createStructuredLogEntry'), 'apps/api/src/runtime/runtime-log.ts');

[
  'missing, invalid, and cross-tenant request contexts',
  'invalid body shapes',
  'PHI-like request bodies',
  'oversized bodies',
  'structured logs'
].forEach((snippet) => {
  check(`test.${snippet.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, `Runtime e2e covers ${snippet}`, runtimeTest.includes(snippet), 'apps/api/src/runtime/runtime-boundary.e2e.test.ts');
});

check('contracts.error-envelope', 'contracts export ApiErrorEnvelope', contracts.includes('export interface ApiErrorEnvelope'), 'packages/contracts/src/index.ts');
check('openapi.error-envelope', 'OpenAPI includes ApiErrorEnvelope schema', openApi.includes('ApiErrorEnvelope') && openApi.includes('request_too_large'), 'packages/contracts/openapi/aura-note.v1.yaml');
check('api-package.script', 'API package exposes runtime hardening test', apiPackageJson.scripts?.['test:runtime-hardening']?.includes('runtime-boundary.e2e.test.ts'), apiPackageJson.scripts?.['test:runtime-hardening']);
check('root.script', 'root package exposes api:runtime-hardening-readiness', packageJson.scripts?.['api:runtime-hardening-readiness'] === 'pnpm --filter @aura-note/api test:runtime-hardening && node scripts/validate-api-runtime-hardening-readiness.js', packageJson.scripts?.['api:runtime-hardening-readiness']);
check('ci.script', 'CI runs API runtime hardening before PHI DB review and production readiness', workflow.includes('pnpm api:runtime-hardening-readiness') && workflow.indexOf('pnpm api:runtime-hardening-readiness') < workflow.indexOf('pnpm persistence:phi-db-review-readiness'), '.github/workflows/ci.yml');
check('docs.backend', 'Backend spec records WO-062 boundary behavior', backendSpec.includes('WO-062') && backendSpec.includes('PHI-safe API error envelopes'), 'docs/BACKEND_BUILD_SPEC.md');
check('docs.test-plan', 'Test plan records WO-062 runtime boundary coverage', testPlan.includes('WO-062 API runtime hardening evidence') && testPlan.includes('pnpm api:runtime-hardening-readiness'), 'docs/TEST_PLAN.md');
check('docs.production-plan', 'Production plan records WO-062 implementation status', productionPlan.includes('Implementation status as of `WO-062`'), 'docs/PRODUCTION_BUILD_PLAN.md');
check('status.wo062-done', 'repo_status marks WO-062 done', status.work_orders?.['WO-062'] === 'done', status.work_orders?.['WO-062']);
check('status.next-wo063', 'repo_status advances next work order to WO-063', status.next_work_order === 'WO-063', status.next_work_order);
check('work-order.readme', 'work-order index records WO-062 completion and WO-063 as next active', workOrderReadme.includes('`WO-062` is complete') && workOrderReadme.includes('`WO-063` is the next active work order'), 'work_orders/README.md');
check('runlog.wo062', 'RUN_LOG records WO-062 evidence', runLog.includes('WO-062 API runtime hardening and request boundary'), 'RUN_LOG.md');
check('spec-gaps.wo062', 'SPEC_GAPS records no active WO-062 gaps', gaps.includes('No active gaps as of post-`WO-062` API runtime hardening and request-boundary review'), 'SPEC_GAPS.md');

const prohibited = [
  ['production launch approved', backendSpec + testPlan + productionPlan],
  ['HIPAA certified', backendSpec + testPlan + productionPlan],
  ['live WAF enabled', backendSpec + testPlan + productionPlan],
  ['live SIEM enabled', backendSpec + testPlan + productionPlan],
  ['external AI enabled', backendSpec + testPlan + productionPlan],
  ['claim submission enabled', backendSpec + testPlan + productionPlan]
];

prohibited.forEach(([phrase, corpus]) => {
  check(`prohibited.${phrase.replace(/[^a-z0-9]+/gi, '-')}`, `Docs do not claim ${phrase}`, !corpus.includes(phrase), phrase);
});

const failed = checks.filter((item) => !item.passed);
const result = {
  status: failed.length === 0 ? 'ready_synthetic' : 'blocked',
  checkedAt: new Date().toISOString(),
  workOrder: 'WO-062',
  evidenceType: 'api_runtime_hardening_request_boundary',
  productionLaunchReady: false,
  productionPhi: false,
  productionCredentials: false,
  liveVendorTouched: false,
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
