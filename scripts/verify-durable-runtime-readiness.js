#!/usr/bin/env node

const { execFileSync } = require('node:child_process');

const repoRoot = process.cwd();

function run(command, args) {
  execFileSync(command, args, {
    cwd: repoRoot,
    env: { ...process.env, DATABASE_URL: 'postgresql://aura_note:aura_note@localhost:5432/aura_note_dev' },
    stdio: 'inherit'
  });
}

run('pnpm', ['db:client:generate']);
run('pnpm', ['--filter', '@aura-note/api', 'test:durable-runtime-readiness']);

console.log(
  JSON.stringify(
    {
      status: 'ready_synthetic',
      checkedAt: new Date().toISOString(),
      evidenceType: 'live_local_postgres_durable_runtime_metadata_and_broad_rls',
      liveDatabaseTouched: true,
      productionPhi: false,
      productionCredentials: false,
      liveVendorSyncTouched: false,
      liveAiTouched: false,
      claimSubmissionPerformed: false
    },
    null,
    2
  )
);
