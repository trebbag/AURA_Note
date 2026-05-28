#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const workerSource = fs.readFileSync(path.join(root, 'apps/worker/src/main.ts'), 'utf8');
const supportSource = fs.readFileSync(path.join(root, 'apps/api/src/support/support.service.ts'), 'utf8');
const storageSource = fs.readFileSync(path.join(root, 'packages/storage/src/index.ts'), 'utf8');
const docs = [
  'docs/BACKEND_BUILD_SPEC.md',
  'docs/DATA_MODEL.md',
  'docs/TEST_PLAN.md',
  'docs/POST_CP4_PRODUCTIONIZATION_BACKLOG.md'
]
  .map((file) => fs.readFileSync(path.join(root, file), 'utf8'))
  .join('\n');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

const requiredSnippets = [
  'recoveryWindowEndsAt',
  'blocked_recovery_window',
  'transcriptPurgeCount: 0',
  'evaluateBackupRestoreReadiness',
  'AZURE_BLOB_SOFT_DELETE_ENABLED',
  'AZURE_BLOB_VERSIONING_ENABLED',
  'DATABASE_BACKUP_CONFIGURED',
  'restoreExecutionEnabled: false',
  'WO-042'
];

const corpus = [workerSource, supportSource, storageSource, docs].join('\n');
const missing = requiredSnippets.filter((snippet) => !corpus.includes(snippet));
const result = {
  status: missing.length === 0 ? 'ready_synthetic' : 'blocked',
  checkedAt: new Date().toISOString(),
  evidenceType: 'retention_deletion_backup_restore_static_unit_api',
  productionRestoreExecutionEnabled: false,
  transcriptDeletionEnabled: false,
  liveStorageTouched: false,
  packageScriptPresent:
    packageJson.scripts?.['retention:production-readiness'] ===
    'pnpm --filter @aura-note/worker test && pnpm --filter @aura-note/storage test && node scripts/validate-retention-production-readiness.js',
  missing
};

console.log(JSON.stringify(result, null, 2));

if (missing.length > 0 || !result.packageScriptPresent) {
  process.exitCode = 1;
}
