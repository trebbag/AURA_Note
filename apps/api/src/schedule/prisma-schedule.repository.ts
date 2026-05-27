import type { Prisma, PrismaClient } from '@prisma/client';
import type { AppointmentDto, NoteDto, StandaloneChartContextSnapshotDto, StandalonePatientDto } from '@aura-note/contracts';
import { createAppointmentLifecycle } from '@aura-note/domain';
import { mapAppointmentNoteToPrismaProjection, toDeterministicPersistenceUuid } from '@aura-note/persistence';
import type { AccessContext } from '@aura-note/security';
import type { StoredAppointment } from './schedule.repository';

type AppointmentWithLinks = Prisma.AppointmentGetPayload<{
  include: {
    tenant: true;
    site: true;
    patient: true;
    clinician: true;
    note: true;
  };
}>;

export interface AsyncScheduleStateRepository {
  listAppointments(): Promise<StoredAppointment[]>;
  getAppointment(appointmentId: string): Promise<StoredAppointment | undefined>;
  getByNoteId(noteId: string): Promise<StoredAppointment | undefined>;
  hasNoteForAppointment(appointmentId: string): Promise<boolean>;
  saveAppointment(entry: StoredAppointment): Promise<void>;
  getIdempotentAppointmentId(idempotencyKey: string): Promise<string | undefined>;
  saveIdempotencyKey(idempotencyKey: string, appointmentId: string): Promise<void>;
}

export interface PrismaScheduleStateRepositoryOptions {
  tenantId: string;
  siteId?: string;
  generatedAt?: () => string;
}

export function createPrismaScheduleStateRepository(
  prisma: PrismaClient,
  options: PrismaScheduleStateRepositoryOptions
): AsyncScheduleStateRepository {
  return new PrismaScheduleStateRepository(prisma, options);
}

