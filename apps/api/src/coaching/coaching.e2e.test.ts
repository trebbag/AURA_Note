import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { configureAuraApi } from '../runtime/api-runtime';

describe('Coaching API e2e', () => {
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

  it('returns treating clinician own coaching and denies billing staff', async () => {
    const own = await request(app.getHttpServer())
      .get('/api/v1/coaching/own')
      .set('x-aura-role', 'clinician')
      .set('x-aura-linked-visit', 'true')
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/coaching/own')
      .set('x-aura-role', 'billing_staff')
      .set('x-aura-linked-visit', 'true')
      .set('x-aura-billing-review-triggered', 'true')
      .expect(403);

    assert.equal(own.body.data.privacyLabel, 'own_clinician_only');
    assert.equal(own.body.data.signals[0].patientFacingExcluded, true);
  });

  it('returns aggregate dashboard by default and full admin identifiers only when requested', async () => {
    const aggregate = await request(app.getHttpServer())
      .get('/api/v1/coaching/dashboard')
      .set('x-aura-role', 'authorized_admin')
      .expect(200);
    const fullAdmin = await request(app.getHttpServer())
      .get('/api/v1/coaching/dashboard?visibilityMode=full_admin')
      .set('x-aura-role', 'authorized_admin')
      .expect(200);

    assert.equal(aggregate.body.data.aggregateOnly, true);
    assert.equal(aggregate.body.data.clinicianSummaries[0].clinicianId, undefined);
    assert.equal(fullAdmin.body.data.aggregateOnly, false);
    assert.equal(Boolean(fullAdmin.body.data.clinicianSummaries[0].clinicianId), true);
  });
});
