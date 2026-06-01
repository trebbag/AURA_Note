import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ForbiddenException } from '@nestjs/common';
import { EhrService } from './ehr.service';

describe('EHR integration service', () => {
  it('returns disabled-safe athenahealth status by default', async () => {
    const service = new EhrService();
    const status = await service.getStatus({
      'x-aura-role': 'clinician',
      'x-aura-linked-patient': 'true',
      'x-aura-linked-visit': 'true',
      'x-trace-id': 'trace-ehr-status-001'
    });

    assert.equal(status.data.status.vendor, 'athenahealth');
    assert.equal(status.data.status.mode, 'disabled');
    assert.equal(status.data.standaloneSafe, true);
    assert.equal(status.data.domainEvents[0]?.eventType, 'ehr.adapter_status_checked.v1');
  });

  it('loads sandbox chart context with source-linked slices for linked clinicians', async () => {
    const service = new EhrService();
    const headers = {
      'x-aura-role': 'clinician',
      'x-aura-linked-patient': 'true',
      'x-aura-linked-visit': 'true',
      'x-aura-ehr-mode': 'sandbox',
      'x-trace-id': 'trace-ehr-chart-001'
    };
    const boundary = await service.getRuntimeBoundary(headers);
    const patients = await service.searchPatients({ safePatientId: 'safe-patient-synthetic-001' }, headers);
    const appointments = await service.importAppointments('2026-05-26T14:00:00.000Z', '2026-05-26T22:00:00.000Z', headers);
    const encounter = await service.getEncounterContext('athena-encounter-synthetic-001', headers);
    const chart = await service.getChartContext(
      'safe-patient-synthetic-001',
      'athena-encounter-synthetic-001',
      'problems,medications,allergies,labs,documents',
      headers
    );

    assert.equal(boundary.data.boundary.adapterBoundary, 'vendor_neutral_ehr_adapter');
    assert.equal(boundary.data.boundary.liveApiCallsEnabled, false);
    assert.equal(boundary.data.domainEvents[0]?.eventType, 'ehr.config_reviewed.v1');
    assert.equal(patients.data.results[0]?.source, 'athenahealth_sandbox');
    assert.equal(appointments.data.appointments[0]?.localAppointmentCreated, false);
    assert.equal(encounter.data.encounter.rawPayloadStored, false);
    assert.equal(chart.data.chartContext.sourceSystem, 'athenahealth');
    assert.equal(chart.data.chartContext.slices.length, 5);
    assert.equal(chart.data.chartContext.slices.every((slice) => slice.evidenceIds.length > 0), true);
    assert.equal(chart.data.domainEvents[0]?.eventType, 'ehr.chart_context_loaded.v1');
  });

  it('denies chart context to roles without patient-linked clinician access', async () => {
    const service = new EhrService();

    await assert.rejects(
      () =>
        service.getChartContext('safe-patient-synthetic-001', 'athena-encounter-synthetic-001', undefined, {
          'x-aura-role': 'billing_staff',
          'x-aura-linked-patient': 'true',
          'x-aura-linked-visit': 'true',
          'x-aura-ehr-mode': 'sandbox'
        }),
      ForbiddenException
    );
  });

  it('denies cross-tenant EHR adapter access before adapter calls', async () => {
    const service = new EhrService();

    await assert.rejects(
      () =>
        service.getStatus({
          'x-aura-role': 'clinician',
          'x-aura-linked-patient': 'true',
          'x-aura-linked-visit': 'true',
          'x-aura-tenant-id': 'tenant-other'
        }),
      ForbiddenException
    );
  });

  it('manages EHR writeback queue approval retry dead-letter and reconciliation as metadata only', async () => {
    const service = new EhrService();
    const clinicianHeaders = {
      'x-aura-role': 'clinician',
      'x-aura-linked-patient': 'true',
      'x-aura-linked-visit': 'true',
      'x-trace-id': 'trace-ehr-writeback-001'
    };
    const adminHeaders = {
      'x-aura-role': 'compliance_privacy_lead',
      'x-trace-id': 'trace-ehr-writeback-admin-001'
    };

    const queue = await service.listWritebackQueue(clinicianHeaders);
    assert.equal(queue.data.queue.liveProductionWritebackEnabled, false);
    assert.equal(queue.data.queue.payloadsExcluded, true);
    assert.equal(queue.data.queue.items.some((item) => item.status === 'pending_approval'), true);

    const approved = await service.actOnWritebackJob(
      'ehr-wb-pending-001',
      { action: 'approve', approvalId: 'approval-synthetic-001', reason: 'synthetic approval metadata' },
      { ...clinicianHeaders, 'idempotency-key': 'idem-approve-ehr-wb' }
    );
    const replayed = await service.actOnWritebackJob(
      'ehr-wb-pending-001',
      { action: 'approve', approvalId: 'approval-synthetic-001', reason: 'synthetic approval metadata' },
      { ...clinicianHeaders, 'idempotency-key': 'idem-approve-ehr-wb' }
    );
    const retry = await service.actOnWritebackJob('ehr-wb-failed-001', { action: 'retry' }, adminHeaders);
    const prepared = await service.actOnWritebackJob('ehr-wb-pending-001', { action: 'prepare_payload' }, clinicianHeaders);
    const attempted = await service.actOnWritebackJob('ehr-wb-pending-001', { action: 'record_attempt' }, adminHeaders);
    const acknowledged = await service.actOnWritebackJob(
      'ehr-wb-pending-001',
      { action: 'acknowledge', acknowledgementId: 'ack-synthetic-001' },
      adminHeaders
    );
    const deadLetter = await service.actOnWritebackJob(
      'ehr-wb-failed-001',
      { action: 'dead_letter', reason: 'synthetic vendor error exhausted' },
      adminHeaders
    );
    const reconciled = await service.actOnWritebackJob(
      'ehr-wb-pending-001',
      { action: 'reconcile', reconciliationId: 'reconcile-synthetic-001' },
      adminHeaders
    );

    assert.equal(approved.data.writeback.humanApproved, true);
    assert.equal(approved.data.domainEvents[0]?.eventType, 'ehr.writeback_approval_recorded.v1');
    assert.equal(replayed.data.domainEvents[0]?.payload.replayed, true);
    assert.equal(retry.data.writeback.status, 'retrying');
    assert.equal(prepared.data.writeback.status, 'prepared');
    assert.equal(prepared.data.domainEvents[0]?.eventType, 'ehr.writeback_payload_prepared.v1');
    assert.equal(attempted.data.writeback.status, 'attempted');
    assert.equal(attempted.data.domainEvents[0]?.eventType, 'ehr.writeback_attempt_recorded.v1');
    assert.equal(acknowledged.data.writeback.status, 'acknowledged');
    assert.equal(acknowledged.data.domainEvents[0]?.eventType, 'ehr.writeback_acknowledged.v1');
    assert.equal(deadLetter.data.writeback.status, 'dead_lettered');
    assert.equal(reconciled.data.writeback.status, 'reconciled');
    assert.equal(reconciled.data.writeback.liveDeliveryEnabled, false);
    assert.equal(reconciled.data.writeback.payloadStored, false);
  });

  it('limits writeback lifecycle actions and rejects PHI-bearing evidence', async () => {
    const service = new EhrService();

    await assert.rejects(
      () =>
        service.actOnWritebackJob(
          'ehr-wb-pending-001',
          { action: 'approve', approvalId: 'approval-synthetic-001' },
          {
            'x-aura-role': 'support',
            'x-trace-id': 'trace-support-denied'
          }
        ),
      ForbiddenException
    );

    await assert.rejects(
      () =>
        service.actOnWritebackJob(
          'ehr-wb-pending-001',
          { action: 'approve', approvalId: 'approval-synthetic-001', reason: 'call 555-121-1212' },
          {
            'x-aura-role': 'clinician',
            'x-aura-linked-patient': 'true',
            'x-aura-linked-visit': 'true'
          }
        ),
      /PHI/
    );
  });
});
