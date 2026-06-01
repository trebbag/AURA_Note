import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { configureAuraApi } from '../runtime/api-runtime';

describe('EHR integration API e2e', () => {
  let app: INestApplication;

  before(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleRef.createNestApplication();
    configureAuraApi(app);
    await app.init();
  });

  after(async () => {
    await app.close();
  });

  it('reports default disabled athenahealth status without breaking standalone mode', async () => {
    const status = await request(app.getHttpServer())
      .get('/api/v1/integrations/ehr/status')
      .set('x-aura-role', 'clinician')
      .set('x-aura-linked-patient', 'true')
      .set('x-aura-linked-visit', 'true')
      .expect(200);

    assert.equal(status.body.data.status.vendor, 'athenahealth');
    assert.equal(status.body.data.status.mode, 'disabled');
    assert.equal(status.body.data.standaloneSafe, true);
  });

  it('loads athenahealth sandbox chart context with no live credentials', async () => {
    const boundary = await request(app.getHttpServer())
      .get('/api/v1/integrations/ehr/runtime-boundary')
      .set('x-aura-role', 'clinician')
      .set('x-aura-linked-patient', 'true')
      .set('x-aura-linked-visit', 'true')
      .set('x-aura-ehr-mode', 'sandbox')
      .expect(200);

    assert.equal(boundary.body.data.boundary.adapterBoundary, 'vendor_neutral_ehr_adapter');
    assert.equal(boundary.body.data.boundary.liveApiCallsEnabled, false);
    assert.equal(boundary.body.data.domainEvents[0].eventType, 'ehr.config_reviewed.v1');

    const patients = await request(app.getHttpServer())
      .get('/api/v1/integrations/ehr/patients/search')
      .query({ safePatientId: 'safe-patient-synthetic-001' })
      .set('x-aura-role', 'clinician')
      .set('x-aura-linked-patient', 'true')
      .set('x-aura-linked-visit', 'true')
      .set('x-aura-ehr-mode', 'sandbox')
      .expect(200);

    assert.equal(patients.body.data.results[0].source, 'athenahealth_sandbox');
    assert.equal(patients.body.data.domainEvents[0].eventType, 'ehr.patient_lookup_performed.v1');

    const appointments = await request(app.getHttpServer())
      .get('/api/v1/integrations/ehr/appointments/import')
      .query({ startIso: '2026-05-26T14:00:00.000Z', endIso: '2026-05-26T22:00:00.000Z' })
      .set('x-aura-role', 'clinician')
      .set('x-aura-linked-patient', 'true')
      .set('x-aura-linked-visit', 'true')
      .set('x-aura-ehr-mode', 'sandbox')
      .expect(200);

    assert.equal(appointments.body.data.appointments[0].importMode, 'sandbox_metadata_only');
    assert.equal(appointments.body.data.appointments[0].localAppointmentCreated, false);
    assert.equal(appointments.body.data.domainEvents[0].eventType, 'ehr.appointment_imported.v1');

    const encounter = await request(app.getHttpServer())
      .get('/api/v1/integrations/ehr/encounters/athena-encounter-synthetic-001')
      .set('x-aura-role', 'clinician')
      .set('x-aura-linked-patient', 'true')
      .set('x-aura-linked-visit', 'true')
      .set('x-aura-ehr-mode', 'sandbox')
      .expect(200);

    assert.equal(encounter.body.data.encounter.rawPayloadStored, false);
    assert.equal(encounter.body.data.domainEvents[0].eventType, 'ehr.encounter_context_loaded.v1');

    const chart = await request(app.getHttpServer())
      .get('/api/v1/integrations/ehr/chart-context/safe-patient-synthetic-001/athena-encounter-synthetic-001')
      .query({ slices: 'problems,medications,allergies,labs,documents' })
      .set('x-aura-role', 'clinician')
      .set('x-aura-linked-patient', 'true')
      .set('x-aura-linked-visit', 'true')
      .set('x-aura-ehr-mode', 'sandbox')
      .expect(200);

    assert.equal(chart.body.data.chartContext.sourceSystem, 'athenahealth');
    assert.equal(chart.body.data.chartContext.slices.length, 5);
    assert.equal(chart.body.data.domainEvents[0].eventType, 'ehr.chart_context_loaded.v1');
  });

  it('exposes human-approved writeback queue lifecycle without live delivery', async () => {
    const queue = await request(app.getHttpServer())
      .get('/api/v1/integrations/ehr/writeback-queue')
      .set('x-aura-role', 'clinician')
      .set('x-aura-linked-patient', 'true')
      .set('x-aura-linked-visit', 'true')
      .expect(200);

    assert.equal(queue.body.data.queue.liveProductionWritebackEnabled, false);
    assert.equal(queue.body.data.queue.payloadsExcluded, true);
    assert.equal(queue.body.data.queue.items.some((item: { status: string }) => item.status === 'pending_approval'), true);

    const approved = await request(app.getHttpServer())
      .post('/api/v1/integrations/ehr/writeback-queue/ehr-wb-pending-001/actions')
      .set('x-aura-role', 'clinician')
      .set('x-aura-linked-patient', 'true')
      .set('x-aura-linked-visit', 'true')
      .set('idempotency-key', 'idem-e2e-approve-ehr')
      .send({ action: 'approve', approvalId: 'approval-e2e-synthetic-001', reason: 'synthetic approval metadata' })
      .expect(201);

    assert.equal(approved.body.data.writeback.humanApproved, true);
    assert.equal(approved.body.data.writeback.liveDeliveryEnabled, false);
    assert.equal(approved.body.data.writeback.payloadStored, false);
    assert.equal(approved.body.data.domainEvents[0].eventType, 'ehr.writeback_approval_recorded.v1');

    const prepared = await request(app.getHttpServer())
      .post('/api/v1/integrations/ehr/writeback-queue/ehr-wb-pending-001/actions')
      .set('x-aura-role', 'clinician')
      .set('x-aura-linked-patient', 'true')
      .set('x-aura-linked-visit', 'true')
      .send({ action: 'prepare_payload' })
      .expect(201);

    assert.equal(prepared.body.data.writeback.status, 'prepared');
    assert.equal(prepared.body.data.writeback.payloadStored, false);
    assert.equal(prepared.body.data.domainEvents[0].eventType, 'ehr.writeback_payload_prepared.v1');

    const attempt = await request(app.getHttpServer())
      .post('/api/v1/integrations/ehr/writeback-queue/ehr-wb-pending-001/actions')
      .set('x-aura-role', 'admin')
      .send({ action: 'record_attempt' })
      .expect(201);

    assert.equal(attempt.body.data.writeback.status, 'attempted');
    assert.equal(attempt.body.data.writeback.liveDeliveryEnabled, false);
    assert.equal(attempt.body.data.domainEvents[0].eventType, 'ehr.writeback_attempt_recorded.v1');

    const acknowledged = await request(app.getHttpServer())
      .post('/api/v1/integrations/ehr/writeback-queue/ehr-wb-pending-001/actions')
      .set('x-aura-role', 'admin')
      .send({ action: 'acknowledge', acknowledgementId: 'ack-e2e-synthetic-001' })
      .expect(201);

    assert.equal(acknowledged.body.data.writeback.status, 'acknowledged');
    assert.equal(acknowledged.body.data.writeback.acknowledgementId, 'ack-e2e-synthetic-001');
    assert.equal(acknowledged.body.data.domainEvents[0].eventType, 'ehr.writeback_acknowledged.v1');

    const retry = await request(app.getHttpServer())
      .post('/api/v1/integrations/ehr/writeback-queue/ehr-wb-failed-001/actions')
      .set('x-aura-role', 'compliance_privacy_lead')
      .send({ action: 'retry' })
      .expect(201);

    assert.equal(retry.body.data.writeback.status, 'retrying');
  });

  it('denies support approval and PHI-like writeback evidence', async () => {
    const denied = await request(app.getHttpServer())
      .post('/api/v1/integrations/ehr/writeback-queue/ehr-wb-pending-001/actions')
      .set('x-aura-role', 'clinician')
      .set('x-aura-linked-patient', 'true')
      .set('x-aura-linked-visit', 'true')
      .send({ action: 'deny', reason: 'Synthetic denial before EHR payload preparation' })
      .expect(201);

    assert.equal(denied.body.data.writeback.status, 'denied');
    assert.equal(denied.body.data.domainEvents[0].eventType, 'ehr.writeback_denied.v1');

    await request(app.getHttpServer())
      .post('/api/v1/integrations/ehr/writeback-queue/ehr-wb-pending-001/actions')
      .set('x-aura-role', 'support')
      .send({ action: 'approve', approvalId: 'approval-denied' })
      .expect(403);

    await request(app.getHttpServer())
      .post('/api/v1/integrations/ehr/writeback-queue/ehr-wb-pending-001/actions')
      .set('x-aura-role', 'clinician')
      .set('x-aura-linked-patient', 'true')
      .set('x-aura-linked-visit', 'true')
      .send({ action: 'approve', approvalId: 'approval-denied', reason: 'call 555-121-1212' })
      .expect(400);
  });
});
