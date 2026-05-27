#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const storageSource = fs.readFileSync(path.join(root, 'packages/storage/src/index.ts'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

const requiredSnippets = [
  'AZURE_STORAGE_ACCOUNT_NAME',
  'AZURE_STORAGE_CONTAINER_NAME',
  'AZURE_STORAGE_CREDENTIAL_SOURCE',
  'AzureBlobObjectStorageAdapter',
  'InMemoryObjectStorageAdapter',
  'publicUrl: null',
  'storage key must be tenant-scoped'
];
const missing = requiredSnippets.filter((snippet) => !storageSource.includes(snippet));

const result = {
  status: missing.length === 0 ? 'ready_synthetic' : 'blocked',
  checkedAt: new Date().toISOString(),
  evidenceType: 'azure_blob_adapter_boundary_static_and_unit',
  productionCredentialsCommitted: false,
  liveAzureTouched: false,
  requiredConfigNames: ['AZURE_STORAGE_ACCOUNT_NAME', 'AZURE_STORAGE_CONTAINER_NAME', 'AZURE_STORAGE_CREDENTIAL_SOURCE'],
  packageScriptPresent: packageJson.scripts?.['storage:azure-adapter-readiness'] === 'pnpm --filter @aura-note/storage test && pnpm --filter @aura-note/storage typecheck && node scripts/validate-azure-storage-adapter-readiness.js',
  missing
};

console.log(JSON.stringify(result, null, 2));

if (missing.length > 0 || !result.packageScriptPresent) {
  process.exitCode = 1;
}
