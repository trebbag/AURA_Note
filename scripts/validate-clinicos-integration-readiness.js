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
  ['packages/clinicos-adapter/src/index.ts', 'getClinicOsModuleBoundaries', 'module boundary map'],
  ['packages/clinicos-adapter/src/index.ts', "permissionBoundary: 'aura_note_authoritative'", 'AURA Note permission boundary'],
  ['packages/clinicos-adapter/src/index.ts', 'payloadStored: false', 'no raw payload storage'],
  ['apps/api/src/integrations/clinicos.service.ts', 'clinicos.mapping_stale_detected.v1', 'stale mapping event'],
  ['apps/api/src/integrations/clinicos.service.ts', 'clinicos.event_publication_failed.v1', 'failed publication event'],
  ['apps/api/src/integrations/clinicos.service.ts', 'liveClinicOsSyncEnabled: false', 'live ClinicOS sync disabled'],
  ['apps/api/src/integrations/clinicos.service.test.ts', 'denies cross-tenant service-account attempts', 'cross-tenant denial test'],
  ['apps/api/src/integrations/clinicos.e2e.test.ts', 'records failed publication metadata without raw payload storage', 'failed publication API test'],
  ['apps/web/app/aura-note/integrations/clinicos/page.tsx', 'ClinicOS Integration Hardening', 'browser route'],
  ['apps/web/app/aura-note/integrations/clinicos/page.tsx', 'permissionBoundaryEnforced=true', 'visible permission boundary'],
  ['packages/contracts/openapi/aura-note.v1.yaml', '/integrations/clinicos/mappings:', 'mapping endpoint contract'],
  ['packages/contracts/openapi/aura-note.v1.yaml', '/integrations/clinicos/events/publish:', 'publication endpoint contract'],
  ['docs/STANDALONE_AND_CLINICOS_MODES.md', 'WO-045', 'mode documentation'],
  ['RUN_LOG.md', 'WO-045', 'run-log evidence']
];

for (const [relativePath, snippet, label] of requiredSnippets) {
  assertIncludes(relativePath, snippet, label);
}

const prohibitedSnippets = [
  ['apps/api/src/integrations/clinicos.service.ts', 'CLINICOS_PRODUCTION_URL', 'production ClinicOS URL'],
  ['apps/api/src/integrations/clinicos.service.ts', 'privateKey', 'private key'],
  ['apps/web/app/aura-note/integrations/clinicos/page.tsx', 'claim submitted', 'claim submission claim'],
  ['apps/web/app/aura-note/integrations/clinicos/page.tsx', 'medical necessity determined', 'medical necessity claim']
];

for (const [relativePath, snippet, label] of prohibitedSnippets) {
  assertNotIncludes(relativePath, snippet, label);
}

const status = JSON.parse(read('repo_status.json'));
const activeOrder = ['WO-046', 'WO-047', 'WO-048', 'WO-049', 'WO-050', 'WO-051', null];
if (!activeOrder.includes(status.next_work_order) || status.work_orders?.['WO-045'] !== 'done') {
  throw new Error('repo_status.json must mark WO-045 done and next_work_order advanced to WO-046 or later before ClinicOS readiness passes');
}

console.log('ClinicOS integration readiness verified: metadata-only boundaries, stale/degraded states, permissions, tests, docs, and status are present.');
