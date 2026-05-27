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
  const rows: PrismaRowProjection[] = [
    {
      table: 'Tenant',
      naturalKey: { id: appointment.tenantId },
      data: {
        id: appointment.tenantId,
        name: appointment.tenantId,
        mode: appointment.mode,
        updatedAt: generatedAt
      }
    },
    {
      table: 'Site',
      naturalKey: { id: appointment.siteId },
      data: {
        id: appointment.siteId,
        tenantId: appointment.tenantId,
        name: appointment.siteId,
        timezone: 'America/New_York',
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
        id: `${appointment.tenantId}:${appointment.safePatientId}`,
        tenantId: appointment.tenantId,
        siteId: appointment.siteId,
        safePatientId: appointment.safePatientId,
        status: 'synthetic_active',
        updatedAt: generatedAt
      }
    },
    {
      table: 'Appointment',
      naturalKey: { id: appointment.appointmentId },
      data: {
        id: appointment.appointmentId,
        tenantId: appointment.tenantId,
        siteId: appointment.siteId,
        patientSafeRef: appointment.safePatientId,
        clinicianId: appointment.clinicianId,
        noteId: appointment.noteId,
        startsAt: appointment.startsAt,
        durationMinutes: appointment.durationMinutes,
        visitType: appointment.visitType,
        modality: appointment.modality,
        source: appointment.source,
        state: appointment.state,
        reasonForVisit: appointment.reasonForVisit ?? null,
        updatedAt: generatedAt
      }
    },
    {
      table: 'Note',
      naturalKey: { id: note.noteId },
      data: {
        id: note.noteId,
        tenantId: note.tenantId,
        siteId: note.siteId,
        appointmentId: note.appointmentId,
        patientSafeRef: note.safePatientId,
        clinicianId: note.clinicianId,
        state: note.state,
        mode: note.mode,
        updatedAt: generatedAt
      }
    }
  ];

  return {
    adapterKind: 'prisma',
    syntheticOnly: true,
    liveDatabaseConnectionAllowed: false,
    rows
  };
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
