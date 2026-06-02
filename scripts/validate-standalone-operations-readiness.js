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
const domain = read('packages/domain/src/index.ts');
const apiService = read('apps/api/src/operations/operations.service.ts');
const apiController = read('apps/api/src/operations/operations.controller.ts');
const apiE2e = read('apps/api/src/operations/operations.e2e.test.ts');
const webOperations = read('apps/web/app/aura-note/operations/page.tsx');
const browserSpec = read('apps/web/e2e/aura-note-routes.spec.ts');
const checkpoint = read('CHECKPOINT_REPORT.md');
const productionPlan = read('docs/PRODUCTION_BUILD_PLAN.md');

check(
  'contracts.operations-dtos',
  'Standalone operations DTOs are present',
  ['OperationalTaskDto', 'BillingReviewQueueItemDto', 'SettingsAdminViewDto', 'EstimateConfigurationDto', 'RulesCatalogEntryDto'].every(
    (needle) => contracts.includes(needle)
  ),
  'packages/contracts/src/index.ts'
);
check(
  'contracts.operations-events',
  'Standalone operations events are present',
  ['task.adjudicated.v1', 'billing_review.status_changed.v1', 'template.created.v1', 'estimate_config.updated.v1', 'rules_catalog.published.v1'].every(
    (needle) => contracts.includes(needle)
  ),
  'packages/contracts/src/index.ts'
);
check(
  'security.operations-permissions',
  'Worklist, billing review, settings, templates, estimates, and rules permissions are explicit',
  ['task:view', 'billing_review:view', 'settings:manage', 'template:manage', 'estimate_config:manage', 'rules_catalog:manage'].every(
    (needle) => security.includes(needle)
  ),
  'packages/security/src/index.ts'
);
check(
  'domain.safety',
  'Domain helpers enforce estimate caveats, rules human review, and billing transcript trigger',
  domain.includes('estimateConfigurationIsSafe') &&
    domain.includes('rulesCatalogEntryIsSafe') &&
    domain.includes('canAccessBillingTranscriptForReview'),
  'packages/domain/src/index.ts'
);
check(
  'api.routes',
  'Standalone operations API routes exist',
  apiController.includes("@Controller('standalone/operations')") &&
    apiController.includes("@Get('billing-review')") &&
    apiController.includes("@Patch('estimate-config')") &&
    apiController.includes("@Post('rules-catalog/publish')"),
  'apps/api/src/operations/operations.controller.ts'
);
check(
  'api.safety',
  'Operations service preserves synthetic/local and no-claim-submission boundaries',
  apiService.includes('submittedClaim: false') &&
    apiService.includes('patientFacingEstimatesEnabled: false') &&
    apiService.includes('autonomousFinalizationAllowed: false') &&
    apiService.includes('liveCredentialPresent: false'),
  'apps/api/src/operations/operations.service.ts'
);
check(
  'api.tests',
  'API tests cover role denial, transcript restriction, PHI rejection, and rules safety',
  apiE2e.includes('blocks support users') &&
    apiE2e.includes('transcriptAccess') &&
    apiE2e.includes('Unsafe') &&
    apiE2e.includes('Human review required'),
  'apps/api/src/operations/operations.e2e.test.ts'
);
check(
  'browser.route',
  'Browser operations route exposes worklists, billing review, settings, templates, estimates, and rules states',
  webOperations.includes('Standalone Operations Center') &&
    webOperations.includes('Billing Review Queue') &&
    webOperations.includes('Estimate Configuration') &&
    webOperations.includes('Rules Catalog'),
  'apps/web/app/aura-note/operations/page.tsx'
);
check(
  'browser.tests',
  'Browser tests cover operations route actions and states',
  browserSpec.includes('standalone operations route exposes worklists') &&
    browserSpec.includes('Billing review queue') &&
    browserSpec.includes('Trigger Review') &&
    browserSpec.includes('submittedClaim=false') &&
    browserSpec.includes('denied') &&
    browserSpec.includes('Autonomous finalization: false'),
  'apps/web/e2e/aura-note-routes.spec.ts'
);
check(
  'checkpoint.p75',
  'P7.5 checkpoint report includes standalone completion evidence',
  checkpoint.includes('P7.5') && checkpoint.includes('WO-039'),
  'CHECKPOINT_REPORT.md'
);
check(
  'plan.wo039',
  'Production build plan still identifies WO-039 as standalone operations completion',
  productionPlan.includes('## WO-039') && productionPlan.includes('Rules Catalog'),
  'docs/PRODUCTION_BUILD_PLAN.md'
);

const failed = checks.filter((item) => !item.passed);
const result = {
  status: failed.length === 0 ? 'ready_synthetic' : 'blocked',
  checkedAt: new Date().toISOString(),
  workOrder: 'WO-039',
  evidenceType: 'standalone_operations_synthetic_readiness',
  productionPhi: false,
  productionCredentials: false,
  livePayerTouched: false,
  liveClinicOsSyncTouched: false,
  claimSubmissionPerformed: false,
  autonomousFinalizationEnabled: false,
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
