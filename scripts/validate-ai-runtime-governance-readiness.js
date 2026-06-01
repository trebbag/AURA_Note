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

function assertIncludes(relativePath, snippets) {
  const content = read(relativePath);
  for (const snippet of snippets) {
    if (!content.includes(snippet)) {
      throw new Error(`${relativePath} is missing required WO-070 AI runtime-governance evidence: ${snippet}`);
    }
  }
}

function assertNotIncludes(relativePath, snippets) {
  if (!exists(relativePath)) return;
  const content = read(relativePath);
  for (const snippet of snippets) {
    if (content.includes(snippet)) {
      throw new Error(`${relativePath} contains forbidden WO-070 live-AI or autonomous behavior evidence: ${snippet}`);
    }
  }
}

assertIncludes('package.json', [
  '"ai:runtime-governance-readiness"',
  'validate-ai-runtime-governance-readiness.js'
]);
assertIncludes('.github/workflows/ci.yml', ['pnpm ai:runtime-governance-readiness']);
assertIncludes('apps/api/package.json', ['test:ai-runtime-governance', 'src/ai/ai.service.test.ts', 'src/ai/ai.e2e.test.ts']);
assertIncludes('packages/ai-gateway/src/index.ts', [
  'AiBlockedBehavior',
  'eval-claim-submission-rejected-v1',
  'eval-medical-necessity-rejected-v1',
  'eval-order-placement-rejected-v1',
  'eval-patient-financial-conclusion-rejected-v1',
  'eval-source-stale-human-review-blocked-v1',
  'schemaValidationStatus',
  'sourceFreshnessStatus',
  'deriveBlockedBehavior'
]);
assertIncludes('packages/ai-gateway/src/index.test.ts', [
  'blocks deterministic prohibited-output evaluation cases without live model calls',
  'blocks stale-source evaluation cases before user-facing adoption'
]);
assertIncludes('packages/contracts/src/index.ts', [
  'AiRuntimeBoundaryDto',
  'AiRuntimeBoundaryResponseDto',
  'ai.runtime_boundary_checked.v1',
  'ai.request_denied.v1',
  'ai.human_review_required.v1',
  'ai.regression_blocked.v1'
]);
assertIncludes('packages/contracts/openapi/aura-note.v1.yaml', [
  '/ai-gateway/runtime-boundary:',
  'AiRuntimeBoundaryResponse',
  'AiRuntimeBoundary',
  'sourceFreshnessStatus',
  'blockedBehavior'
]);
assertIncludes('apps/api/src/ai/ai.controller.ts', ["@Get('runtime-boundary')"]);
assertIncludes('apps/api/src/ai/ai.service.ts', [
  'getRuntimeBoundary',
  'createRuntimeBoundary',
  'ai.runtime_boundary_checked.v1',
  'ai.request_denied.v1',
  'ai.human_review_required.v1',
  'ai.regression_blocked.v1',
  'liveModelCallsEnabled: false',
  'rawPhiToExternalAiAllowed: false',
  "driftMonitoringStatus: 'placeholder_disabled'"
]);
assertIncludes('apps/api/src/ai/ai.service.test.ts', [
  'reports AI runtime boundary without enabling live model calls',
  'runs deterministic prohibited-output governance regressions without live model calls'
]);
assertIncludes('apps/api/src/ai/ai.e2e.test.ts', [
  '/api/v1/ai-gateway/runtime-boundary',
  'regressionBlockedCount',
  'source_stale'
]);
assertIncludes('apps/web/lib/aura-note-api-client.ts', ['getAiRuntimeBoundary', 'AiRuntimeBoundaryResponseDto']);
assertIncludes('apps/web/app/aura-note/ai-governance/page.tsx', [
  'CR-3 / WO-070',
  'AI runtime boundary evidence',
  'server_side_ai_gateway',
  'liveModelCallsEnabled',
  'rawPhiToExternalAiAllowed',
  'Validate Source-Stale Output',
  'Reject PHI Context',
  'Scrub PHI Context',
  'unsafe_output_rejected',
  'human_review_required'
]);
assertIncludes('apps/web/e2e/aura-note-routes.spec.ts', [
  'AI runtime boundary evidence',
  'liveModelCallsEnabled=false',
  'Validate Source-Stale Output',
  'Reject PHI Context',
  'Scrub PHI Context'
]);
assertIncludes('docs/AI_PHI_GOVERNANCE.md', ['WO-070', 'runtime boundary']);
assertIncludes('docs/API_EVENT_CONTRACTS.md', ['WO-070', 'ai.runtime_boundary_checked.v1', 'ai.regression_blocked.v1']);
assertIncludes('docs/DATA_MODEL.md', ['WO-070', 'AiRuntimeBoundaryDto']);
assertIncludes('docs/RBAC_ABAC_MATRIX.md', ['WO-070', 'AI runtime']);
assertIncludes('docs/STANDALONE_AND_CLINICOS_MODES.md', ['WO-070', 'AI Gateway']);
assertIncludes('docs/BACKEND_BUILD_SPEC.md', ['WO-070', '/ai-gateway/runtime-boundary']);
assertIncludes('docs/TEST_PLAN.md', ['WO-070', 'ai:runtime-governance-readiness']);
assertIncludes('docs/PRODUCTION_BUILD_PLAN.md', ['Implementation status as of `WO-070`']);
assertIncludes('docs/REMAINING_SYNTHETIC_TO_RUNTIME_GAPS.md', ['WO-070', 'live AI']);
assertIncludes('RUN_LOG.md', ['WO-070 AI governance runtime boundary']);
assertIncludes('SPEC_GAPS.md', ['No active gaps as of post-`WO-070` AI governance runtime boundary review']);
assertIncludes('CHECKPOINT_REPORT.md', ['CR-3', 'WO-070']);
assertIncludes('work_orders/README.md', ['`WO-070` is complete', 'CR-3']);

