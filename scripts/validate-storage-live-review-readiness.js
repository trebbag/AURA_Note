#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

const status = JSON.parse(readText('repo_status.json'));
const packageJson = JSON.parse(readText('package.json'));
const workflow = readText('.github/workflows/ci.yml');
const plan = readText('docs/PRODUCTION_BUILD_PLAN.md');
const continuation = readText('docs/POST_P11_CONTINUATION_PLAN.md');
const storageReview = readText('docs/PRODUCTION_AZURE_STORAGE_DELETION_RESTORE_REVIEW.md');
const storageDecisionRecord = readText('docs/PRODUCTION_AZURE_STORAGE_DECISION_RECORD.md');
const storageProvisioningEvidence = readText('docs/PRODUCTION_AZURE_STORAGE_PROVISIONING_EVIDENCE.md');
const workOrderIndex = readText('work_orders/README.md');
const specGaps = readText('SPEC_GAPS.md');
const runLog = readText('RUN_LOG.md');

const checks = [];

function check(id, description, passed, evidence) {
  checks.push({ id, description, passed: Boolean(passed), evidence });
}

check('status.wo055-done', 'WO-055 is marked done', status.work_orders?.['WO-055'] === 'done', status.work_orders?.['WO-055']);
check('status.next-production-build-safe', 'Post-P11 planning/control remains valid while commercial-readiness runtime work is active', status.next_work_order === null || Number.parseInt(String(status.next_work_order || '').replace('WO-', ''), 10) >= 61, status.next_work_order);
check('status.checkpoint-production-build-safe', 'P11 or commercial-readiness checkpoint remains current', ['P11', 'CR-0', 'CR-1', 'CR-2', 'CR-3', 'CR-4'].includes(status.current_checkpoint), status.current_checkpoint);
check('work-order.file', 'WO-055 work-order file exists', exists('work_orders/WO-055_production_azure_storage_deletion_restore_review_intake.md'), 'work_orders/WO-055_production_azure_storage_deletion_restore_review_intake.md');
check('work-order.index', 'Work-order index records WO-055 completion', workOrderIndex.includes('WO-055') && workOrderIndex.includes('Azure storage'), 'work_orders/README.md');
check('plan.wo055', 'Production build plan includes WO-055', plan.includes('## WO-055 ') && plan.includes('Production Azure Storage'), 'docs/PRODUCTION_BUILD_PLAN.md');
check('continuation.promoted', 'Continuation plan records Azure storage/deletion/restore as promoted to WO-055', continuation.includes('Promoted as `WO-055`') && continuation.includes('Production Azure storage'), 'docs/POST_P11_CONTINUATION_PLAN.md');
check('storage-review.exists', 'Production Azure storage/deletion/restore review document exists', exists('docs/PRODUCTION_AZURE_STORAGE_DELETION_RESTORE_REVIEW.md'), 'docs/PRODUCTION_AZURE_STORAGE_DELETION_RESTORE_REVIEW.md');
check('storage-decision-record.exists', 'Production Azure storage decision record exists', exists('docs/PRODUCTION_AZURE_STORAGE_DECISION_RECORD.md'), 'docs/PRODUCTION_AZURE_STORAGE_DECISION_RECORD.md');
check('storage-provisioning-evidence.exists', 'No-PHI Azure storage provisioning evidence document exists', exists('docs/PRODUCTION_AZURE_STORAGE_PROVISIONING_EVIDENCE.md'), 'docs/PRODUCTION_AZURE_STORAGE_PROVISIONING_EVIDENCE.md');

