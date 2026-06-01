import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ForbiddenException } from '@nestjs/common';
import { ClinicOsService } from './clinicos.service';

describe('ClinicOS integration service', () => {
  it('reports standalone mode with AURA Note permissions still enforced', async () => {
    const service = new ClinicOsService();
    const status = await service.getStatus({
      'x-aura-role': 'clinician',
      'x-aura-linked-visit': 'true',
      'x-trace-id': 'trace-clinicos-status-001'
    });

    assert.equal(status.data.modeContext.hostMode, 'standalone');
    assert.equal(status.data.modeContext.availability, 'disabled');
    assert.equal(status.data.permissionsStillEnforcedByAuraNote, true);
    assert.equal(status.data.rawPayloadsStored, false);
    assert.equal(status.data.liveClinicOsSyncEnabled, false);
    assert.equal(status.data.moduleBoundaries.length, 8);
    assert.equal(status.data.modeAdapterBoundaries.length, 10);
    assert.equal(status.data.modeAdapterBoundaries.every((boundary) => boundary.permissionBoundary === 'aura_note_authoritative'), true);
    assert.equal(status.data.modeAdapterBoundaries.every((boundary) => boundary.liveDelegationEnabled === false), true);
    assert.equal(status.data.states.includes('permission-denied'), true);
    assert.equal(status.data.domainEvents[0]?.eventType, 'clinicos.mode_resolved.v1');
  });

  it('maps visit context in ClinicOS mock mode for authorized admin/service context', async () => {
    const service = new ClinicOsService();
    const mapped = await service.mapVisit(
      {
        localAppointmentId: 'appt-synthetic-001',
        localNoteId: 'note-synthetic-001'
      },
      {
        'x-aura-role': 'authorized_admin',
        'x-aura-clinicos-mode': 'clinicos_integrated',
        'x-trace-id': 'trace-clinicos-map-001'
      }
    );

    assert.equal(mapped.data.modeContext.hostMode, 'clinicos_integrated');
    assert.equal(mapped.data.modeAdapterBoundaries?.find((boundary) => boundary.seam === 'visitGraph')?.clinicOsModuleId, 'M03');
    assert.equal(mapped.data.modeAdapterBoundaries?.every((boundary) => boundary.humanReviewRequired === true), true);
    assert.equal(mapped.data.mappings.length, 2);
    assert.equal(mapped.data.mappings[0]?.clinicosModuleId, 'M03');
    assert.equal(mapped.data.publishedEvent.status, 'queued');
    assert.equal(mapped.data.publishedEvent.payloadStored, false);
    assert.equal(mapped.data.domainEvents.some((event) => event.eventType === 'clinicos.mapping_recorded.v1'), true);
  });

  it('records stale ClinicOS mappings with metadata-only review evidence', async () => {
    const service = new ClinicOsService();
    const response = await service.upsertMapping(
      {
        localObjectType: 'task',
        localObjectId: 'task-ma-follow-up-001',
        clinicosModuleId: 'M04',
        status: 'stale',
        reason: 'ClinicOS task reference is older than the local blocker.'
      },
      {
        'x-aura-role': 'service_account',
        'x-aura-clinicos-mode': 'clinicos_integrated',
        'idempotency-key': 'idem-clinicos-stale-001',
        'x-trace-id': 'trace-clinicos-stale-001'
      }
    );

    assert.equal(response.data.mapping.status, 'stale');
    assert.equal(response.data.mapping.staleReason, 'ClinicOS task reference is older than the local blocker.');
    assert.equal(response.data.domainEvents[0]?.eventType, 'clinicos.mapping_stale_detected.v1');
  });

  it('publishes failed/degraded event metadata without raw ClinicOS payload storage', async () => {
    const service = new ClinicOsService();
    const response = await service.publishEvent(
      {
        eventType: 'ehr.writeback_approval_recorded.v1',
        targetModules: ['M25'],
        localObjectId: 'ehr-wb-pending-001'
      },
      {
        'x-aura-role': 'service_account',
        'x-aura-clinicos-mode': 'clinicos_integrated',
        'x-aura-clinicos-unavailable': 'true',
        'x-trace-id': 'trace-clinicos-publish-failed-001'
      }
    );

    assert.equal(response.data.publishedEvent.status, 'failed_unavailable');
    assert.equal(response.data.publishedEvent.payloadStored, false);
    assert.equal(response.data.publishedEvent.permissionBoundaryEnforced, true);
    assert.equal(response.data.domainEvents[0]?.eventType, 'clinicos.event_publication_failed.v1');
  });

  it('denies mapping writes to ordinary clinicians', async () => {
    const service = new ClinicOsService();

    await assert.rejects(
      () =>
        service.mapVisit(
          {
            localAppointmentId: 'appt-synthetic-001',
            localNoteId: 'note-synthetic-001'
          },
          {
            'x-aura-role': 'clinician',
            'x-aura-linked-visit': 'true',
            'x-aura-clinicos-mode': 'clinicos_integrated'
          }
        ),
      ForbiddenException
    );
  });

  it('denies delegated identity mode until a provider adapter is configured', async () => {
    const service = new ClinicOsService();

    await assert.rejects(
      () =>
        service.getStatus({
          'x-aura-role': 'clinician',
          'x-aura-linked-visit': 'true',
          'x-aura-identity-provider': 'oidc_delegate'
        }),
      ForbiddenException
    );
  });

  it('degrades safely when ClinicOS is unavailable', async () => {
    const service = new ClinicOsService();
    const mapped = await service.mapVisit(
      {
        localAppointmentId: 'appt-synthetic-001',
        localNoteId: 'note-synthetic-001'
      },
      {
        'x-aura-role': 'authorized_admin',
        'x-aura-clinicos-mode': 'clinicos_integrated',
        'x-aura-clinicos-unavailable': 'true',
        'x-trace-id': 'trace-clinicos-unavailable-001'
      }
    );

    assert.equal(mapped.data.modeContext.availability, 'unavailable');
    assert.equal(mapped.data.mappings.length, 0);
    assert.equal(mapped.data.publishedEvent.status, 'failed_unavailable');
    assert.equal(mapped.data.modeAdapterBoundaries?.find((boundary) => boundary.seam === 'ehr')?.adapterStatus, 'unavailable');
  });

  it('marks degraded ClinicOS mode as fail-closed without live delegation', async () => {
    const service = new ClinicOsService();
    const status = await service.getStatus({
      'x-aura-role': 'clinician',
      'x-aura-linked-visit': 'true',
      'x-aura-clinicos-mode': 'clinicos_integrated',
      'x-aura-clinicos-degraded': 'true',
      'x-trace-id': 'trace-clinicos-degraded-001'
    });

    assert.equal(status.data.modeContext.availability, 'degraded');
    assert.equal(status.data.modeAdapterBoundaries.find((boundary) => boundary.seam === 'tasks')?.adapterStatus, 'mock_degraded');
    assert.equal(status.data.modeAdapterBoundaries.every((boundary) => boundary.writesFailClosed === true), true);
    assert.equal(status.data.modeAdapterBoundaries.every((boundary) => boundary.rawPayloadStorageEnabled === false), true);
  });

  it('denies cross-tenant service-account attempts before metadata is exposed', async () => {
    const service = new ClinicOsService();

    await assert.rejects(
      () =>
        service.upsertMapping(
          {
            localObjectType: 'appointment',
            localObjectId: 'appt-cross-tenant',
            clinicosModuleId: 'M03'
          },
          {
            'x-aura-role': 'service_account',
            'x-aura-tenant-id': 'tenant-synthetic-other',
            'x-aura-clinicos-mode': 'clinicos_integrated'
          }
        ),
      ForbiddenException
    );
  });
});
