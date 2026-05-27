#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assertIncludes(checks, id, text, needle, description) {
  checks.push({
    id,
    description,
    passed: text.includes(needle),
    evidence: `${description}: ${needle}`
  });
}

const composePath = 'docker-compose.yml';
const envExamplePath = '.env.example';
const packagePath = 'package.json';
const schemaPath = 'packages/contracts/prisma/schema.prisma';

const compose = read(composePath);
const envExample = read(envExamplePath);
const packageJson = JSON.parse(read(packagePath));
const schema = read(schemaPath);

const checks = [];

assertIncludes(checks, 'compose.service.postgres', compose, 'postgres:', 'local PostgreSQL service exists');
assertIncludes(checks, 'compose.image.postgres16', compose, 'postgres:16-alpine', 'PostgreSQL 16 image is pinned');
assertIncludes(checks, 'compose.database.synthetic', compose, 'POSTGRES_DB: aura_note_dev', 'synthetic local database name is used');
assertIncludes(checks, 'compose.user.synthetic', compose, 'POSTGRES_USER: aura_note', 'synthetic local database user is used');
assertIncludes(checks, 'compose.password.synthetic', compose, 'POSTGRES_PASSWORD: aura_note', 'synthetic local database password is used');
assertIncludes(checks, 'compose.port.local', compose, '"5432:5432"', 'local PostgreSQL port is explicit');
assertIncludes(checks, 'compose.healthcheck', compose, 'pg_isready -U aura_note -d aura_note_dev', 'database healthcheck is present');
assertIncludes(checks, 'compose.volume.local', compose, 'aura_note_postgres_data', 'local named volume is used');
assertIncludes(
  checks,
  'env.database-url.synthetic',
  envExample,
  'DATABASE_URL=postgresql://aura_note:aura_note@localhost:5432/aura_note_dev',
  '.env.example uses synthetic local DATABASE_URL'
);
assertIncludes(checks, 'schema.provider.postgresql', schema, 'provider = "postgresql"', 'Prisma schema targets PostgreSQL');

checks.push({
  id: 'package.local-db-script',
  description: 'package script exposes the local database readiness verifier',
  passed: packageJson.scripts?.['persistence:local-db-readiness'] === 'node scripts/validate-local-database-readiness.js',
  evidence: packageJson.scripts?.['persistence:local-db-readiness'] ?? null
});

const forbiddenComposeNeedles = [
  'prod',
  'production',
  'amazonaws.com',
  'azure.com',
  'supabase',
  'neon.tech',
  'railway.app',
  'render.com',
  'secret:',
  'private_key'
];

const forbiddenMatches = forbiddenComposeNeedles.filter((needle) => compose.toLowerCase().includes(needle));

checks.push({
  id: 'compose.no-production-hosts-or-secret-keys',
  description: 'compose contract does not contain production hosts or secret key material',
  passed: forbiddenMatches.length === 0,
  evidence: { forbiddenMatches }
});

const failed = checks.filter((check) => !check.passed);
const result = {
  status: failed.length === 0 ? 'ready_synthetic' : 'blocked',
  checkedAt: new Date().toISOString(),
  evidenceType: 'static_local_database_orchestration_contract',
  liveDatabaseTouched: false,
  migrationApplied: false,
  runtimeAdapterChanged: false,
  failedChecks: failed.length,
  failures: failed,
  checks
};

console.log(JSON.stringify(result, null, 2));

if (failed.length > 0) {
  process.exitCode = 1;
}