[
  'Azure account and container topology',
  'Credential source and access model',
  'Encryption and key management',
  'Secure download policy',
  'Soft delete, versioning, immutability, and legal hold',
  'Raw-audio retention and deletion authority',
  'Backup and restore drills',
  'Evidence retention and audit export delivery',
  'Incident response'
].forEach((snippet) => {
  check(`storage-review.decision.${snippet.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, `Storage review includes decision: ${snippet}`, storageReview.includes(snippet), snippet);
});

[
  'storage.azure_config_reviewed.v1',
  'storage.object_upload_authorized.v1',
  'storage.object_upload_denied.v1',
  'storage.download_token_requested.v1',
  'storage.download_token_denied.v1',
  'storage.object_download_delivered.v1',
  'storage.public_url_rejected.v1',
  'storage.raw_audio_deletion_approved.v1',
  'storage.raw_audio_deletion_skipped.v1',
  'storage.raw_audio_deleted.v1',
  'storage.transcript_retention_preserved.v1',
  'storage.legal_hold_applied.v1',
  'storage.legal_hold_blocked_deletion.v1',
  'storage.restore_readiness_verified.v1',
  'storage.restore_drill_completed.v1',
  'storage.incident_recorded.v1'
].forEach((eventName) => {
  check(`storage-review.event.${eventName}`, `Storage review includes future event ${eventName}`, storageReview.includes(eventName), eventName);
});

[
  'auranoteeastus91d0',
  'AURA_resource_group',
  'eastus',
  'Standard ZRS',
  'managed_identity',
  'aura-note-storage-mi',
  'aura-note-kv-91d0',
  'aura-final-note-pdfs',
  'aura-patient-summary-pdfs',
  'aura-structured-exports',
  'aura-audit-export-bundles',
  'aura-raw-audio',
  'aura-transcripts',
  'aura-storage-evidence',
  'aura-restore-drill-evidence',
  'Public blob access disabled',
  'Shared key access disabled',
  'Private endpoint required',
  'server-mediated',
  'Final note PDF | 10 minutes',
  'Redacted audit export bundle | 15 minutes',
  'Raw audio: purge-eligible after 7 days',
  'Transcript objects: indefinite retention',
  'Blob soft delete: 14 days',
  'Container soft delete: 14 days',
  'Blob versioning: enabled',
  'Quarterly synthetic restore-readiness drill',
  'No PHI-bearing Azure storage behavior is enabled'
].forEach((snippet) => {
  check(
    `storage-decision-record.${snippet.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    `Storage decision record includes ${snippet}`,
    storageDecisionRecord.includes(snippet),
    snippet
  );
});

[
  'no-PHI Azure infrastructure',
  'auranoteeastus91d0',
  'aura-final-note-pdfs',
  'aura-patient-summary-pdfs',
  'aura-structured-exports',
  'aura-audit-export-bundles',
  'aura-raw-audio',
  'aura-transcripts',
  'aura-storage-evidence',
  'aura-restore-drill-evidence',
  'aura-note-storage-mi',
  'Storage Blob Data Contributor',
  'aura-note-kv-91d0',
  'aura-note-vnet-eastus',
  'aura-note-private-endpoints',
  'privatelink.blob.core.windows.net',
  'aura-note-storage-blob-pe',
  '10.81.1.4',
  'public network access: `Disabled`',
  'network default action: `Deny`',
  'shared key access: disabled',
  'Blob public access: disabled',
  'Blob soft delete: enabled for 14 days',
  'container soft delete: enabled for 14 days',
  'Blob versioning: enabled',
  'Not Yet Activated',
  'PHI-bearing object upload/download delivery',
  'production runtime credential delivery',
  'destructive production deletion',
  'production restore execution',
  'production launch approval'
].forEach((snippet) => {
  check(
    `storage-provisioning-evidence.${snippet.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    `Storage provisioning evidence includes ${snippet}`,
    storageProvisioningEvidence.includes(snippet),
    snippet
  );
});

check(
  'spec-gaps.current',
  'SPEC_GAPS reflects post-WO-055 or later post-P11 planning/control with no active gaps',
  specGaps.includes('No active gaps as of post-`WO-055` production Azure storage/deletion/restore review intake') ||
    specGaps.includes('No active gaps as of post-`WO-056` live transcription provider review intake') ||
    specGaps.includes('No active gaps as of post-`WO-057` external AI private/BAA pathway review intake') ||
    specGaps.includes('No active gaps as of post-`WO-058` production EHR writeback credentialing review intake') ||
    specGaps.includes('No active gaps as of post-`WO-059` ClinicOS live integration review intake') ||
    specGaps.includes('No active gaps as of post-`WO-060` commercial readiness rebaseline/runtime rails review') ||
    specGaps.includes('No active gaps as of post-`WO-061` runtime persistence switchover review') ||
    specGaps.includes('No active gaps as of post-`WO-062` API runtime hardening and request-boundary review') ||
    specGaps.includes('No active gaps as of post-`WO-063` identity runtime boundary review') ||
    specGaps.includes('No active gaps as of post-`WO-069` athenahealth sandbox and vendor-neutral EHR runtime boundary review') ||
    specGaps.includes('No active gaps as of post-`WO-070` AI governance runtime boundary review') ||
    specGaps.includes('No active gaps as of post-`WO-075` commercial readiness decision gate review') ||
    specGaps.includes('No active gaps as of post-`WO-076` post-CR4 launch governance intake review'),
  'SPEC_GAPS.md'
);
check('spec-gaps.deferred-storage', 'SPEC_GAPS preserves production Azure storage/deletion/restore as deferred before live use', specGaps.includes('Production Azure Blob storage and destructive deletion') && specGaps.includes('app runtime private-network integration'), 'SPEC_GAPS.md');
check('runlog.wo055', 'RUN_LOG records WO-055 evidence', runLog.includes('WO-055 production Azure storage, deletion, and restore review intake'), 'RUN_LOG.md');
check('package.script', 'package.json exposes storage live review readiness script', packageJson.scripts?.['storage:live-review-readiness'] === 'node scripts/validate-storage-live-review-readiness.js', packageJson.scripts?.['storage:live-review-readiness']);
check('ci.script', 'CI runs storage live review readiness before post-P11 readiness', workflow.includes('pnpm storage:live-review-readiness') && workflow.indexOf('pnpm storage:live-review-readiness') < workflow.indexOf('pnpm post-p11:readiness'), '.github/workflows/ci.yml');

[
  'liveAzureCredentials=true',
  'productionAzureCredential=true',
  'phiObjectDeliveryEnabled=true',
  'publicObjectUrlEnabled=true',
  'destructiveProductionDeletionEnabled=true',
  'productionRestoreExecutionEnabled=true',
  'phiAuditExportEnabled=true',
  'azureProductionLaunchApproved=true',
  'productionStorageLaunchApproved=true'
].forEach((needle) => {
  check(`prohibited.${needle}`, `WO-055 files do not enable ${needle}`, ![plan, continuation, storageReview, storageDecisionRecord, storageProvisioningEvidence, runLog].some((contents) => contents.includes(needle)), needle);
});

const failed = checks.filter((item) => !item.passed);
const result = {
  status: failed.length === 0 ? 'ready_storage_live_review_no_phi_infrastructure_provisioned' : 'blocked',
  checkedAt: new Date().toISOString(),
  workOrder: 'WO-055',
  nextWorkOrder: status.next_work_order,
  liveAzureCredentials: false,
  noPhiAzureInfrastructureProvisioned: true,
  phiObjectDeliveryEnabled: false,
  publicObjectUrlEnabled: false,
  destructiveProductionDeletionEnabled: false,
  productionRestoreExecutionEnabled: false,
  productionLaunchApproved: false,
  totalChecks: checks.length,
  passedChecks: checks.length - failed.length,
  failedChecks: failed.length,
  failures: failed
};

console.log(JSON.stringify(result, null, 2));

if (failed.length > 0) {
  process.exitCode = 1;
}