export class PrismaScheduleStateRepository implements AsyncScheduleStateRepository {
  private readonly tenantUuid: string;
  private readonly siteUuid: string | undefined;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly options: PrismaScheduleStateRepositoryOptions
  ) {
    this.tenantUuid = toDeterministicPersistenceUuid('tenant', options.tenantId);
    this.siteUuid = options.siteId ? toDeterministicPersistenceUuid('site', options.tenantId, options.siteId) : undefined;
  }

  async listAppointments(): Promise<StoredAppointment[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: this.scopedAppointmentWhere(),
      include: this.includeAppointmentLinks(),
      orderBy: { startsAt: 'asc' }
    });

    return appointments.filter(hasPersistedNote).map((appointment) => this.toStoredAppointment(appointment));
  }

  async getAppointment(appointmentId: string): Promise<StoredAppointment | undefined> {
    const appointmentUuid = this.toAppointmentUuid(appointmentId);
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        ...this.scopedAppointmentWhere(),
        OR: [{ id: appointmentUuid }, { sourceRef: appointmentId }]
      },
      include: this.includeAppointmentLinks()
    });

    return appointment && hasPersistedNote(appointment) ? this.toStoredAppointment(appointment) : undefined;
  }

  async getByNoteId(noteId: string): Promise<StoredAppointment | undefined> {
    const noteUuid = this.toNoteUuid(noteId);
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        ...this.scopedAppointmentWhere(),
        note: {
          is: {
            OR: [{ id: noteUuid }, { sourceRef: noteId }]
          }
        }
      },
      include: this.includeAppointmentLinks()
    });

    return appointment && hasPersistedNote(appointment) ? this.toStoredAppointment(appointment) : undefined;
  }

  async hasNoteForAppointment(appointmentId: string): Promise<boolean> {
    return (await this.getAppointment(appointmentId)) !== undefined;
  }

  async saveAppointment(entry: StoredAppointment): Promise<void> {
    this.assertScopeMatchesEntry(entry);
    const generatedAt = this.options.generatedAt?.() ?? new Date().toISOString();
    const projection = mapAppointmentNoteToPrismaProjection({
      appointment: entry.appointment,
      note: entry.note,
      generatedAt
    });
    const tenant = rowData(projection.rows, 'Tenant');
    const site = rowData(projection.rows, 'Site');
    const user = rowData(projection.rows, 'User');
    const patient = rowData(projection.rows, 'Patient');
    const appointment = rowData(projection.rows, 'Appointment');
    const note = rowData(projection.rows, 'Note');

    await this.assertOneToOneMapping(entry.appointment.appointmentId, entry.note.noteId);

    await this.prisma.tenant.upsert({
      where: { id: stringField(tenant, 'id') },
      create: {
        id: stringField(tenant, 'id'),
        name: stringField(tenant, 'name'),
        mode: stringField(tenant, 'mode')
      },
      update: {
        name: stringField(tenant, 'name'),
        mode: stringField(tenant, 'mode')
      }
    });

    await this.prisma.site.upsert({
      where: { id: stringField(site, 'id') },
      create: {
        id: stringField(site, 'id'),
        tenantId: stringField(site, 'tenantId'),
        name: stringField(site, 'name'),
        timezone: stringField(site, 'timezone')
      },
      update: {
        name: stringField(site, 'name'),
        timezone: stringField(site, 'timezone')
      }
    });

    await this.prisma.user.upsert({
      where: {
        tenantId_email: {
          tenantId: stringField(user, 'tenantId'),
          email: stringField(user, 'email')
        }
      },
      create: {
        id: stringField(user, 'id'),
        tenantId: stringField(user, 'tenantId'),
        email: stringField(user, 'email'),
        displayName: stringField(user, 'displayName'),
        status: stringField(user, 'status'),
        externalRef: stringField(user, 'externalRef')
      },
      update: {
        displayName: stringField(user, 'displayName'),
        status: stringField(user, 'status'),
        externalRef: stringField(user, 'externalRef')
      }
    });

    await this.prisma.patient.upsert({
      where: {
        tenantId_safePatientId: {
          tenantId: stringField(patient, 'tenantId'),
          safePatientId: stringField(patient, 'safePatientId')
        }
      },
      create: {
        id: stringField(patient, 'id'),
        tenantId: stringField(patient, 'tenantId'),
        siteId: stringField(patient, 'siteId'),
        safePatientId: stringField(patient, 'safePatientId'),
        status: stringField(patient, 'status')
      },
      update: {
        siteId: stringField(patient, 'siteId'),
        status: stringField(patient, 'status')
      }
    });

    await this.prisma.appointment.upsert({
      where: { id: stringField(appointment, 'id') },
      create: {
        id: stringField(appointment, 'id'),
        tenantId: stringField(appointment, 'tenantId'),
        siteId: stringField(appointment, 'siteId'),
        patientId: stringField(appointment, 'patientId'),
        clinicianId: stringField(appointment, 'clinicianId'),
        visitType: stringField(appointment, 'visitType'),
        state: stringField(appointment, 'state') as AppointmentDto['state'],
        startsAt: new Date(stringField(appointment, 'startsAt')),
        endsAt: new Date(stringField(appointment, 'endsAt')),
        modality: stringField(appointment, 'modality'),
        reasonForVisit: nullableStringField(appointment, 'reasonForVisit'),
        sourceSystem: stringField(appointment, 'sourceSystem'),
        sourceRef: stringField(appointment, 'sourceRef')
      },
      update: {
        siteId: stringField(appointment, 'siteId'),
        patientId: stringField(appointment, 'patientId'),
        clinicianId: stringField(appointment, 'clinicianId'),
        visitType: stringField(appointment, 'visitType'),
        state: stringField(appointment, 'state') as AppointmentDto['state'],
        startsAt: new Date(stringField(appointment, 'startsAt')),
        endsAt: new Date(stringField(appointment, 'endsAt')),
        modality: stringField(appointment, 'modality'),
        reasonForVisit: nullableStringField(appointment, 'reasonForVisit'),
        sourceSystem: stringField(appointment, 'sourceSystem'),
        sourceRef: stringField(appointment, 'sourceRef')
      }
    });

    await this.prisma.note.upsert({
      where: { id: stringField(note, 'id') },
      create: {
        id: stringField(note, 'id'),
        tenantId: stringField(note, 'tenantId'),
        siteId: stringField(note, 'siteId'),
        appointmentId: stringField(note, 'appointmentId'),
        patientId: stringField(note, 'patientId'),
        clinicianId: stringField(note, 'clinicianId'),
        state: stringField(note, 'state') as NoteDto['state'],
        sourceRef: stringField(note, 'sourceRef')
      },
      update: {
        siteId: stringField(note, 'siteId'),
        appointmentId: stringField(note, 'appointmentId'),
        patientId: stringField(note, 'patientId'),
        clinicianId: stringField(note, 'clinicianId'),
        state: stringField(note, 'state') as NoteDto['state'],
        sourceRef: stringField(note, 'sourceRef')
      }
    });

    await this.prisma.chartContextSnapshot.upsert({
      where: { id: toDeterministicPersistenceUuid('chart-context', this.options.tenantId, entry.chartContextSnapshot.chartContextSnapshotId) },
      create: {
        id: toDeterministicPersistenceUuid('chart-context', this.options.tenantId, entry.chartContextSnapshot.chartContextSnapshotId),
        tenantId: stringField(patient, 'tenantId'),
        siteId: stringField(patient, 'siteId'),
        patientId: stringField(patient, 'id'),
        appointmentId: stringField(appointment, 'id'),
        sourceSystem: entry.chartContextSnapshot.sourceSystem,
        freshness: entry.chartContextSnapshot.sourceFreshness,
        snapshotJson: entry.chartContextSnapshot as unknown as Prisma.InputJsonValue
      },
      update: {
        siteId: stringField(patient, 'siteId'),
        appointmentId: stringField(appointment, 'id'),
        sourceSystem: entry.chartContextSnapshot.sourceSystem,
        freshness: entry.chartContextSnapshot.sourceFreshness,
        snapshotJson: entry.chartContextSnapshot as unknown as Prisma.InputJsonValue
      }
    });
  }

  async getIdempotentAppointmentId(idempotencyKey: string): Promise<string | undefined> {
    const record = await this.prisma.idempotencyRecord.findUnique({
      where: {
        tenantId_idempotencyKey: {
          tenantId: this.tenantUuid,
          idempotencyKey
        }
      },
      include: { appointment: true }
    });

    return record?.appointment.sourceRef ?? record?.appointment.id;
  }

  async saveIdempotencyKey(idempotencyKey: string, appointmentId: string): Promise<void> {
    const appointmentUuid = this.toAppointmentUuid(appointmentId);
    const existing = await this.prisma.idempotencyRecord.findUnique({
      where: {
        tenantId_idempotencyKey: {
          tenantId: this.tenantUuid,
          idempotencyKey
        }
      }
    });

    if (existing && existing.appointmentId !== appointmentUuid) {
      throw new Error('repository blocks idempotency key remapping');
    }

    await this.prisma.idempotencyRecord.upsert({
      where: {
        tenantId_idempotencyKey: {
          tenantId: this.tenantUuid,
          idempotencyKey
        }
      },
      create: {
        tenantId: this.tenantUuid,
        idempotencyKey,
        appointmentId: appointmentUuid
      },
      update: {
        appointmentId: appointmentUuid
      }
    });
  }

  private async assertOneToOneMapping(appointmentId: string, noteId: string): Promise<void> {
    const appointmentUuid = this.toAppointmentUuid(appointmentId);
    const noteUuid = this.toNoteUuid(noteId);
    const existingNoteForAppointment = await this.prisma.note.findUnique({
      where: { appointmentId: appointmentUuid }
    });

    if (existingNoteForAppointment && existingNoteForAppointment.id !== noteUuid) {
      throw new Error('repository blocks appointment-to-multiple-note persistence');
    }

    const existingNoteBySource = await this.prisma.note.findUnique({
      where: {
        tenantId_sourceRef: {
          tenantId: this.tenantUuid,
          sourceRef: noteId
        }
      }
    });

    if (existingNoteBySource && existingNoteBySource.appointmentId !== appointmentUuid) {
      throw new Error('repository blocks note-to-multiple-appointment persistence');
    }
  }

  private toStoredAppointment(record: AppointmentWithLinks & { note: NonNullable<AppointmentWithLinks['note']> }): StoredAppointment {
    const appointmentId = record.sourceRef ?? record.id;
    const noteId = record.note.sourceRef ?? record.note.id;
    const durationMinutes = record.endsAt
      ? Math.max(0, Math.round((record.endsAt.getTime() - record.startsAt.getTime()) / 60_000))
      : 30;
    const appointment: AppointmentDto = {
      appointmentId,
      tenantId: this.options.tenantId,
      siteId: record.site.name,
      safePatientId: record.patient.safePatientId,
      clinicianId: record.clinician.externalRef ?? record.clinician.displayName,
      noteId,
      state: record.state as AppointmentDto['state'],
      startsAt: record.startsAt.toISOString(),
      durationMinutes,
      visitType: record.visitType,
      modality: toModality(record.modality),
      source: toSource(record.sourceSystem),
      ...(record.reasonForVisit ? { reasonForVisit: record.reasonForVisit } : {}),
      mode: toMode(record.tenant.mode)
    };
    const note: NoteDto = {
      noteId,
      appointmentId,
      tenantId: this.options.tenantId,
      siteId: record.site.name,
      safePatientId: record.patient.safePatientId,
      clinicianId: record.clinician.externalRef ?? record.clinician.displayName,
      state: record.note.state as NoteDto['state'],
      mode: toMode(record.tenant.mode)
    };
    const patient: StandalonePatientDto = {
      patientId: record.patient.id,
      tenantId: this.options.tenantId,
      siteId: record.site.name,
      safePatientId: record.patient.safePatientId,
      status: record.patient.status === 'inactive' ? 'inactive' : 'active',
      displayLabel: `Standalone ${record.patient.safePatientId}`,
      createdAt: record.patient.createdAt.toISOString(),
      updatedAt: record.patient.updatedAt.toISOString(),
      mode: toMode(record.tenant.mode)
    };
    const chartContextSnapshot: StandaloneChartContextSnapshotDto = {
      chartContextSnapshotId: `chart-context-${appointmentId}`,
      tenantId: this.options.tenantId,
      siteId: record.site.name,
      safePatientId: record.patient.safePatientId,
      appointmentId,
      noteId,
      sourceSystem: 'standalone_local',
      sourceFreshness: 'recent',
      staleWarning: false,
      slices: [],
      warnings: ['Synthetic standalone chart context only; live EHR completeness is not implied.'],
      aiPackagingAllowed: false,
      productionPhiStorageApproved: false,
      createdAt: record.createdAt.toISOString(),
      mode: toMode(record.tenant.mode)
    };
    const lifecycle = createAppointmentLifecycle(appointmentId, noteId, {
      tenantId: appointment.tenantId,
      siteId: appointment.siteId,
      safePatientId: appointment.safePatientId,
      clinicianId: appointment.clinicianId,
      visitType: appointment.visitType,
      startsAt: appointment.startsAt,
      durationMinutes: appointment.durationMinutes,
      modality: appointment.modality,
      source: appointment.source,
      ...(appointment.reasonForVisit ? { reasonForVisit: appointment.reasonForVisit } : {})
    });

    return {
      appointment,
      note,
      patient,
      linkages: [
        {
          patientLinkageId: `patient-linkage-${appointmentId}`,
          tenantId: this.options.tenantId,
          siteId: record.site.name,
          safePatientId: record.patient.safePatientId,
          appointmentId,
          noteId,
          linkedObjectType: 'appointment',
          linkedObjectId: appointmentId,
          purpose: 'treatment',
          active: true,
          createdAt: record.createdAt.toISOString()
        },
        {
          patientLinkageId: `chart-context-linkage-${appointmentId}`,
          tenantId: this.options.tenantId,
          siteId: record.site.name,
          safePatientId: record.patient.safePatientId,
          appointmentId,
          noteId,
          linkedObjectType: 'chart_context',
          linkedObjectId: chartContextSnapshot.chartContextSnapshotId,
          purpose: 'documentation',
          active: true,
          createdAt: record.createdAt.toISOString()
        }
      ],
      chartContextSnapshot,
      lifecycle: {
        ...lifecycle,
        appointmentState: appointment.state,
        noteState: note.state,
        noteVisibleInDrafts: note.state !== 'shell_created' && note.state !== 'finalized'
      }
    };
  }

  private toAppointmentUuid(appointmentId: string): string {
    return isUuid(appointmentId) ? appointmentId : toDeterministicPersistenceUuid('appointment', this.options.tenantId, appointmentId);
  }

  private toNoteUuid(noteId: string): string {
    return isUuid(noteId) ? noteId : toDeterministicPersistenceUuid('note', this.options.tenantId, noteId);
  }

  private scopedAppointmentWhere(): Prisma.AppointmentWhereInput {
    return {
      tenantId: this.tenantUuid,
      ...(this.siteUuid ? { siteId: this.siteUuid } : {})
    };
  }

  private assertScopeMatchesEntry(entry: StoredAppointment): void {
    if (entry.appointment.tenantId !== this.options.tenantId || entry.note.tenantId !== this.options.tenantId) {
      throw new Error('repository blocks cross-tenant persistence through scoped Prisma adapter');
    }

    if (this.options.siteId && (entry.appointment.siteId !== this.options.siteId || entry.note.siteId !== this.options.siteId)) {
      throw new Error('repository blocks cross-site persistence through scoped Prisma adapter');
    }
  }

  private includeAppointmentLinks() {
    return {
      tenant: true,
      site: true,
      patient: true,
      clinician: true,
      note: true
    } satisfies Prisma.AppointmentInclude;
  }
}

