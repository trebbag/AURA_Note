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
    const chart = await service.getChartContext(
      'safe-patient-synthetic-001',
      'athena-encounter-synthetic-001',
      'problems,medications,allergies,labs,documents',
      {
        'x-aura-role': 'clinician',
        'x-aura-linked-patient': 'true',
        'x-aura-linked-visit': 'true',
        'x-aura-ehr-mode': 'sandbox',
        'x-trace-id': 'trace-ehr-chart-001'
      }
    );

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
});
