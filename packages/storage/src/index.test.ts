import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  AzureBlobObjectStorageAdapter,
  InMemoryObjectStorageAdapter,
  buildStorageKey,
  evaluateBackupRestoreReadiness,
  validateAzureBlobStorageConfig
} from './index';

const tenantId = 'tenant-synthetic-primary';
const siteId = 'site-synthetic-primary';

describe('Azure Blob storage adapter boundary', () => {
  it('validates Azure-oriented production config names without real credentials', () => {
    const invalid = validateAzureBlobStorageConfig({
      provider: 'azure_blob',
      containerName: 'aura-note-exports',
      productionDeliveryEnabled: true
    });

    assert.equal(invalid.ready, false);
    assert.equal(invalid.missing.includes('AZURE_STORAGE_ACCOUNT_NAME'), true);
    assert.equal(invalid.missing.includes('AZURE_STORAGE_CREDENTIAL_SOURCE'), true);

    const valid = validateAzureBlobStorageConfig({
      provider: 'azure_blob',
      accountName: 'syntheticstorageaccount',
      containerName: 'aura-note-exports',
      credentialSource: 'managed_identity',
      productionDeliveryEnabled: true
    });

    assert.equal(valid.ready, true);
    assert.equal(valid.productionDeliveryEnabled, true);
  });

  it('constructs Azure Blob requests without opening a network connection', () => {
    const adapter = new AzureBlobObjectStorageAdapter({
      provider: 'azure_blob',
      accountName: 'syntheticstorageaccount',
      containerName: 'aura-note-exports',
      credentialSource: 'workload_identity',
      productionDeliveryEnabled: true
    });
    const storageKey = buildStorageKey({
      tenantId,
      siteId,
      recordClass: 'exports',
      recordId: 'export-synthetic-001',
      fileName: 'note.pdf'
    });

    const request = adapter.buildPutRequest({
      tenantId,
      siteId,
      storageKey,
      body: '%PDF-1.4 synthetic',
      contentType: 'application/pdf',
      retentionClass: 'standard',
      traceId: 'trace-storage-test-001'
    });

    assert.equal(request.method, 'PUT');
    assert.equal(request.url, 'https://syntheticstorageaccount.blob.core.windows.net/aura-note-exports/tenants/tenant-synthetic-primary/sites/site-synthetic-primary/exports/export-synthetic-001/note.pdf');
    assert.equal(request.headers['x-ms-meta-tenant-id'], tenantId);
    assert.equal(request.headers['x-ms-meta-retention-class'], 'standard');
  });
});

