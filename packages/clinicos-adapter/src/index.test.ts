import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CLINICOS_MOCK_MODE_SETTINGS,
  ClinicOsModeResolver,
  MockClinicOsAdapter,
  STANDALONE_MODE_SETTINGS,
  resolveTargetModules
} from './index';

describe('ClinicOS mode resolver', () => {
  it('boots in standalone mode without requiring ClinicOS services', () => {
    const resolver = new ClinicOsModeResolver();
    const context = resolver.resolve(STANDALONE_MODE_SETTINGS);

    assert.equal(context.enabled, false);
    assert.equal(context.hostMode, 'standalone');
    assert.equal(context.availability, 'disabled');
  });

  it('boots in ClinicOS mock mode with M03 through M26 context IDs', () => {
    const resolver = new ClinicOsModeResolver();
    const context = resolver.resolve(CLINICOS_MOCK_MODE_SETTINGS);

    assert.equal(context.enabled, true);
    assert.equal(context.hostMode, 'clinicos_integrated');
    assert.equal(context.availability, 'available');
    assert.match(context.visitGraphId ?? '', /^clinicos-m03/);
    assert.match(context.governanceContextId ?? '', /^clinicos-m24/);
    assert.match(context.dataCloudContextId ?? '', /^clinicos-m26/);
  });

  it('degrades safely when ClinicOS is configured but unavailable', () => {
    const resolver = new ClinicOsModeResolver();
    const context = resolver.resolve({ ...CLINICOS_MOCK_MODE_SETTINGS, unavailable: true });

    assert.equal(context.enabled, true);
    assert.equal(context.availability, 'unavailable');
    assert.equal(context.visitGraphId, undefined);
  });
});

describe('ClinicOS mock adapter', () => {
  it('stores VisitGraph and M17 mappings in mock mode', async () => {
    const adapter = new MockClinicOsAdapter({ enabled: true, hostMode: 'clinicos_integrated' });
    const mapped = await adapter.mapVisitContext({
      localAppointmentId: 'appt-synthetic-001',
      localNoteId: 'note-synthetic-001'
    });

    assert.equal(mapped.mappings.length, 2);
    assert.equal(mapped.mappings[0]?.clinicosModuleId, 'M03');
    assert.equal(mapped.mappings[1]?.clinicosModuleId, 'M17');
    assert.equal((await adapter.listMappings()).length, 2);
  });

  it('does not create mappings when ClinicOS is disabled', async () => {
    const adapter = new MockClinicOsAdapter();
    const mapped = await adapter.mapVisitContext({
      localAppointmentId: 'appt-synthetic-001',
      localNoteId: 'note-synthetic-001'
    });

    assert.equal(mapped.mappings.length, 0);
  });

  it('queues or safely skips published events based on availability', async () => {
    const enabled = new MockClinicOsAdapter({ enabled: true, hostMode: 'clinicos_integrated' });
    const disabled = new MockClinicOsAdapter();
    const unavailable = new MockClinicOsAdapter({ enabled: true, hostMode: 'clinicos_integrated', unavailable: true });

    assert.equal((await enabled.publishAuraNoteEvent({ eventType: 'ai.request_prepared.v1' })).status, 'queued');
    assert.equal((await disabled.publishAuraNoteEvent({ eventType: 'visit.started.v1' })).status, 'skipped_disabled');
    assert.equal((await unavailable.publishAuraNoteEvent({ eventType: 'ehr.chart_context_loaded.v1' })).status, 'failed_unavailable');
  });

  it('maps AURA Note events to the correct ClinicOS module families', () => {
    assert.deepEqual(resolveTargetModules('ai.response_recorded.v1'), ['M23', 'M24']);
    assert.deepEqual(resolveTargetModules('ehr.chart_context_loaded.v1'), ['M25']);
    assert.deepEqual(resolveTargetModules('billing_attestation.completed.v1'), ['M21']);
    assert.deepEqual(resolveTargetModules('history_gap.task_created.v1'), ['M04']);
    assert.deepEqual(resolveTargetModules('visit.started.v1'), ['M03', 'M17']);
  });
});
