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
});
