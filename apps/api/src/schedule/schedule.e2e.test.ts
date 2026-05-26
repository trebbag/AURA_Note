import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';

describe('schedule appointment lifecycle API', () => {
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

  it('creates a standalone appointment, creates its note shell, and starts the visit', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/schedule/appointments')
      .set('x-aura-role', 'ma')
      .set('idempotency-key', 'idem-e2e-wo002')
      .send({
        safePatientId: 'safe-patient-e2e-001',
        clinicianId: 'clinician-e2e-001',
        visitType: 'Chronic follow-up',
        startsAt: '2026-05-26T16:00:00.000Z',
        durationMinutes: 30,
        modality: 'in_person',
        reasonForVisit: 'Synthetic e2e visit'
      })
      .expect(201);

    assert.equal(created.body.data.appointment.noteId, created.body.data.note.noteId);
    assert.equal(created.body.data.note.state, 'shell_created');

    const listed = await request(app.getHttpServer())
      .get('/api/v1/schedule/appointments')
      .set('x-aura-role', 'clinician')
      .expect(200);

    assert.equal(listed.body.data.appointments.length, 1);
    assert.equal(listed.body.data.appointments[0].noteStatus, 'shell_created');

    const started = await request(app.getHttpServer())
      .post(`/api/v1/schedule/appointments/${created.body.data.appointment.appointmentId}/start-visit`)
      .set('x-aura-role', 'clinician')
      .expect(201);

    assert.equal(started.body.data.appointment.state, 'visit_started');
    assert.equal(started.body.data.note.state, 'visit_active');
    assert.equal(started.body.data.visitSession.editorUnlocked, true);
  });
});
