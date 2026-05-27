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
run('pnpm', ['--filter', '@aura-note/api', 'test:review-panel-adapter']);

console.log(
  JSON.stringify(
    {
      status: 'ready_synthetic',
      checkedAt: new Date().toISOString(),
      evidenceType: 'live_local_postgres_review_panel_adapter_and_rls',
      liveDatabaseTouched: true,
      productionPhi: false,
      productionCredentials: false,
      liveAiTouched: false,
      autonomousCodingBillingClaimBehavior: false
    },
    null,
    2
  )
);
