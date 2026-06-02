#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function listFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    if (['node_modules', '.git', '.next', '.turbo', 'coverage'].includes(entry.name)) continue;
    const relative = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFiles(relative));
    } else {
      out.push(relative);
    }
  }
  return out;
}

const checks = [];

function check(id, description, passed, evidence) {
  checks.push({ id, description, passed: Boolean(passed), evidence });
}

const contracts = read('packages/contracts/src/index.ts');
const service = read('apps/api/src/platform/platform.service.ts');
const controller = read('apps/api/src/platform/platform.controller.ts');
const tests = `${read('apps/api/src/platform/platform.service.test.ts')}\n${read('apps/api/src/platform/platform.e2e.test.ts')}`;
const browserPage = read('apps/web/app/aura-note/platform/page.tsx');
const browserSpec = read('apps/web/e2e/aura-note-routes.spec.ts');
const openapi = read('packages/contracts/openapi/aura-note.v1.yaml');
const runLog = read('RUN_LOG.md');
const status = JSON.parse(read('repo_status.json'));
const nextWorkOrderNumber = Number.parseInt(String(status.next_work_order || '').replace('WO-', ''), 10);
const hasAdvancedPastWo041 =
  status.work_orders?.['WO-041'] === 'done' &&
  (status.next_work_order === null || (Number.isFinite(nextWorkOrderNumber) && nextWorkOrderNumber >= 42));
const committedEnvLikeFiles = listFiles('.').filter((file) => {
  const base = path.basename(file);
  return (base === '.env' || base.startsWith('.env.')) && base !== '.env.example';
});

check(
  'contracts.config-dtos',
  'Config, secret-source, and high-risk feature-flag DTOs are present',
  ['SecretSourceStatusDto', 'ProductionConfigValidationDto', 'GovernedFeatureFlagDto', 'UpdateGovernedFeatureFlagRequestDto'].every(
    (needle) => contracts.includes(needle)
  ),
  'packages/contracts/src/index.ts'
);
check(
  'contracts.config-events',
  'Config and feature-flag events are cataloged',
  ['config.validation_completed.v1', 'feature_flag.updated.v1'].every((needle) => contracts.includes(needle)),
  'packages/contracts/src/index.ts'
);
check(
  'api.config-routes',
  'API exposes backed config validation and high-risk flag governance routes',
  controller.includes('config/validate') && controller.includes('feature-flags/:key') && service.includes('validateConfig') && service.includes('updateFeatureFlag'),
  'apps/api/src/platform'
);
check(
  'api.secret-redaction',
  'Secret validation is metadata-only and fail-closed for production-shaped config',
  service.includes('secretValuesReturned: false') &&
    service.includes('configuration validation payload must not contain obvious PHI or secret values') &&
    service.includes('productionCredentialsRequired') &&
    !service.includes('process.env.OIDC_CLIENT_SECRET'),
  'apps/api/src/platform/platform.service.ts'
);
check(
  'api.high-risk-flags',
  'High-risk feature flags default disabled and require approval before metadata-only enablement',
  [
    'AURA_ENABLE_LIVE_TRANSCRIPTION',
    'AURA_ENABLE_EXTERNAL_AI',
    'AURA_ENABLE_EHR_WRITEBACK',
    'AURA_ENABLE_PRODUCTION_STORAGE',
    'AURA_ENABLE_RETENTION_DELETION',
    'AURA_ENABLE_PATIENT_FACING_ESTIMATES',
    'AURA_ENABLE_CLAIM_SUBMISSION',
    'high-risk feature flags require approval evidence before enablement',
    'metadata_only_no_live_execution',
    'liveExecutionEnabled: false'
  ].every((needle) => service.includes(needle)),
  'apps/api/src/platform/platform.service.ts'
);
check(
  'tests.config-and-flags',
  'Tests cover production missing-secret failure and feature-flag approval requirements',
  tests.includes('validates production config fail-closed') &&
    tests.includes('approval evidence for high-risk flag changes') &&
    tests.includes('metadata_only_no_live_execution'),
  'apps/api/src/platform/*.test.ts'
);
check(
  'browser.config-and-flags',
  'Browser route exposes unsafe-config and approval-required states',
  browserPage.includes('secretValuesReturned=false') &&
    browserPage.includes('Validate Production Config') &&
    browserPage.includes('Attempt Enable Without Approval') &&
    browserPage.includes('Record Approval') &&
    browserSpec.includes('fail-closed errors=3') &&
    browserSpec.includes('high-risk feature flags require approval evidence before enablement') &&
    browserSpec.includes('metadata_only_no_live_execution'),
  'apps/web/app/aura-note/platform/page.tsx'
);
check(
  'openapi.config-contract',
  'OpenAPI includes config validation and high-risk feature-flag operations',
  ['validateProductionPlatformConfig', 'updateGovernedFeatureFlag', 'ProductionConfigValidation', 'GovernedFeatureFlag'].every((needle) =>
    openapi.includes(needle)
  ),
  'packages/contracts/openapi/aura-note.v1.yaml'
);
check(
  'repo.no-env-files',
  'No committed .env files are present',
  committedEnvLikeFiles.length === 0,
  committedEnvLikeFiles
);
check(
  'status.wo041',
  'repo_status marks WO-041 done and has advanced to WO-042 or later',
  hasAdvancedPastWo041,
  { nextWorkOrder: status.next_work_order, wo041: status.work_orders?.['WO-041'] }
);
check(
  'runlog.wo041',
  'RUN_LOG includes WO-041 config/flag evidence',
  runLog.includes('WO-041 production identity tenant administration secrets configuration and feature flags'),
  'RUN_LOG.md'
);

const failed = checks.filter((item) => !item.passed);
const result = {
  status: failed.length === 0 ? 'ready_synthetic' : 'blocked',
  checkedAt: new Date().toISOString(),
  workOrder: 'WO-041',
  evidenceType: 'production_config_secret_feature_flag_synthetic_readiness',
  secretValuesReturned: false,
  highRiskLiveExecutionEnabled: false,
  productionCredentials: false,
  productionPhi: false,
  claimSubmissionEnabled: false,
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