const packageJson = JSON.parse(read('package.json'));
if (
  packageJson.scripts?.['ai:runtime-governance-readiness'] !==
  'pnpm --filter @aura-note/ai-gateway test && pnpm --filter @aura-note/api test:ai-runtime-governance && node scripts/validate-ai-runtime-governance-readiness.js'
) {
  throw new Error('package.json ai:runtime-governance-readiness script is not the expected focused W070 gate');
}

const apiPackageJson = JSON.parse(read('apps/api/package.json'));
if (!String(apiPackageJson.scripts?.['test:ai-runtime-governance']).includes('src/ai/ai.e2e.test.ts')) {
  throw new Error('apps/api/package.json test:ai-runtime-governance must include AI e2e coverage');
}

const status = JSON.parse(read('repo_status.json'));
if (status.work_orders?.['WO-070'] !== 'done') {
  throw new Error('repo_status.json must mark WO-070 done before AI runtime-governance readiness passes');
}
if (status.current_checkpoint !== 'CR-3') {
  throw new Error(`repo_status.json must remain at CR-3 for the checkpoint stop; found ${status.current_checkpoint}`);
}
if (status.next_work_order !== null) {
  throw new Error(`repo_status.json must stop at the CR-3 checkpoint with next_work_order null; found ${status.next_work_order}`);
}

assertNotIncludes('packages/ai-gateway/src/index.ts', [
  'OPENAI_API_KEY',
  'liveModelCallsEnabled: true',
  'rawPhiToExternalAiAllowed: true',
  'privateBaaApproved: true',
  'productionPromptStoreEnabled: true'
]);
assertNotIncludes('apps/api/src/ai/ai.service.ts', [
  'liveModelCallsEnabled: true',
  'rawPhiToExternalAiAllowed: true',
  'submittedClaim = true',
  'determinesMedicalNecessity = true'
]);

console.log(
  JSON.stringify(
    {
      status: 'ready_synthetic',
      workOrder: 'WO-070',
      checkpoint: 'CR-3 checkpoint',
      gate: 'ai_runtime_governance_readiness',
      serverSideAiGatewayBoundary: true,
      liveModelCallsEnabled: false,
      rawPhiToExternalAiAllowed: false,
      deterministicEvaluationCasesExpanded: true,
      unsafeOutputRejected: true,
      humanReviewRequired: true,
      nextWorkOrder: status.next_work_order
    },
    null,
    2
  )
);
