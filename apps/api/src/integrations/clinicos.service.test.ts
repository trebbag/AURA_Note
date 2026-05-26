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
    assert.equal(mapped.data.mappings.length, 2);
    assert.equal(mapped.data.mappings[0]?.clinicosModuleId, 'M03');
    assert.equal(mapped.data.publishedEvent.status, 'queued');
    assert.equal(mapped.data.domainEvents.some((event) => event.eventType === 'clinicos.mapping_recorded.v1'), true);
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
  });
});
