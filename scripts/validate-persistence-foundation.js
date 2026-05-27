#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const schemaPath = path.join(root, 'packages/contracts/prisma/schema.prisma');
const envExamplePath = path.join(root, '.env.example');
const schema = fs.readFileSync(schemaPath, 'utf8');
const envExample = fs.readFileSync(envExamplePath, 'utf8');

const requiredModels = [
  'Tenant',
  'Site',
  'User',
  'RoleAssignment',
  'Patient',
  'PatientLinkage',
  'Appointment',
  'Note',
  'VisitSession',
  'RecordingAsset',
  'Transcript',
  'TranscriptSegment',
  'ChartContextSnapshot',
  'Suggestion',
  'VisitSelection',
  'ComplianceIssue',
  'HistoryGapQuestion',
  'Task',
  'FinalizationRun',
  'WizardStepDecision',
  'EnhancedNoteVersion',
  'PatientSummaryVersion',
  'BillingAttestation',
  'DraftClaimPreview',
  'ExportArtifact',
  'EhrWritebackJob',
  'Template',
  'DotPhrase',
  'CoachingReport',
  'AuditEvent',
  'DomainEvent',
  'IntegrationConnection',
  'ModeMapping',
  'FeatureFlag',
  'SupportStatusSnapshot'
];

const requiredSchemaSnippets = [
  'provider = "postgresql"',
  'url      = env("DATABASE_URL")',
  'appointmentId      String    @unique @db.Uuid',
  'retentionClass RetentionClass @default(audio_ephemeral)',
  'retentionPolicy String         @default("indefinite")',
  'submittedClaim     Boolean  @default(false)',
  'patientFacingExcluded Boolean @default(true)',
  'enabled        Boolean         @default(false)'
];

const requiredEnvSnippets = [
  'DATABASE_URL=postgresql://aura_note:aura_note@localhost:5432/aura_note_dev',
  'AI_EXTERNAL_ENABLED=false',
  'CLINICOS_INTEGRATION_ENABLED=false',
  'RAW_AUDIO_RETENTION_DAYS=7',
  'TRANSCRIPT_RETENTION_POLICY=indefinite'
];

const missingModels = requiredModels.filter((model) => !schema.includes(`model ${model} `));
const missingSchemaSnippets = requiredSchemaSnippets.filter((snippet) => !schema.includes(snippet));
const missingEnvSnippets = requiredEnvSnippets.filter((snippet) => !envExample.includes(snippet));

const result = {
  status: missingModels.length === 0 && missingSchemaSnippets.length === 0 && missingEnvSnippets.length === 0 ? 'ready_foundation' : 'blocked',
  checkedAt: new Date().toISOString(),
  modelCount: requiredModels.length,
  missingModels,
  missingSchemaSnippets,
  missingEnvSnippets
};

console.log(JSON.stringify(result, null, 2));

if (result.status !== 'ready_foundation') {
  process.exitCode = 1;
}
