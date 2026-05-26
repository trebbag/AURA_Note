import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';

describe('EHR integration API e2e', () => {
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
});
