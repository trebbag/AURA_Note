#!/usr/bin/env node
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const schemaPath = path.join(repoRoot, 'packages/contracts/prisma/schema.prisma');
const env = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://aura_note:aura_note@localhost:5432/aura_note_dev'
};

function runPrisma(args) {
  return execFileSync('pnpm', ['exec', 'prisma', ...args], {
    cwd: repoRoot,
    env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

function assertContains(haystack, needle, label) {
  if (!haystack.includes(needle)) {
    throw new Error(`Persistence runtime readiness failed: missing ${label}`);
  }
}

runPrisma(['validate', '--schema', schemaPath]);

const forwardSql = runPrisma([
  'migrate',
  'diff',
  '--from-empty',
  '--to-schema-datamodel',
  schemaPath,
  '--script'
]);

const rollbackSql = runPrisma([
  'migrate',
  'diff',
  '--from-schema-datamodel',
  schemaPath,
  '--to-empty',
  '--script'
]);

const requiredForwardFragments = [
  ['CREATE TABLE "Tenant"', 'Tenant table creation'],
  ['CREATE TABLE "Appointment"', 'Appointment table creation'],
  ['CREATE TABLE "Note"', 'Note table creation'],
  ['CREATE TABLE "VisitSession"', 'VisitSession table creation'],
  ['CREATE TABLE "Transcript"', 'Transcript table creation'],
  ['CREATE TABLE "AuditEvent"', 'AuditEvent table creation'],
  ['CREATE TABLE "DomainEvent"', 'DomainEvent table creation'],
  ['CREATE UNIQUE INDEX "Note_appointmentId_key" ON "Note"("appointmentId")', 'one appointment to one note unique index'],
  ['CREATE INDEX "Appointment_tenantId_siteId_startsAt_idx"', 'tenant/site schedule index'],
  ['CREATE INDEX "Note_tenantId_siteId_state_idx"', 'tenant/site note status index']
];

for (const [fragment, label] of requiredForwardFragments) {
  assertContains(forwardSql, fragment, label);
}

for (const tableName of ['Tenant', 'Appointment', 'Note', 'VisitSession', 'Transcript', 'AuditEvent', 'DomainEvent']) {
  assertContains(rollbackSql, `DROP TABLE "public"."${tableName}"`, `${tableName} rollback drop`);
}

const summary = {
  status: 'ready_synthetic',
  evidenceType: 'prisma_sql_generation_only',
  liveDatabaseTouched: false,
  forwardSqlLines: forwardSql.trim().split('\n').length,
  rollbackSqlLines: rollbackSql.trim().split('\n').length,
  checkedFragments: requiredForwardFragments.length,
  safety: {
    productionPhi: false,
    productionCredentials: false,
    migrationAppliedToLiveDatabase: false
  }
};

console.log(JSON.stringify(summary, null, 2));
