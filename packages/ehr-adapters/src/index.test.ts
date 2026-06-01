import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  AthenahealthAdapter,
  DisabledEhrAdapter,
  MockEhrAdapter,
  createEhrAdapter,
  validateChartContextPackage
} from './index';

describe('EHR adapter contract', () => {
  it('keeps standalone mode safe when EHR is disabled', async () => {
    const adapter = new DisabledEhrAdapter();
    const status = await adapter.getConnectionStatus();
    const writeback = await adapter.writeFinalNote({
      externalEncounterId: 'encounter-disabled-001',
      target: 'final_note',
      content: 'Synthetic final note text',
      idempotencyKey: 'idem-disabled-001',
      humanApproved: true
    });

    assert.equal(status.connected, false);
    assert.equal(status.health, 'disabled');
    assert.equal(writeback.status, 'not_configured');
    assert.equal(writeback.queued, false);
  });

  it('populates synthetic chart context slices through the mock adapter', async () => {
    const adapter = new MockEhrAdapter();
    const context = await adapter.getChartContext({
      safePatientId: 'safe-patient-synthetic-001',
      externalPatientRef: 'mock-patient-ref-001',
      externalEncounterId: 'mock-encounter-001',
      requestedSlices: ['problems', 'medications', 'allergies', 'labs', 'documents']
    });

    assert.equal(context.sourceSystem, 'generic_mock');
    assert.deepEqual(
      context.slices.map((slice) => slice.sliceType),
      ['problems', 'medications', 'allergies', 'labs', 'documents']
    );
    assert.equal(validateChartContextPackage(context).length, 0);
  });

  it('isolates athenahealth as a sandbox adapter without live credentials', async () => {
    const adapter = new AthenahealthAdapter({ mode: 'sandbox' });
    const health = await adapter.healthCheck();
    const boundary = await adapter.getRuntimeBoundary();
    const patients = await adapter.searchPatients({ safePatientId: 'safe-patient-synthetic-001' });
    const schedule = await adapter.getSchedule('2026-05-26T14:00:00.000Z', '2026-05-26T22:00:00.000Z');
    const encounter = await adapter.getEncounter('athena-encounter-synthetic-001');
    const context = await adapter.getChartContext({
      safePatientId: 'safe-patient-synthetic-001',
      externalPatientRef: 'athena-patient-ref-synthetic-001',
      externalEncounterId: 'athena-encounter-synthetic-001',
      requestedSlices: ['problems', 'medications']
    });

    assert.equal(health.status.vendor, 'athenahealth');
    assert.equal(health.status.mode, 'sandbox');
    assert.equal(health.status.connected, true);
    assert.equal(health.capabilities.configured, false);
    assert.equal(boundary.adapterBoundary, 'vendor_neutral_ehr_adapter');
    assert.equal(boundary.liveApiCallsEnabled, false);
    assert.equal(boundary.rawPayloadStorageEnabled, false);
    assert.equal(patients[0]?.source, 'athenahealth_sandbox');
    assert.equal(schedule[0]?.sourceSystem, 'athenahealth');
    assert.equal(encounter.sourceSystem, 'athenahealth');
    assert.equal(context.sourceSystem, 'athenahealth');
  });

  it('handles configured, unconfigured, and failure writeback states conservatively', async () => {
    const unconfigured = await new AthenahealthAdapter({ mode: 'sandbox' }).writeFinalNote({
      externalEncounterId: 'athena-encounter-synthetic-001',
      target: 'final_note',
      content: 'Synthetic final note text',
      idempotencyKey: 'idem-athena-unconfigured',
      humanApproved: true
    });
    const queued = await new AthenahealthAdapter({
      mode: 'sandbox',
      clientIdConfigured: true,
      clientSecretConfigured: true
    }).writePatientSummary({
      externalEncounterId: 'athena-encounter-synthetic-001',
      target: 'patient_summary',
      content: 'Synthetic patient summary text',
      idempotencyKey: 'idem-athena-queued',
      humanApproved: true
    });
    const failed = await new AthenahealthAdapter({
      mode: 'sandbox',
      clientIdConfigured: true,
      clientSecretConfigured: true,
      simulateFailure: true
    }).writeFinalNote({
      externalEncounterId: 'athena-encounter-synthetic-001',
      target: 'final_note',
      content: 'Synthetic final note text',
      idempotencyKey: 'idem-athena-failed',
      humanApproved: true
    });
    const unapproved = await new AthenahealthAdapter({
      mode: 'sandbox',
      clientIdConfigured: true,
      clientSecretConfigured: true
    }).writeFinalNote({
      externalEncounterId: 'athena-encounter-synthetic-001',
      target: 'final_note',
      content: 'Synthetic final note text',
      idempotencyKey: 'idem-athena-unapproved',
      humanApproved: false
    });

    assert.equal(unconfigured.status, 'not_configured');
    assert.equal(queued.status, 'queued');
    assert.match(queued.externalJobId ?? '', /^athena-sandbox-writeback-/);
    assert.equal(failed.status, 'failed');
    assert.equal(failed.retryable, true);
    assert.equal(unapproved.status, 'failed');
    assert.equal(unapproved.queued, false);
  });

  it('creates adapters from vendor-neutral configuration', async () => {
    const athena = createEhrAdapter({ vendor: 'athenahealth', mode: 'sandbox' });
    const mock = createEhrAdapter({ vendor: 'generic_mock', mode: 'mock' });
    const disabled = createEhrAdapter({ vendor: 'epic', mode: 'disabled' });

    assert.equal((await athena.getConnectionStatus()).vendor, 'athenahealth');
    assert.equal((await mock.getConnectionStatus()).mode, 'mock');
    assert.equal((await disabled.getConnectionStatus()).connected, false);
  });
});
