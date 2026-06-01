import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveAuraRuntimeModeFromHeaders } from './mode-resolver';

describe('AURA runtime ModeResolver', () => {
  it('defaults to standalone authority without requiring ClinicOS context', () => {
    const resolved = resolveAuraRuntimeModeFromHeaders({});

    assert.equal(resolved.apiMode, 'standalone');
    assert.equal(resolved.modeContext.hostMode, 'standalone');
    assert.equal(resolved.modeContext.availability, 'disabled');
    assert.equal(resolved.permissionsStillEnforcedByAuraNote, true);
    assert.equal(resolved.liveClinicOsSyncEnabled, false);
    assert.equal(resolved.rawPayloadsStored, false);
    assert.equal(resolved.delegatedIdentityEnabled, false);
    assert.equal(resolved.adapterBoundaries.length, 10);
    assert.equal(resolved.adapterBoundaries.every((boundary) => boundary.permissionBoundary === 'aura_note_authoritative'), true);
    assert.equal(resolved.adapterBoundaries.every((boundary) => boundary.liveDelegationEnabled === false), true);
    assert.equal(resolved.adapterBoundaries.find((boundary) => boundary.seam === 'scheduleSource')?.adapterStatus, 'standalone_authoritative');
  });

  it('resolves ClinicOS mock mode through metadata-only adapter seams', () => {
    const resolved = resolveAuraRuntimeModeFromHeaders({
      'x-aura-clinicos-mode': 'clinicos_integrated'
    });

    assert.equal(resolved.apiMode, 'clinicos_integrated');
    assert.equal(resolved.modeContext.hostMode, 'clinicos_integrated');
    assert.equal(resolved.modeContext.availability, 'available');
    assert.equal(resolved.adapterBoundaries.find((boundary) => boundary.seam === 'visitGraph')?.clinicOsModuleId, 'M03');
    assert.equal(resolved.adapterBoundaries.find((boundary) => boundary.seam === 'aiGovernance')?.clinicOsModuleId, 'M24');
    assert.equal(resolved.adapterBoundaries.every((boundary) => boundary.rawPayloadStorageEnabled === false), true);
    assert.equal(resolved.adapterBoundaries.every((boundary) => boundary.humanReviewRequired === true), true);
  });

  it('fails closed for degraded or unavailable ClinicOS states', () => {
    const degraded = resolveAuraRuntimeModeFromHeaders({
      'x-aura-clinicos-mode': 'clinicos_integrated',
      'x-aura-clinicos-degraded': 'true'
    });
    const unavailable = resolveAuraRuntimeModeFromHeaders({
      'x-aura-clinicos-mode': 'clinicos_integrated',
      'x-aura-clinicos-unavailable': 'true'
    });

    assert.equal(degraded.modeContext.availability, 'degraded');
    assert.equal(degraded.adapterBoundaries.find((boundary) => boundary.seam === 'tasks')?.adapterStatus, 'mock_degraded');
    assert.equal(degraded.adapterBoundaries.every((boundary) => boundary.writesFailClosed === true), true);
    assert.equal(unavailable.modeContext.availability, 'unavailable');
    assert.equal(unavailable.adapterBoundaries.find((boundary) => boundary.seam === 'ehr')?.adapterStatus, 'unavailable');
  });

  it('collapses unsupported host mode headers back to standalone', () => {
    const resolved = resolveAuraRuntimeModeFromHeaders({
      'x-aura-clinicos-mode': 'unsupported-live-mode'
    });

    assert.equal(resolved.apiMode, 'standalone');
    assert.equal(resolved.modeContext.enabled, false);
  });
});
