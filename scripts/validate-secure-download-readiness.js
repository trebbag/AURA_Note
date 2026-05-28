#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const storageSource = fs.readFileSync(path.join(root, 'packages/storage/src/index.ts'), 'utf8');
const scheduleService = fs.readFileSync(path.join(root, 'apps/api/src/schedule/schedule.service.ts'), 'utf8');
const supportService = fs.readFileSync(path.join(root, 'apps/api/src/support/support.service.ts'), 'utf8');
const openApi = fs.readFileSync(path.join(root, 'packages/contracts/openapi/aura-note.v1.yaml'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

const requiredSnippets = [
  'deliverSignedDownload',
  'serverMediated: true',
  'publicUrl: null',
  'storage.download_denied.v1',
  'storage.object_delivered.v1',
  '/notes/{noteId}/exports/{exportArtifactId}/download',
  '/support/audit-exports/{auditExportId}/download',
  'role cannot download this finalized artifact',
  'role cannot download audit export'
];

const corpus = [storageSource, scheduleService, supportService, openApi].join('\n');
const missing = requiredSnippets.filter((snippet) => !corpus.includes(snippet));
const result = {
  status: missing.length === 0 ? 'ready_synthetic' : 'blocked',
  checkedAt: new Date().toISOString(),
  evidenceType: 'server_mediated_secure_download_static_unit_api',
  publicUrlsEnabled: false,
  liveAzureTouched: false,
  packageScriptPresent:
    packageJson.scripts?.['storage:secure-download-readiness'] ===
    'pnpm --filter @aura-note/storage test && pnpm --filter @aura-note/api test && node scripts/validate-secure-download-readiness.js',
  missing
};

console.log(JSON.stringify(result, null, 2));

if (missing.length > 0 || !result.packageScriptPresent) {
  process.exitCode = 1;
}