describe('in-memory object storage adapter', () => {
  it('stores objects and creates permission-scoped metadata-only download tokens', () => {
    const adapter = new InMemoryObjectStorageAdapter(() => '2026-05-27T15:45:00.000Z');
    const storageKey = buildStorageKey({
      tenantId,
      siteId,
      recordClass: 'exports',
      recordId: 'export-synthetic-001',
      fileName: 'final-note.pdf'
    });

    const stored = adapter.putObject({
      tenantId,
      siteId,
      storageKey,
      body: '%PDF-1.4 synthetic final note',
      contentType: 'application/pdf',
      retentionClass: 'standard',
      traceId: 'trace-storage-test-002'
    });
    const signed = adapter.createSignedDownload({
      tenantId,
      siteId,
      storageKey,
      requestedByUserId: 'user-clinician-synthetic-001',
      permission: 'final_note:export',
      expiresAt: '2026-05-27T16:00:00.000Z',
      traceId: 'trace-storage-test-002'
    });

    assert.equal(stored.storageKey, storageKey);
    assert.equal(stored.contentLengthBytes > 0, true);
    assert.equal(signed.publicUrl, null);
    assert.equal(signed.signedDownloadToken.startsWith('dl-'), true);
    assert.equal(adapter.validateSignedDownload(signed.signedDownloadToken, tenantId, '2026-05-27T15:50:00.000Z').storageKey, storageKey);
  });

  it('denies expired or wrong-tenant download tokens', () => {
    const adapter = new InMemoryObjectStorageAdapter();
    const storageKey = buildStorageKey({
      tenantId,
      siteId,
      recordClass: 'audit-exports',
      recordId: 'audit-export-synthetic-001',
      fileName: 'audit.jsonl'
    });
    adapter.putObject({
      tenantId,
      siteId,
      storageKey,
      body: '{"redacted":true}',
      contentType: 'application/json',
      retentionClass: 'audit',
      traceId: 'trace-storage-test-003'
    });
    const signed = adapter.createSignedDownload({
      tenantId,
      siteId,
      storageKey,
      requestedByUserId: 'user-compliance-synthetic-001',
      permission: 'audit:export',
      expiresAt: '2026-05-27T16:00:00.000Z',
      traceId: 'trace-storage-test-003'
    });

    assert.throws(() => adapter.validateSignedDownload(signed.signedDownloadToken, 'tenant-other', '2026-05-27T15:50:00.000Z'), /wrong tenant/);
    assert.throws(() => adapter.validateSignedDownload(signed.signedDownloadToken, tenantId, '2026-05-27T16:01:00.000Z'), /expired/);
  });

  it('delivers signed downloads only through tenant, site, role permission, and requester scoped tokens', () => {
    const adapter = new InMemoryObjectStorageAdapter();
    const storageKey = buildStorageKey({
      tenantId,
      siteId,
      recordClass: 'exports',
      recordId: 'export-synthetic-002',
      fileName: 'patient-summary.pdf'
    });
    adapter.putObject({
      tenantId,
      siteId,
      storageKey,
      body: '%PDF-1.4 synthetic patient summary without internal details',
      contentType: 'application/pdf',
      retentionClass: 'standard',
      traceId: 'trace-storage-test-005'
    });
    const signed = adapter.createSignedDownload({
      tenantId,
      siteId,
      storageKey,
      requestedByUserId: 'user-clinician-synthetic-001',
      permission: 'patient_summary:export',
      expiresAt: '2026-05-27T16:00:00.000Z',
      traceId: 'trace-storage-test-005'
    });

    const delivered = adapter.deliverSignedDownload({
      token: signed.signedDownloadToken,
      tenantId,
      siteId,
      requestedByUserId: 'user-clinician-synthetic-001',
      permission: 'patient_summary:export',
      nowIso: '2026-05-27T15:50:00.000Z',
      traceId: 'trace-storage-test-005'
    });

    assert.equal(delivered.status, 'delivered_synthetic');
    assert.equal(delivered.serverMediated, true);
    assert.equal(delivered.publicUrl, null);
    assert.throws(
      () =>
        adapter.deliverSignedDownload({
          token: signed.signedDownloadToken,
          tenantId,
          siteId: 'site-other',
          requestedByUserId: 'user-clinician-synthetic-001',
          permission: 'patient_summary:export',
          nowIso: '2026-05-27T15:50:00.000Z',
          traceId: 'trace-storage-test-005'
        }),
      /wrong site/
    );
    assert.throws(
      () =>
        adapter.deliverSignedDownload({
          token: signed.signedDownloadToken,
          tenantId,
          siteId,
          requestedByUserId: 'user-clinician-synthetic-001',
          permission: 'audit:export',
          nowIso: '2026-05-27T15:50:00.000Z',
          traceId: 'trace-storage-test-005'
        }),
      /wrong permission/
    );
  });

  it('deletes storage objects only with tenant/site match and approval evidence', () => {
    const adapter = new InMemoryObjectStorageAdapter(() => '2026-05-27T15:55:00.000Z');
    const storageKey = buildStorageKey({
      tenantId,
      siteId,
      recordClass: 'raw-audio',
      recordId: 'recording-synthetic-001',
      fileName: 'raw-audio.bin'
    });
    adapter.putObject({
      tenantId,
      siteId,
      storageKey,
      body: 'synthetic raw audio bytes',
      contentType: 'application/octet-stream',
      retentionClass: 'audio_ephemeral',
      traceId: 'trace-storage-test-004'
    });

    const deleted = adapter.deleteObject({
      tenantId,
      siteId,
      storageKey,
      approvalId: 'approval-retention-synthetic-001',
      traceId: 'trace-storage-test-004'
    });

    assert.equal(deleted.deleted, true);
    assert.equal(deleted.deletionResult, 'deleted');
    assert.equal(deleted.approvalId, 'approval-retention-synthetic-001');
    assert.equal(adapter.headObject(storageKey), undefined);
  });
});

describe('backup and restore readiness evidence', () => {
  it('requires Azure soft-delete, versioning, database backups, restore drills, and evidence retention before production restore execution', () => {
    const blocked = evaluateBackupRestoreReadiness({
      azureSoftDeleteEnabled: false,
      azureVersioningEnabled: true,
      databaseBackupConfigured: false,
      restoreDrillEvidenceRecorded: false,
      evidenceRetentionDays: 90,
      productionRestoreExecutionApproved: false,
      traceId: 'trace-restore-test-001'
    });

    assert.equal(blocked.status, 'blocked_review');
    assert.equal(blocked.restoreExecutionEnabled, false);
    assert.equal(blocked.missing.includes('AZURE_BLOB_SOFT_DELETE_ENABLED'), true);
    assert.equal(blocked.missing.includes('DATABASE_BACKUP_CONFIGURED'), true);

    const ready = evaluateBackupRestoreReadiness({
      azureSoftDeleteEnabled: true,
      azureVersioningEnabled: true,
      databaseBackupConfigured: true,
      restoreDrillEvidenceRecorded: true,
      evidenceRetentionDays: 365,
      productionRestoreExecutionApproved: false,
      traceId: 'trace-restore-test-002'
    });

    assert.equal(ready.status, 'ready_synthetic');
    assert.equal(ready.missing.length, 0);
    assert.equal(ready.restoreExecutionEnabled, false);
  });
});
