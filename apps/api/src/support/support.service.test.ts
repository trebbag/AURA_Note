import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { SupportService } from './support.service';

const supportHeaders = {
  'x-aura-role': 'support',
  'x-aura-user-id': 'user-support-synthetic-001',
  'x-request-id': 'req-support-001',
  'x-trace-id': 'trace-support-001'
};

const complianceHeaders = {
  'x-aura-role': 'compliance_privacy_lead',
  'x-aura-user-id': 'user-compliance-synthetic-001',
  'x-request-id': 'req-audit-001',
  'x-trace-id': 'trace-audit-001',
  'idempotency-key': 'idem-audit-export-001'
};

describe('SupportService', () => {
  it('returns support status with disabled external integration feature flags', () => {
    const service = new SupportService();
    const response = service.getStatus(supportHeaders);

    assert.equal(response.data.status.checkpoint, 'CP-4');
    assert.equal(response.data.status.logging.sample.phiSafe, true);
    assert.equal(response.data.status.retention.some((policy) => policy.recordClass === 'audio_ephemeral'), true);
    assert.equal(response.data.status.retention.some((policy) => policy.retentionRule === 'indefinite'), true);
    assert.equal(response.data.status.featureFlags.every((flag) => flag.defaultValue === false), true);
    assert.equal(response.data.status.featureFlags.every((flag) => flag.enabled === false), true);
    assert.equal(response.data.status.observability.sinks.some((sink) => sink.kind === 'trace'), true);
    assert.equal(response.data.status.observability.sinks.some((sink) => sink.status === 'disabled_until_configured'), true);
    assert.equal(response.data.status.observability.metricProbes.every((probe) => probe.phiSafe), true);
    assert.equal(response.data.status.deployment.some((environment) => environment.environment === 'production'), true);
    assert.equal(
      response.data.status.deployment.find((environment) => environment.environment === 'production')?.readiness,
      'blocked_until_security_review'
    );
    assert.equal(response.data.status.runbooks.some((runbook) => runbook.runbookId === 'WO-018'), true);
    assert.equal(response.data.status.auditExport.downloadEnabled, false);
  });

  it('denies support status to ordinary clinicians', () => {
    const service = new SupportService();

    assert.throws(
      () => service.getStatus({ 'x-aura-role': 'clinician' }),
      (error) => error instanceof ForbiddenException
    );
  });

  it('denies cross-tenant support status access', () => {
    const service = new SupportService();

    assert.throws(
      () =>
        service.getStatus({
          ...supportHeaders,
          'x-aura-tenant-id': 'tenant-other'
        }),
      (error) => error instanceof ForbiddenException
    );
  });

  it('creates a redacted metadata-only audit export for compliance users', () => {
    const service = new SupportService();
    const response = service.requestAuditExport(complianceHeaders, {
      startAt: '2026-05-26T00:00:00.000Z',
      endAt: '2026-05-26T23:59:59.000Z',
      format: 'jsonl',
      includePhi: false
    });

    assert.equal(response.data.auditExport.status, 'ready_synthetic');
    assert.equal(response.data.auditExport.includePhi, false);
    assert.equal(response.data.auditExport.redacted, true);
    assert.equal(response.data.auditExport.downloadEnabled, false);
    assert.equal(response.data.auditExport.records[0]?.domainEventType, 'export.generated.v1');
    assert.equal(response.data.domainEvents[0]?.eventType, 'audit.export_requested.v1');
    assert.equal(response.data.domainEvents[0]?.idempotencyKey, 'idem-audit-export-001');
  });

  it('writes redacted audit export delivery metadata through storage when enabled', () => {
    const previous = process.env.AURA_ENABLE_AUDIT_EXPORT_DOWNLOAD;
    process.env.AURA_ENABLE_AUDIT_EXPORT_DOWNLOAD = 'true';
    try {
      const service = new SupportService();
      const response = service.requestAuditExport(complianceHeaders, {
        startAt: '2026-05-26T00:00:00.000Z',
        endAt: '2026-05-26T23:59:59.000Z',
        format: 'jsonl',
        includePhi: false
      });

      assert.equal(response.data.auditExport.includePhi, false);
      assert.equal(response.data.auditExport.downloadEnabled, true);
      assert.equal(response.data.auditExport.deliveryMode, 'storage_backed');
      assert.equal(response.data.auditExport.storageProvider, 'azure_blob');
      assert.equal(response.data.auditExport.storageKey?.includes('/audit-exports/'), true);
      assert.equal(response.data.auditExport.signedDownloadAvailable, true);
      assert.equal(response.data.auditExport.signedDownloadToken?.startsWith('dl-'), true);
      assert.equal(response.data.domainEvents[0]?.payload.deliveryMode, 'storage_backed');

      const delivered = service.deliverAuditExportDownload(
        response.data.auditExport.auditExportId,
        response.data.auditExport.signedDownloadToken ?? 'missing-token',
        complianceHeaders
      );
      assert.equal(delivered.data.download.status, 'delivered_synthetic');
      assert.equal(delivered.data.download.serverMediated, true);
      assert.equal(delivered.data.download.publicUrl, null);
      assert.equal(delivered.data.domainEvents[0]?.eventType, 'storage.object_delivered.v1');

      assert.throws(
        () =>
          service.deliverAuditExportDownload(
            response.data.auditExport.auditExportId,
            response.data.auditExport.signedDownloadToken ?? 'missing-token',
            supportHeaders
          ),
        ForbiddenException
      );
    } finally {
      if (previous === undefined) {
        delete process.env.AURA_ENABLE_AUDIT_EXPORT_DOWNLOAD;
      } else {
        process.env.AURA_ENABLE_AUDIT_EXPORT_DOWNLOAD = previous;
      }
    }
  });

  it('reports synthetic backup and restore readiness without enabling production restore execution', () => {
    const previous = {
      softDelete: process.env.AURA_AZURE_BLOB_SOFT_DELETE_ENABLED,
      versioning: process.env.AURA_AZURE_BLOB_VERSIONING_ENABLED,
      dbBackup: process.env.AURA_DATABASE_BACKUP_CONFIGURED,
      restoreDrill: process.env.AURA_RESTORE_DRILL_EVIDENCE_RECORDED,
      retentionDays: process.env.AURA_EVIDENCE_RETENTION_DAYS
    };
    process.env.AURA_AZURE_BLOB_SOFT_DELETE_ENABLED = 'true';
    process.env.AURA_AZURE_BLOB_VERSIONING_ENABLED = 'true';
    process.env.AURA_DATABASE_BACKUP_CONFIGURED = 'true';
    process.env.AURA_RESTORE_DRILL_EVIDENCE_RECORDED = 'true';
    process.env.AURA_EVIDENCE_RETENTION_DAYS = '365';
    try {
      const service = new SupportService();
      const response = service.getBackupRestoreReadiness(complianceHeaders);

      assert.equal(response.data.readiness.status, 'ready_synthetic');
      assert.equal(response.data.readiness.restoreExecutionEnabled, false);
      assert.equal(response.data.domainEvents[0]?.eventType, 'restore.readiness_checked.v1');
    } finally {
      for (const [key, value] of Object.entries({
        AURA_AZURE_BLOB_SOFT_DELETE_ENABLED: previous.softDelete,
        AURA_AZURE_BLOB_VERSIONING_ENABLED: previous.versioning,
        AURA_DATABASE_BACKUP_CONFIGURED: previous.dbBackup,
        AURA_RESTORE_DRILL_EVIDENCE_RECORDED: previous.restoreDrill,
        AURA_EVIDENCE_RETENTION_DAYS: previous.retentionDays
      })) {
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      }
    }
  });

  it('denies audit export to support users and rejects PHI-including requests', () => {
    const service = new SupportService();

    assert.throws(
      () =>
        service.requestAuditExport(supportHeaders, {
          startAt: '2026-05-26T00:00:00.000Z',
          endAt: '2026-05-26T23:59:59.000Z',
          format: 'jsonl',
          includePhi: false
        }),
      (error) => error instanceof ForbiddenException
    );

    assert.throws(
      () =>
        service.requestAuditExport(complianceHeaders, {
          startAt: '2026-05-26T00:00:00.000Z',
          endAt: '2026-05-26T23:59:59.000Z',
          format: 'jsonl',
          includePhi: true as false
        }),
      (error) => error instanceof BadRequestException
    );
  });
});