function hasPersistedNote(record: AppointmentWithLinks): record is AppointmentWithLinks & { note: NonNullable<AppointmentWithLinks['note']> } {
  return record.note !== null;
}

function rowData(rows: ReturnType<typeof mapAppointmentNoteToPrismaProjection>['rows'], table: string) {
  const row = rows.find((candidate) => candidate.table === table);
  if (!row) {
    throw new Error(`missing ${table} Prisma projection row`);
  }
  return row.data;
}

function stringField(data: Record<string, string | number | boolean | null>, field: string): string {
  const value = data[field];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`missing string field ${field}`);
  }
  return value;
}

function nullableStringField(data: Record<string, string | number | boolean | null>, field: string): string | null {
  const value = data[field];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function toSource(value: string): AppointmentDto['source'] {
  return value === 'ehr_import' || value === 'clinicos' || value === 'standalone' ? value : 'standalone';
}

function toModality(value: string): AppointmentDto['modality'] {
  return value === 'telehealth' || value === 'phone' || value === 'in_person' ? value : 'in_person';
}

function toMode(value: string): AppointmentDto['mode'] {
  return value === 'clinicos_integrated' ? value : 'standalone';
}

export async function getPersistedAppointmentForAccessContext(
  prisma: PrismaClient,
  access: AccessContext,
  appointmentId: string
): Promise<StoredAppointment | undefined> {
  if (!access.tenantId || !access.siteId) {
    throw new Error('persisted schedule access requires tenant and site scope');
  }

  const repository = createPrismaScheduleStateRepository(prisma, {
    tenantId: access.tenantId,
    siteId: access.siteId
  });
  return repository.getAppointment(appointmentId);
}
