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
