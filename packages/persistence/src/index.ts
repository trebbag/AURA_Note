import { createHash } from 'node:crypto';
import type { AppointmentDto, NoteDto } from '@aura-note/contracts';
import { scanForForbiddenPhiKeys } from '@aura-note/security';

export type PersistenceAdapterKind = 'in_memory' | 'prisma';

export type PersistenceAdapterReadiness =
  | 'enabled_local_synthetic'
  | 'disabled_until_later_work_order'
  | 'blocked_missing_database_url'
  | 'blocked_production_phi_review';

export interface PersistenceAdapterConfig {
  requestedAdapter?: PersistenceAdapterKind;
  databaseUrl?: string;
  productionPhiPersistenceApproved?: boolean;
}

export interface PersistenceAdapterPlan {
  selectedAdapter: PersistenceAdapterKind;
  readiness: PersistenceAdapterReadiness;
  runtimeEnabled: boolean;
  liveDatabaseConnectionAllowed: false;
  storesProductionPhi: false;
  reason: string;
  requiredEvidence: string[];
}

export interface AppointmentNotePersistenceInput {
  appointment: AppointmentDto;
  note: NoteDto;
  generatedAt: string;
}

export interface PrismaRowProjection {
  table:
    | 'Tenant'
    | 'Site'
    | 'User'
    | 'Patient'
    | 'Appointment'
    | 'Note';
  naturalKey: Record<string, string>;
  data: Record<string, string | number | boolean | null>;
}

export interface AppointmentNotePrismaProjection {
  adapterKind: 'prisma';
  syntheticOnly: true;
  liveDatabaseConnectionAllowed: false;
  identifierStrategy: 'deterministic_uuid_scaffold';
  rows: PrismaRowProjection[];
}

export function resolvePersistenceAdapterPlan(config: PersistenceAdapterConfig = {}): PersistenceAdapterPlan {
  const selectedAdapter = config.requestedAdapter ?? 'in_memory';

  if (selectedAdapter === 'in_memory') {
    return {
      selectedAdapter,
      readiness: 'enabled_local_synthetic',
      runtimeEnabled: true,
      liveDatabaseConnectionAllowed: false,
      storesProductionPhi: false,
      reason: 'In-memory runtime remains the enabled synthetic adapter.',
      requiredEvidence: ['repository seam tests', 'full local gate']
    };
  }

  if (!config.databaseUrl) {
    return {
      selectedAdapter,
      readiness: 'blocked_missing_database_url',
      runtimeEnabled: false,
      liveDatabaseConnectionAllowed: false,
      storesProductionPhi: false,
      reason: 'Prisma runtime adapter is not enabled without an explicit local database URL.',
      requiredEvidence: ['local database URL', 'migration apply evidence', 'rollback evidence', 'tenant-scope query tests']
    };
  }

  if (config.productionPhiPersistenceApproved) {
    return {
      selectedAdapter,
      readiness: 'blocked_production_phi_review',
      runtimeEnabled: false,
      liveDatabaseConnectionAllowed: false,
      storesProductionPhi: false,
      reason: 'Production PHI persistence requires a separate privacy, security, retention, and rollback review.',
      requiredEvidence: ['security review', 'privacy review', 'retention approval', 'backup and restore evidence']
    };
  }

  return {
    selectedAdapter,
    readiness: 'disabled_until_later_work_order',
    runtimeEnabled: false,
    liveDatabaseConnectionAllowed: false,
    storesProductionPhi: false,
    reason: 'Prisma adapter mapping is scaffolded, but runtime database writes remain disabled until a later work order wires and tests the adapter.',
    requiredEvidence: ['Prisma adapter integration tests', 'migration apply evidence', 'rollback evidence', 'tenant-scope query tests']
  };
}

