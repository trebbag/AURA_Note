import type { AppointmentDto, NoteDto, TaskDto, VisitSessionDto } from '@aura-note/contracts';
import type { AccessContext } from '@aura-note/security';

export const syntheticIds = {
  tenantId: 'tenant-synthetic-primary',
  siteId: 'site-synthetic-primary',
  safePatientId: 'safe-patient-synthetic-001',
  clinicianId: 'user-clinician-synthetic-001',
  maUserId: 'user-ma-synthetic-001',
  billingUserId: 'user-billing-synthetic-001',
  appointmentId: 'appt-synthetic-001',
  noteId: 'note-synthetic-001',
  visitSessionId: 'visit-session-synthetic-001'
} as const;

export function createSyntheticAppointment(overrides: Partial<AppointmentDto> = {}): AppointmentDto {
  return {
    appointmentId: syntheticIds.appointmentId,
    tenantId: syntheticIds.tenantId,
    siteId: syntheticIds.siteId,
    safePatientId: syntheticIds.safePatientId,
    clinicianId: syntheticIds.clinicianId,
    noteId: syntheticIds.noteId,
    state: 'scheduled',
    startsAt: '2026-05-26T14:00:00.000Z',
    durationMinutes: 30,
    visitType: 'Chronic follow-up',
    modality: 'in_person',
    source: 'standalone',
    mode: 'standalone',
    ...overrides
  };
}

export function createSyntheticNote(overrides: Partial<NoteDto> = {}): NoteDto {
  return {
    noteId: syntheticIds.noteId,
    appointmentId: syntheticIds.appointmentId,
    tenantId: syntheticIds.tenantId,
    siteId: syntheticIds.siteId,
    safePatientId: syntheticIds.safePatientId,
    clinicianId: syntheticIds.clinicianId,
    state: 'shell_created',
    mode: 'standalone',
    ...overrides
  };
}

export function createSyntheticVisitSession(overrides: Partial<VisitSessionDto> = {}): VisitSessionDto {
  return {
    visitSessionId: syntheticIds.visitSessionId,
    noteId: syntheticIds.noteId,
    timerState: 'not_started',
    recordingState: 'not_started',
    editorUnlocked: false,
    ...overrides
  };
}

export function createSyntheticBlockingTask(overrides: Partial<TaskDto> = {}): TaskDto {
  return {
    taskId: 'task-synthetic-blocker-001',
    noteId: syntheticIds.noteId,
    safePatientId: syntheticIds.safePatientId,
    title: 'Synthetic follow-up question requires adjudication',
    blocksSigning: true,
    adjudicationStatus: 'open',
    ownerRole: 'ma',
    ...overrides
  };
}

export function createAccessContext(overrides: Partial<AccessContext> = {}): AccessContext {
  return {
    role: 'clinician',
    linkedToPatient: true,
    linkedToVisit: true,
    treatingClinician: true,
    billingReviewTriggered: false,
    authorizedAdmin: false,
    ...overrides
  };
}
