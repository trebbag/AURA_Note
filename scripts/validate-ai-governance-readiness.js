const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assertIncludes(relativePath, expected, label = expected) {
  const contents = read(relativePath);
  if (!contents.includes(expected)) {
    throw new Error(`${relativePath} is missing ${label}`);
  }
}

function assertNotIncludes(relativePath, forbidden, label = forbidden) {
  const contents = read(relativePath);
  if (contents.includes(forbidden)) {
    throw new Error(`${relativePath} contains forbidden ${label}`);
  }
}

const requiredSnippets = [
  ['packages/ai-gateway/src/index.ts', 'AI_MODEL_CONFIGURATIONS', 'model configuration records'],
  ['packages/ai-gateway/src/index.ts', 'AI_EVALUATION_CASES', 'deterministic evaluation cases'],
  ['packages/ai-gateway/src/index.ts', 'runDeterministicAiEvaluationCase', 'evaluation harness'],
  ['packages/ai-gateway/src/index.ts', 'inspectAiGatewayResponse', 'output validation evidence'],
  ['packages/ai-gateway/src/index.ts', 'liveModelCalled: false', 'no live model call evidence'],
  ['apps/api/src/ai/ai.service.ts', 'ai.evaluation_run_completed.v1', 'evaluation completed event'],
  ['apps/api/src/ai/ai.service.ts', 'ai.output_rejected.v1', 'output rejection event'],
  ['apps/api/src/ai/ai.service.test.ts', 'runs deterministic governance evaluations without live model calls', 'evaluation unit test'],
  ['apps/api/src/ai/ai.e2e.test.ts', 'runs deterministic governance evaluations and rejects unsafe outputs', 'evaluation API test'],
  ['apps/web/app/aura-note/ai-governance/page.tsx', 'AI Governance Readiness', 'browser route'],
  ['apps/web/app/aura-note/ai-governance/page.tsx', 'External AI is disabled', 'visible external AI disabled posture'],
  ['apps/web/e2e/aura-note-routes.spec.ts', 'AI governance route exposes prompt, model, evaluation, validation', 'browser route test'],
  ['packages/contracts/openapi/aura-note.v1.yaml', '/ai-gateway/evaluations/run:', 'evaluation endpoint contract'],
  ['packages/contracts/openapi/aura-note.v1.yaml', '/ai-gateway/outputs/validate:', 'output validation endpoint contract'],
  ['docs/AI_PHI_GOVERNANCE.md', 'WO-046', 'AI governance documentation'],
  ['RUN_LOG.md', 'WO-046', 'run-log evidence']
];

for (const [relativePath, snippet, label] of requiredSnippets) {
  assertIncludes(relativePath, snippet, label);
}

const prohibitedSnippets = [
  ['packages/ai-gateway/src/index.ts', 'OPENAI_API_KEY', 'live OpenAI credential'],
  ['apps/api/src/ai/ai.service.ts', 'sk-', 'API key material'],
  ['apps/web/app/aura-note/ai-governance/page.tsx', 'claim submitted', 'claim submission claim'],
  ['apps/web/app/aura-note/ai-governance/page.tsx', 'medical necessity determined', 'medical necessity claim']
];

for (const [relativePath, snippet, label] of prohibitedSnippets) {
  assertNotIncludes(relativePath, snippet, label);
}

const status = JSON.parse(read('repo_status.json'));
const activeOrder = ['WO-047', 'WO-048', 'WO-049', 'WO-050', 'WO-051'];
if (!activeOrder.includes(status.next_work_order) || status.work_orders?.['WO-046'] !== 'done') {
  throw new Error('repo_status.json must mark WO-046 done and next_work_order advanced to WO-047 or later before AI governance readiness passes');
}

console.log('AI governance readiness verified: prompt/model metadata, eval harness, output validation, PHI guardrails, tests, docs, and status are present.');
