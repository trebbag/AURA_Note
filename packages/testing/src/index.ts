import type {
  AiEvidenceNodeDto,
  AiGatewayInvocationRequestDto,
  AppointmentDto,
  ClinicOsIntegrationStatusDto,
  EhrChartContextPackageDto,
  NoteDto,
  TaskDto,
  VisitSessionDto
} from '@aura-note/contracts';
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

export function createSyntheticAiEvidenceNode(overrides: Partial<AiEvidenceNodeDto> = {}): AiEvidenceNodeDto {
  return {
    evidenceId: 'evidence-synthetic-001',
    evidenceType: 'chart_slice',
    sourceSystem: 'synthetic_fixture',
    sourceRef: 'chart-context-synthetic-001',
    displayLabel: 'Synthetic chart context',
    excerptOrValue: 'Synthetic deidentified evidence value',
    freshness: 'recent',
    sourceQuality: 'high',
    phiClassification: 'deidentified',
    allowedRoles: ['clinician'],
    ...overrides
  };
}

export function createSyntheticAiInvocationRequest(
  overrides: Partial<AiGatewayInvocationRequestDto> = {}
): AiGatewayInvocationRequestDto {
  return {
    purpose: 'suggestions',
    safePatientId: syntheticIds.safePatientId,
    noteId: syntheticIds.noteId,
    phiHandling: 'reject',
    clinicalFacts: {
      visitType: 'Synthetic chronic follow-up',
      activeProblems: ['Synthetic diabetes follow-up']
    },
    evidence: [createSyntheticAiEvidenceNode()],
    ...overrides
  };
}

export function createSyntheticEhrChartContext(
  overrides: Partial<EhrChartContextPackageDto> = {}
): EhrChartContextPackageDto {
  return {
    chartContextPackageId: 'chart-context-athena-synthetic-001',
    tenantId: syntheticIds.tenantId,
    siteId: syntheticIds.siteId,
    safePatientId: syntheticIds.safePatientId,
    externalPatientRef: 'athena-patient-ref-synthetic-001',
    externalEncounterId: 'athena-encounter-synthetic-001',
    sourceSystem: 'athenahealth',
    requestedSlices: ['problems', 'medications', 'allergies'],
    slices: [
      {
        sliceType: 'problems',
        sourceSystem: 'athenahealth',
        sourceRecordRef: 'athena-problem-synthetic-001',
        value: { items: ['Synthetic chronic condition item'] },
        effectiveAt: '2026-05-26T14:00:00.000Z',
        freshness: 'recent',
        sourceQuality: 'high',
        phiClassification: 'phi_reference',
        allowedPurposes: ['care', 'documentation', 'billing_review', 'ai_context_packaging'],
        evidenceIds: ['evidence-problems-synthetic-001']
      }
    ],
    staleSliceCount: 0,
    createdAt: '2026-05-26T18:00:00.000Z',
    warnings: [],
    ...overrides
  };
}

export function createSyntheticClinicOsStatus(
  overrides: Partial<ClinicOsIntegrationStatusDto> = {}
): ClinicOsIntegrationStatusDto {
  return {
    modeContext: {
      enabled: true,
      hostMode: 'clinicos_integrated',
      tenantId: syntheticIds.tenantId,
      siteId: syntheticIds.siteId,
      availability: 'available',
      visitGraphId: 'clinicos-m03-visitgraph-synthetic-001',
      npCockpitContextId: 'clinicos-m17-np-cockpit-synthetic-001',
      warnings: ['Synthetic ClinicOS mock mode']
    },
    mappings: [
      {
        mappingId: 'clinicos-map-synthetic-001',
        tenantId: syntheticIds.tenantId,
        siteId: syntheticIds.siteId,
        localObjectType: 'appointment',
        localObjectId: syntheticIds.appointmentId,
        clinicosModuleId: 'M03',
        clinicosObjectId: 'clinicos-m03-visitgraph-synthetic-001',
        sourceOfTruth: 'clinicos',
        status: 'active',
        createdAt: '2026-05-26T18:30:00.000Z'
      }
    ],
    publishedEvents: [],
    permissionsStillEnforcedByAuraNote: true,
    auditEvent: {
      auditEventId: 'audit-clinicos-synthetic-001',
      tenantId: syntheticIds.tenantId,
      siteId: syntheticIds.siteId,
      action: 'clinicos.status',
      entityType: 'ClinicOsAdapter',
      entityId: 'clinicos_integrated',
      traceId: 'trace-clinicos-synthetic-001',
      createdAt: '2026-05-26T18:30:00.000Z'
    },
    domainEvents: [],
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
