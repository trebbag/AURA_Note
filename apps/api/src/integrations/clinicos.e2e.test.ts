import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';

describe('ClinicOS integration API e2e', () => {
  let app: INestApplication;

  before(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  after(async () => {
    await app.close();
  });

  it('reports standalone default mode and ClinicOS mock mode', async () => {
    const standalone = await request(app.getHttpServer())
      .get('/api/v1/integrations/clinicos/status')
      .set('x-aura-role', 'clinician')
      .set('x-aura-linked-visit', 'true')
      .expect(200);

    const mock = await request(app.getHttpServer())
      .get('/api/v1/integrations/clinicos/status')
      .set('x-aura-role', 'clinician')
      .set('x-aura-linked-visit', 'true')
      .set('x-aura-clinicos-mode', 'clinicos_integrated')
      .expect(200);

    assert.equal(standalone.body.data.modeContext.hostMode, 'standalone');
    assert.equal(mock.body.data.modeContext.hostMode, 'clinicos_integrated');
    assert.equal(mock.body.data.permissionsStillEnforcedByAuraNote, true);
    assert.equal(mock.body.data.rawPayloadsStored, false);
    assert.equal(mock.body.data.liveClinicOsSyncEnabled, false);
    assert.equal(mock.body.data.moduleBoundaries.length, 8);
  });

  it('records VisitGraph and M17 mappings in ClinicOS mock mode', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/integrations/clinicos/map-visit')
      .set('x-aura-role', 'authorized_admin')
      .set('x-aura-clinicos-mode', 'clinicos_integrated')
      .send({
        localAppointmentId: 'appt-synthetic-001',
        localNoteId: 'note-synthetic-001'
      })
      .expect(201);

    assert.equal(response.body.data.mappings.length, 2);
    assert.equal(response.body.data.mappings[0].clinicosModuleId, 'M03');
    assert.equal(response.body.data.mappings[1].clinicosModuleId, 'M17');
    assert.equal(response.body.data.publishedEvent.status, 'queued');
  });

  it('records stale mapping review metadata and denies ordinary clinicians', async () => {
    const denied = await request(app.getHttpServer())
      .post('/api/v1/integrations/clinicos/mappings')
      .set('x-aura-role', 'clinician')
      .set('x-aura-linked-visit', 'true')
      .set('x-aura-clinicos-mode', 'clinicos_integrated')
      .send({
        localObjectType: 'task',
        localObjectId: 'task-ma-follow-up-001',
        clinicosModuleId: 'M04',
        status: 'stale'
      })
      .expect(403);

    assert.match(denied.body.message, /role cannot record ClinicOS mappings/);

    const response = await request(app.getHttpServer())
      .post('/api/v1/integrations/clinicos/mappings')
      .set('x-aura-role', 'service_account')
      .set('x-aura-clinicos-mode', 'clinicos_integrated')
      .set('idempotency-key', 'idem-clinicos-e2e-stale-001')
      .send({
        localObjectType: 'task',
        localObjectId: 'task-ma-follow-up-001',
        clinicosModuleId: 'M04',
        status: 'stale',
        reason: 'ClinicOS task reference is stale against the local blocker task.'
      })
      .expect(201);

    assert.equal(response.body.data.mapping.status, 'stale');
    assert.equal(response.body.data.mapping.staleReason, 'ClinicOS task reference is stale against the local blocker task.');
    assert.equal(response.body.data.domainEvents[0].eventType, 'clinicos.mapping_stale_detected.v1');
  });

  it('records failed publication metadata without raw payload storage', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/integrations/clinicos/events/publish')
      .set('x-aura-role', 'service_account')
      .set('x-aura-clinicos-mode', 'clinicos_integrated')
      .set('x-aura-clinicos-unavailable', 'true')
      .send({
        eventType: 'ehr.writeback_approval_recorded.v1',
        targetModules: ['M25'],
        localObjectId: 'ehr-wb-pending-001'
      })
      .expect(201);

    assert.equal(response.body.data.publishedEvent.status, 'failed_unavailable');
    assert.equal(response.body.data.publishedEvent.payloadStored, false);
    assert.equal(response.body.data.publishedEvent.permissionBoundaryEnforced, true);
    assert.equal(response.body.data.domainEvents[0].eventType, 'clinicos.event_publication_failed.v1');
  });
});
