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
  ['CREATE INDEX "Note_tenantId_siteId_state_idx"', 'tenant/site note status index'],
  ['ALTER TABLE "Site" ADD CONSTRAINT "Site_tenantId_fkey"', 'Site tenant foreign key'],
  ['ALTER TABLE "Patient" ADD CONSTRAINT "Patient_siteId_fkey"', 'Patient site foreign key'],
  ['ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey"', 'Appointment patient foreign key'],
  ['ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clinicianId_fkey"', 'Appointment clinician foreign key'],
  ['ALTER TABLE "Note" ADD CONSTRAINT "Note_appointmentId_fkey"', 'Note appointment foreign key'],
  ['ALTER TABLE "Note" ADD CONSTRAINT "Note_patientId_fkey"', 'Note patient foreign key'],
  ['ALTER TABLE "Note" ADD CONSTRAINT "Note_clinicianId_fkey"', 'Note clinician foreign key'],
  ['ALTER TABLE "VisitSession" ADD CONSTRAINT "VisitSession_tenantId_fkey"', 'VisitSession tenant foreign key'],
  ['ALTER TABLE "VisitSession" ADD CONSTRAINT "VisitSession_siteId_fkey"', 'VisitSession site foreign key'],
  ['ALTER TABLE "VisitSession" ADD CONSTRAINT "VisitSession_noteId_fkey"', 'VisitSession note foreign key'],
  ['ALTER TABLE "RecordingAsset" ADD CONSTRAINT "RecordingAsset_tenantId_fkey"', 'RecordingAsset tenant foreign key'],
  ['ALTER TABLE "RecordingAsset" ADD CONSTRAINT "RecordingAsset_siteId_fkey"', 'RecordingAsset site foreign key'],
  ['ALTER TABLE "RecordingAsset" ADD CONSTRAINT "RecordingAsset_noteId_fkey"', 'RecordingAsset note foreign key'],
  [
    'ALTER TABLE "RecordingAsset" ADD CONSTRAINT "RecordingAsset_visitSessionId_fkey"',
    'RecordingAsset visit session foreign key'
  ],
  ['ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_tenantId_fkey"', 'Transcript tenant foreign key'],
  ['ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_siteId_fkey"', 'Transcript site foreign key'],
  ['ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_noteId_fkey"', 'Transcript note foreign key'],
  [
    'ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_visitSessionId_fkey"',
    'Transcript visit session foreign key'
  ],
  ['ALTER TABLE "TranscriptSegment" ADD CONSTRAINT "TranscriptSegment_tenantId_fkey"', 'TranscriptSegment tenant foreign key'],
  ['ALTER TABLE "TranscriptSegment" ADD CONSTRAINT "TranscriptSegment_siteId_fkey"', 'TranscriptSegment site foreign key'],
  [
    'ALTER TABLE "TranscriptSegment" ADD CONSTRAINT "TranscriptSegment_transcriptId_fkey"',
    'TranscriptSegment transcript foreign key'
  ],
  ['ALTER TABLE "TranscriptSegment" ADD CONSTRAINT "TranscriptSegment_noteId_fkey"', 'TranscriptSegment note foreign key'],
  ['ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_tenantId_fkey"', 'Suggestion tenant foreign key'],
  ['ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_siteId_fkey"', 'Suggestion site foreign key'],
  ['ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_noteId_fkey"', 'Suggestion note foreign key'],
  ['ALTER TABLE "VisitSelection" ADD CONSTRAINT "VisitSelection_tenantId_fkey"', 'VisitSelection tenant foreign key'],
  ['ALTER TABLE "VisitSelection" ADD CONSTRAINT "VisitSelection_siteId_fkey"', 'VisitSelection site foreign key'],
  ['ALTER TABLE "VisitSelection" ADD CONSTRAINT "VisitSelection_noteId_fkey"', 'VisitSelection note foreign key'],
  [
    'ALTER TABLE "VisitSelection" ADD CONSTRAINT "VisitSelection_sourceSuggestionId_fkey"',
    'VisitSelection source suggestion foreign key'
  ],
  ['ALTER TABLE "ComplianceIssue" ADD CONSTRAINT "ComplianceIssue_tenantId_fkey"', 'ComplianceIssue tenant foreign key'],
  ['ALTER TABLE "ComplianceIssue" ADD CONSTRAINT "ComplianceIssue_siteId_fkey"', 'ComplianceIssue site foreign key'],
  ['ALTER TABLE "ComplianceIssue" ADD CONSTRAINT "ComplianceIssue_noteId_fkey"', 'ComplianceIssue note foreign key'],
  [
    'ALTER TABLE "HistoryGapQuestion" ADD CONSTRAINT "HistoryGapQuestion_tenantId_fkey"',
    'HistoryGapQuestion tenant foreign key'
  ],
  [
    'ALTER TABLE "HistoryGapQuestion" ADD CONSTRAINT "HistoryGapQuestion_siteId_fkey"',
    'HistoryGapQuestion site foreign key'
  ],
  [
    'ALTER TABLE "HistoryGapQuestion" ADD CONSTRAINT "HistoryGapQuestion_noteId_fkey"',
    'HistoryGapQuestion note foreign key'
  ],
  [
    'ALTER TABLE "HistoryGapQuestion" ADD CONSTRAINT "HistoryGapQuestion_linkedTaskId_fkey"',
    'HistoryGapQuestion linked task foreign key'
  ],
  ['ALTER TABLE "Task" ADD CONSTRAINT "Task_tenantId_fkey"', 'Task tenant foreign key'],
  ['ALTER TABLE "Task" ADD CONSTRAINT "Task_siteId_fkey"', 'Task site foreign key'],
  ['ALTER TABLE "Task" ADD CONSTRAINT "Task_noteId_fkey"', 'Task note foreign key'],
  ['ALTER TABLE "Task" ADD CONSTRAINT "Task_patientId_fkey"', 'Task patient foreign key'],
  ['ALTER TABLE "Task" ADD CONSTRAINT "Task_ownerUserId_fkey"', 'Task owner user foreign key'],
  ['ALTER TABLE "FinalizationRun" ADD CONSTRAINT "FinalizationRun_tenantId_fkey"', 'FinalizationRun tenant foreign key'],
  ['ALTER TABLE "FinalizationRun" ADD CONSTRAINT "FinalizationRun_siteId_fkey"', 'FinalizationRun site foreign key'],
  ['ALTER TABLE "FinalizationRun" ADD CONSTRAINT "FinalizationRun_noteId_fkey"', 'FinalizationRun note foreign key'],
  [
    'ALTER TABLE "WizardStepDecision" ADD CONSTRAINT "WizardStepDecision_tenantId_fkey"',
    'WizardStepDecision tenant foreign key'
  ],
  [
    'ALTER TABLE "WizardStepDecision" ADD CONSTRAINT "WizardStepDecision_siteId_fkey"',
    'WizardStepDecision site foreign key'
  ],
  [
    'ALTER TABLE "WizardStepDecision" ADD CONSTRAINT "WizardStepDecision_finalizationRunId_fkey"',
    'WizardStepDecision finalization run foreign key'
  ],
  ['ALTER TABLE "WizardStepDecision" ADD CONSTRAINT "WizardStepDecision_noteId_fkey"', 'WizardStepDecision note foreign key'],
  [
    'ALTER TABLE "WizardStepDecision" ADD CONSTRAINT "WizardStepDecision_actorUserId_fkey"',
    'WizardStepDecision actor user foreign key'
  ],
  [
    'ALTER TABLE "EnhancedNoteVersion" ADD CONSTRAINT "EnhancedNoteVersion_tenantId_fkey"',
    'EnhancedNoteVersion tenant foreign key'
  ],
  [
    'ALTER TABLE "EnhancedNoteVersion" ADD CONSTRAINT "EnhancedNoteVersion_siteId_fkey"',
    'EnhancedNoteVersion site foreign key'
  ],
  ['ALTER TABLE "EnhancedNoteVersion" ADD CONSTRAINT "EnhancedNoteVersion_noteId_fkey"', 'EnhancedNoteVersion note foreign key'],
  [
    'ALTER TABLE "EnhancedNoteVersion" ADD CONSTRAINT "EnhancedNoteVersion_finalizationRunId_fkey"',
    'EnhancedNoteVersion finalization run foreign key'
  ],
  [
    'ALTER TABLE "EnhancedNoteVersion" ADD CONSTRAINT "EnhancedNoteVersion_approvedById_fkey"',
    'EnhancedNoteVersion approved-by user foreign key'
  ],
  [
    'ALTER TABLE "PatientSummaryVersion" ADD CONSTRAINT "PatientSummaryVersion_tenantId_fkey"',
    'PatientSummaryVersion tenant foreign key'
  ],
  [
    'ALTER TABLE "PatientSummaryVersion" ADD CONSTRAINT "PatientSummaryVersion_siteId_fkey"',
    'PatientSummaryVersion site foreign key'
  ],
  [
    'ALTER TABLE "PatientSummaryVersion" ADD CONSTRAINT "PatientSummaryVersion_noteId_fkey"',
    'PatientSummaryVersion note foreign key'
  ],
  [
    'ALTER TABLE "PatientSummaryVersion" ADD CONSTRAINT "PatientSummaryVersion_finalizationRunId_fkey"',
    'PatientSummaryVersion finalization run foreign key'
  ],
  [
    'ALTER TABLE "PatientSummaryVersion" ADD CONSTRAINT "PatientSummaryVersion_approvedById_fkey"',
    'PatientSummaryVersion approved-by user foreign key'
  ],
  [
    'ALTER TABLE "BillingAttestation" ADD CONSTRAINT "BillingAttestation_tenantId_fkey"',
    'BillingAttestation tenant foreign key'
  ],
  ['ALTER TABLE "BillingAttestation" ADD CONSTRAINT "BillingAttestation_siteId_fkey"', 'BillingAttestation site foreign key'],
  ['ALTER TABLE "BillingAttestation" ADD CONSTRAINT "BillingAttestation_noteId_fkey"', 'BillingAttestation note foreign key'],
  [
    'ALTER TABLE "BillingAttestation" ADD CONSTRAINT "BillingAttestation_finalizationRunId_fkey"',
    'BillingAttestation finalization run foreign key'
  ],
  [
    'ALTER TABLE "BillingAttestation" ADD CONSTRAINT "BillingAttestation_attestedById_fkey"',
    'BillingAttestation attested-by user foreign key'
  ],
  ['ALTER TABLE "DraftClaimPreview" ADD CONSTRAINT "DraftClaimPreview_tenantId_fkey"', 'DraftClaimPreview tenant foreign key'],
  ['ALTER TABLE "DraftClaimPreview" ADD CONSTRAINT "DraftClaimPreview_siteId_fkey"', 'DraftClaimPreview site foreign key'],
  ['ALTER TABLE "DraftClaimPreview" ADD CONSTRAINT "DraftClaimPreview_noteId_fkey"', 'DraftClaimPreview note foreign key'],
  [
    'ALTER TABLE "DraftClaimPreview" ADD CONSTRAINT "DraftClaimPreview_finalizationRunId_fkey"',
    'DraftClaimPreview finalization run foreign key'
  ],
  [
    'ALTER TABLE "DraftClaimPreview" ADD CONSTRAINT "DraftClaimPreview_generatedById_fkey"',
    'DraftClaimPreview generated-by user foreign key'
  ]
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
