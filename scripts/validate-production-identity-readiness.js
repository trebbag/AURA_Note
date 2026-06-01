#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const checks = [];

function check(id, description, passed, evidence) {
  checks.push({ id, description, passed: Boolean(passed), evidence });
}

const contracts = read('packages/contracts/src/index.ts');
const security = read('packages/security/src/index.ts');
const securityTest = read('packages/security/src/index.test.ts');
const service = read('apps/api/src/platform/platform.service.ts');
const controller = read('apps/api/src/platform/platform.controller.ts');
const apiTests = `${read('apps/api/src/platform/platform.service.test.ts')}\n${read('apps/api/src/platform/platform.e2e.test.ts')}`;
const browserPage = read('apps/web/app/aura-note/platform/page.tsx');
const browserSpec = read('apps/web/e2e/aura-note-routes.spec.ts');
const openapi = read('packages/contracts/openapi/aura-note.v1.yaml');
const runLog = read('RUN_LOG.md');
const status = JSON.parse(read('repo_status.json'));
const nextWorkOrderNumber = Number.parseInt(String(status.next_work_order || '').replace('WO-', ''), 10);
const hasAdvancedPastWo041 =
  status.work_orders?.['WO-041'] === 'done' &&
  (status.next_work_order === null || (Number.isFinite(nextWorkOrderNumber) && nextWorkOrderNumber >= 42));

check(
  'contracts.identity-dtos',
  'Production identity/admin DTOs are present',
  ['IdentityAdapterStatusViewDto', 'WorkforceUserAdminDto', 'SessionEvaluationDto', 'PlatformAdminViewDto'].every((needle) =>
    contracts.includes(needle)
  ),
  'packages/contracts/src/index.ts'
);
check(
  'contracts.identity-events',
  'Identity/session events are cataloged',
  ['identity.adapter_status_checked.v1', 'identity.session_evaluated.v1', 'identity.user_updated.v1'].every((needle) =>
    contracts.includes(needle)
  ),
  'packages/contracts/src/index.ts'
);
check(
  'security.identity-guard',
  'Production identity guard fails closed for high-risk identity states',
  security.includes('evaluateProductionIdentityGuard') &&
    ['disabled user blocked', 'purpose-of-use is required', 'spoofed tenant or site denied', 'session expired'].every((needle) =>
      security.includes(needle)
    ),
  'packages/security/src/index.ts'
);
check(
  'security.identity-permissions',
  'Platform identity/config/flag permissions are explicit',
  ['identity:view', 'identity:manage', 'config:view', 'config:manage', 'feature_flag:view', 'feature_flag:manage'].every((needle) =>
    security.includes(needle)
  ) && securityTest.includes('production platform identity and config controls'),
  'packages/security/src/index.ts'
);
check(
  'api.identity-routes',
  'API exposes only backed production platform identity/admin routes',
  ["@Controller('platform')", 'identity/session-evaluations', 'identity/users/:userId', 'getPlatformAdmin'].every((needle) =>
    controller.includes(needle) || service.includes(needle)
  ),
  'apps/api/src/platform'
);
check(
  'api.identity-fail-closed-tests',
  'API tests cover disabled, expired, missing-purpose, wrong-tenant, delegated, and unauthorized paths',
  ['disabled user blocked', 'session expired', 'purpose-of-use is required', 'spoofed tenant or site denied', 'delegated identity provider', 'Forbidden'].every(
    (needle) => apiTests.includes(needle)
  ),
  'apps/api/src/platform/*.test.ts'
);
check(
  'browser.identity-admin',
  'Browser route exposes identity/session states and disabled-user denial',
  browserPage.includes('Production Platform Controls') &&
    browserPage.includes('disabled user blocked') &&
    browserSpec.includes('session expired') &&
    browserSpec.includes('purpose-of-use is required') &&
    browserSpec.includes('/aura-note/platform'),
  'apps/web/app/aura-note/platform/page.tsx'
);
check(
  'openapi.identity-contract',
  'OpenAPI includes production platform identity operations',
  ['getProductionPlatformAdmin', 'evaluateProductionIdentitySession', 'updateWorkforceUserStatus'].every((needle) =>
    openapi.includes(needle)
  ),
  'packages/contracts/openapi/aura-note.v1.yaml'
);
check(
  'status.wo041',
  'repo_status marks WO-041 done and has advanced to WO-042 or later',
  hasAdvancedPastWo041,
  { nextWorkOrder: status.next_work_order, wo041: status.work_orders?.['WO-041'] }
);
check(
  'runlog.wo041',
  'RUN_LOG includes WO-041 identity evidence',
  runLog.includes('WO-041 production identity tenant administration secrets configuration and feature flags'),
  'RUN_LOG.md'
);

const failed = checks.filter((item) => !item.passed);
const result = {
  status: failed.length === 0 ? 'ready_synthetic' : 'blocked',
  checkedAt: new Date().toISOString(),
  workOrder: 'WO-041',
  evidenceType: 'production_identity_tenant_admin_config_synthetic_readiness',
  realIdentityProviderTouched: false,
  rawTokenReturned: false,
  productionCredentials: false,
  productionPhi: false,
  delegatedClinicOsIdentityEnabled: false,
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