export function mapAppointmentNoteToPrismaProjection(
  input: AppointmentNotePersistenceInput
): AppointmentNotePrismaProjection {
  assertAppointmentNotePersistenceInput(input);

  const { appointment, note, generatedAt } = input;
  const tenantUuid = toDeterministicPersistenceUuid('tenant', appointment.tenantId);
  const siteUuid = toDeterministicPersistenceUuid('site', appointment.tenantId, appointment.siteId);
  const clinicianUuid = toDeterministicPersistenceUuid('user', appointment.tenantId, appointment.clinicianId);
  const patientUuid = toDeterministicPersistenceUuid('patient', appointment.tenantId, appointment.safePatientId);
  const appointmentUuid = toDeterministicPersistenceUuid('appointment', appointment.tenantId, appointment.appointmentId);
  const noteUuid = toDeterministicPersistenceUuid('note', appointment.tenantId, note.noteId);
  const endsAt = new Date(new Date(appointment.startsAt).getTime() + appointment.durationMinutes * 60_000).toISOString();

  const rows: PrismaRowProjection[] = [
    {
      table: 'Tenant',
      naturalKey: { id: appointment.tenantId },
      data: {
        id: tenantUuid,
        name: appointment.tenantId,
        mode: appointment.mode,
        updatedAt: generatedAt
      }
    },
    {
      table: 'Site',
      naturalKey: { id: appointment.siteId },
      data: {
        id: siteUuid,
        tenantId: tenantUuid,
        name: appointment.siteId,
        timezone: 'America/New_York',
        updatedAt: generatedAt
      }
    },
    {
      table: 'User',
      naturalKey: {
        tenantId: appointment.tenantId,
        clinicianId: appointment.clinicianId
      },
      data: {
        id: clinicianUuid,
        tenantId: tenantUuid,
        email: `${appointment.clinicianId}@synthetic.local`,
        displayName: appointment.clinicianId,
        status: 'synthetic_active',
        externalRef: appointment.clinicianId,
        updatedAt: generatedAt
      }
    },
    {
      table: 'Patient',
      naturalKey: {
        tenantId: appointment.tenantId,
        safePatientId: appointment.safePatientId
      },
      data: {
        id: patientUuid,
        tenantId: tenantUuid,
        siteId: siteUuid,
        safePatientId: appointment.safePatientId,
        status: 'synthetic_active',
        updatedAt: generatedAt
      }
    },
    {
      table: 'Appointment',
      naturalKey: { id: appointment.appointmentId },
      data: {
        id: appointmentUuid,
        tenantId: tenantUuid,
        siteId: siteUuid,
        patientId: patientUuid,
        clinicianId: clinicianUuid,
        startsAt: appointment.startsAt,
        endsAt,
        visitType: appointment.visitType,
        modality: appointment.modality,
        sourceSystem: appointment.source,
        state: appointment.state,
        reasonForVisit: appointment.reasonForVisit ?? null,
        updatedAt: generatedAt
      }
    },
    {
      table: 'Note',
      naturalKey: { id: note.noteId },
      data: {
        id: noteUuid,
        tenantId: tenantUuid,
        siteId: siteUuid,
        appointmentId: appointmentUuid,
        patientId: patientUuid,
        clinicianId: clinicianUuid,
        state: note.state,
        updatedAt: generatedAt
      }
    }
  ];

  return {
    adapterKind: 'prisma',
    syntheticOnly: true,
    liveDatabaseConnectionAllowed: false,
    identifierStrategy: 'deterministic_uuid_scaffold',
    rows
  };
}

export function toDeterministicPersistenceUuid(...parts: string[]): string {
  const hash = createHash('sha256')
    .update(parts.join('\u001f'))
    .digest('hex')
    .slice(0, 32)
    .split('');

  hash[12] = '5';
  hash[16] = ((Number.parseInt(hash[16] ?? '0', 16) & 0x3) | 0x8).toString(16);

  return [
    hash.slice(0, 8).join(''),
    hash.slice(8, 12).join(''),
    hash.slice(12, 16).join(''),
    hash.slice(16, 20).join(''),
    hash.slice(20, 32).join('')
  ].join('-');
}

function assertAppointmentNotePersistenceInput(input: AppointmentNotePersistenceInput): void {
  const { appointment, note } = input;

  if (appointment.appointmentId !== note.appointmentId || appointment.noteId !== note.noteId) {
    throw new Error('persistence projection requires one appointment to one note');
  }

  if (appointment.tenantId !== note.tenantId || appointment.siteId !== note.siteId) {
    throw new Error('persistence projection requires matching tenant and site scope');
  }

  const phiScan = scanForForbiddenPhiKeys({ appointment, note });
  if (phiScan.containsForbiddenPhi) {
    throw new Error(`persistence projection rejected forbidden PHI keys at ${phiScan.paths.join(', ')}`);
  }
}
