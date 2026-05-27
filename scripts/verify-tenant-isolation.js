#!/usr/bin/env node
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const databaseUrl = process.env.DATABASE_URL ?? 'postgresql://aura_note:aura_note@localhost:5432/aura_note_dev';

if (!databaseUrl.includes('localhost') && !databaseUrl.includes('127.0.0.1')) {
  throw new Error('persistence:tenant-isolation only runs against the local synthetic PostgreSQL target');
}

function run(args) {
  execFileSync('pnpm', args, {
    cwd: root,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit'
  });
}

run(['db:client:generate']);
run(['--filter', '@aura-note/api', 'test:tenant-isolation']);
