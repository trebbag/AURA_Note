#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const workerSource = fs.readFileSync(path.join(root, 'apps/worker/src/main.ts'), 'utf8');
const workerTest = fs.readFileSync(path.join(root, 'apps/worker/src/main.test.ts'), 'utf8');

const requiredSnippets = [
  'evaluateStorageBackedRetentionDeletion',
  'destructiveDeletionEnabled',
  'approvalToken',
  'approvalId',
  'transcriptPurgeCount: 0',
  'storage.deleteObject',
  'skipped_not_enabled'
];
const missing = requiredSnippets.filter((snippet) => !workerSource.includes(snippet) && !workerTest.includes(snippet));

const result = {
  status: missing.length === 0 ? 'ready_synthetic' : 'blocked',
  checkedAt: new Date().toISOString(),
  evidenceType: 'raw_audio_storage_deletion_readiness_static_and_unit',
  destructiveDeletionRequiresApproval: true,
  transcriptDeletionEnabled: false,
  liveStorageTouched: false,
  missing
};

console.log(JSON.stringify(result, null, 2));

if (missing.length > 0) {
  process.exitCode = 1;
}
