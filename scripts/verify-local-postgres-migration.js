#!/usr/bin/env node
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const repoRoot = process.cwd();
const schemaPath = path.join(repoRoot, 'packages/contracts/prisma/schema.prisma');
const databaseUrl = 'postgresql://aura_note:aura_note@localhost:5432/aura_note_dev';
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-note-local-migration-'));
const forwardSqlPath = path.join(tempDir, 'forward.sql');
const rollbackSqlPath = path.join(tempDir, 'rollback.sql');

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: repoRoot,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl
    },
    encoding: 'utf8',
    stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'pipe'
  });
}

function dockerCompose(args) {
  return run('docker', ['compose', ...args], { capture: true });
}

function prisma(args) {
  return run('pnpm', ['exec', 'prisma', ...args], { capture: true });
}

function waitForPostgres() {
  const deadline = Date.now() + 60_000;
  let lastError = '';

  while (Date.now() < deadline) {
    try {
      const status = dockerCompose(['ps', '--format', 'json', 'postgres']);
      if (status.includes('"Health":"healthy"') || status.includes('"State":"running"')) {
        return;
      }
      lastError = status;
    } catch (error) {
      lastError = error.stderr?.toString() || error.message;
    }
    execFileSync('node', ['-e', 'setTimeout(() => process.exit(0), 1000)']);
  }

  throw new Error(`local PostgreSQL did not become healthy within 60s: ${lastError}`);
}

function assertSyntheticOnly() {
  if (databaseUrl !== 'postgresql://aura_note:aura_note@localhost:5432/aura_note_dev') {
    throw new Error('local migration evidence refused a non-synthetic DATABASE_URL');
  }

  const compose = fs.readFileSync(path.join(repoRoot, 'docker-compose.yml'), 'utf8');
  if (!compose.includes('POSTGRES_DB: aura_note_dev') || !compose.includes('POSTGRES_USER: aura_note')) {
    throw new Error('local migration evidence requires the synthetic compose database contract');
  }
}

function generateSql() {
  fs.writeFileSync(
    forwardSqlPath,
    prisma(['migrate', 'diff', '--from-empty', '--to-schema-datamodel', schemaPath, '--script'])
  );
  fs.writeFileSync(
    rollbackSqlPath,
    prisma(['migrate', 'diff', '--from-schema-datamodel', schemaPath, '--to-empty', '--script'])
  );
}

function assertNoDrift(fromArgs, toArgs, label) {
  const output = prisma(['migrate', 'diff', ...fromArgs, ...toArgs, '--script', '--exit-code']);
  const normalizedOutput = output.trim();
  if (normalizedOutput.length > 0 && normalizedOutput !== '-- This is an empty migration.') {
    throw new Error(`${label} drift check returned unexpected SQL:\n${output}`);
  }
}

let cleanedUp = false;

function cleanup() {
  if (cleanedUp) {
    return;
  }
  cleanedUp = true;
  try {
    dockerCompose(['down', '--volumes', '--remove-orphans']);
  } catch {
    // Cleanup is best effort; the failure is not hidden if the main evidence failed.
  }
}

try {
  assertSyntheticOnly();
  generateSql();
  cleanup();
  dockerCompose(['up', '--detach', 'postgres']);
  waitForPostgres();

  prisma(['db', 'execute', '--url', databaseUrl, '--file', forwardSqlPath]);
  assertNoDrift(['--from-url', databaseUrl], ['--to-schema-datamodel', schemaPath], 'forward migration');

  prisma(['db', 'execute', '--url', databaseUrl, '--file', rollbackSqlPath]);
  assertNoDrift(['--from-url', databaseUrl], ['--to-empty'], 'rollback migration');

  const result = {
    status: 'ready_synthetic',
    checkedAt: new Date().toISOString(),
    evidenceType: 'live_local_postgres_apply_rollback',
    databaseUrl,
    dockerComposeService: 'postgres',
    forwardSqlBytes: fs.statSync(forwardSqlPath).size,
    rollbackSqlBytes: fs.statSync(rollbackSqlPath).size,
    productionPhi: false,
    productionCredentials: false,
    runtimeAdapterChanged: false
  };
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(
    JSON.stringify(
      {
        status: 'blocked',
        checkedAt: new Date().toISOString(),
        evidenceType: 'live_local_postgres_apply_rollback',
        databaseUrl,
        error: error.message,
        productionPhi: false,
        productionCredentials: false,
        runtimeAdapterChanged: false
      },
      null,
      2
    )
  );
  process.exitCode = 1;
} finally {
  cleanup();
  fs.rmSync(tempDir, { recursive: true, force: true });
}
