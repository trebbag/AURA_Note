import type {
  AiEvidenceNodeDto,
  AiGatewayInvocationRequestDto,
  AppointmentDto,
  AuditExportResponseDto,
  ClinicOsIntegrationStatusDto,
  CoachingDashboardDto,
  CoachingReportDto,
  EhrChartContextPackageDto,
  NoteDto,
  SupportStatusResponseDto,
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

export function createSyntheticCoachingReport(overrides: Partial<CoachingReportDto> = {}): CoachingReportDto {
  return {
    reportId: 'coach-report-synthetic-001',
    clinicianId: syntheticIds.clinicianId,
    noteId: syntheticIds.noteId,
    generatedAt: '2026-05-26T18:45:00.000Z',
    overallScore: 82,
    signals: [
      {
        coachingSignalId: 'coach-signal-synthetic-001',
        noteId: syntheticIds.noteId,
        clinicianId: syntheticIds.clinicianId,
        category: 'documentation_completeness',
        score: 84,
        title: 'Synthetic documentation completeness',
        detail: 'Synthetic coaching signal for clinician-only review.',
        evidenceIds: ['evidence-synthetic-001'],
        improvementPrompt: 'Keep assessment and plan linked by problem.',
        billingRelated: false,
        patientFacingExcluded: true,
        generatedAt: '2026-05-26T18:45:00.000Z'
      }
    ],
    unavailableReasons: [],
    privacyLabel: 'own_clinician_only',
    patientFacingExcluded: true,
    auditEvent: {
      auditEventId: 'audit-coaching-synthetic-001',
      tenantId: syntheticIds.tenantId,
      siteId: syntheticIds.siteId,
      actorUserId: syntheticIds.clinicianId,
      action: 'coaching.view_own',
      entityType: 'CoachingReport',
      entityId: 'coach-report-synthetic-001',
      traceId: 'trace-coaching-synthetic-001',
      createdAt: '2026-05-26T18:45:00.000Z'
    },
    domainEvents: [],
    ...overrides
  };
}

export function createSyntheticCoachingDashboard(
  overrides: Partial<CoachingDashboardDto> = {}
): CoachingDashboardDto {
  return {
    dashboardId: 'coach-dashboard-synthetic-001',
    visibilityMode: 'aggregate_only',
    generatedAt: '2026-05-26T18:50:00.000Z',
    aggregateOnly: true,
    providerCount: 2,
    overallAverage: 83,
    categoryAverages: {
      documentation_completeness: 84,
      billing_optimization: 78,
      patient_voice_fidelity: 90,
      communication_clarity: 86,
      clinical_reasoning: 82,
      history_taking_depth: 80,
      em_justification: 76
    },
    clinicianSummaries: [
      {
        signalCount: 7,
        averageScore: 83
      }
    ],
    roiSignals: {
      timeSavedMinutes: 42,
      revenueCapturedLabel: 'internal_only_not_patient_facing',
      denialsReducedCount: 1,
      trainingImprovementItems: 3
    },
    privacyLabel: 'aggregate_only',
    auditEvent: {
      auditEventId: 'audit-coaching-dashboard-synthetic-001',
      tenantId: syntheticIds.tenantId,
      siteId: syntheticIds.siteId,
      actorUserId: 'synthetic-authorized-admin',
      action: 'coaching.dashboard_view',
      entityType: 'CoachingDashboard',
      entityId: 'coach-dashboard-synthetic-001',
      traceId: 'trace-coaching-dashboard-synthetic-001',
      createdAt: '2026-05-26T18:50:00.000Z'
    },
    domainEvents: [],
    ...overrides
  };
}

export function createSyntheticSupportStatus(overrides: Partial<SupportStatusResponseDto> = {}): SupportStatusResponseDto {
  return {
    status: {
      service: 'aura-note',
      checkpoint: 'CP-4',
      mode: 'standalone',
      generatedAt: '2026-05-26T19:30:00.000Z',
      overallHealth: 'ok',
      featureFlags: [
        {
          key: 'AURA_ENABLE_EXTERNAL_AI',
          enabled: false,
          governs: 'external_ai',
          defaultValue: false,
          disabledReason: 'External AI is disabled for synthetic CP-4 fixtures.'
        }
      ],
      logging: {
        structured: true,
        requestCorrelated: true,
        phiRedaction: 'forbidden_keys_and_obvious_text',
        sample: {
          service: 'aura-note-api',
          level: 'info',
          message: 'Synthetic support status checked',
          requestId: 'req-support-synthetic-001',
          traceId: 'trace-support-synthetic-001',
          eventName: 'support.status_checked',
          timestamp: '2026-05-26T19:30:00.000Z',
          payload: { status: 'ok' },
          redactedPaths: [],
          phiSafe: true
        }
      },
      retention: [
        {
          policyId: 'raw-audio-one-week',
          recordClass: 'audio_ephemeral',
          retentionRule: 'one_week',
          enforcedByJob: 'raw_audio_retention_candidate_scan',
          lastEvaluatedAt: '2026-05-26T19:30:00.000Z',
          candidateCount: 1,
          purgeEligibleCount: 0,
          destructivePurgeEnabled: false
        }
      ],
      auditExport: {
        enabled: true,
        downloadEnabled: false,
        format: 'jsonl',
        redactedByDefault: true
      },
      failureStates: [
        {
          component: 'external_ai',
          status: 'disabled',
          operatorMessage: 'External AI disabled.',
          safeDegradedMode: 'Use deterministic mock suggestions.'
        }
      ],
      ciRuntime: {
        nodeVersion: '20',
        pnpmVersion: '9.12.0',
        node20ActionWarningAcceptedUntil: 'WO-013'
      }
    },
    auditEvent: {
      auditEventId: 'audit-support-synthetic-001',
      tenantId: syntheticIds.tenantId,
      siteId: syntheticIds.siteId,
      actorUserId: 'user-support-synthetic-001',
      action: 'support.status_check',
      entityType: 'SupportStatus',
      entityId: 'cp4-hardening',
      traceId: 'trace-support-synthetic-001',
      createdAt: '2026-05-26T19:30:00.000Z'
    },
    ...overrides
  };
}

export function createSyntheticAuditExport(overrides: Partial<AuditExportResponseDto> = {}): AuditExportResponseDto {
  return {
    auditExport: {
      auditExportId: 'audit-export-synthetic-001',
      status: 'ready_synthetic',
      requestedByUserId: 'user-compliance-synthetic-001',
      requestedAt: '2026-05-26T19:35:00.000Z',
      traceId: 'trace-audit-export-synthetic-001',
      format: 'jsonl',
      includePhi: false,
      redacted: true,
      downloadEnabled: false,
      retentionClass: 'audit',
      recordCount: 1,
      records: [
        {
          auditEvent: {
            auditEventId: 'audit-export-record-synthetic-001',
            tenantId: syntheticIds.tenantId,
            siteId: syntheticIds.siteId,
            actorUserId: syntheticIds.clinicianId,
            action: 'export.generated',
            entityType: 'ExportArtifact',
            entityId: 'export-synthetic-001',
            traceId: 'trace-audit-export-synthetic-001',
            createdAt: '2026-05-26T19:35:00.000Z'
          },
          domainEventType: 'export.generated.v1',
          requestId: 'req-audit-export-synthetic-001',
          redactedPayload: { artifactType: 'final_note_pdf' },
          redactedPaths: []
        }
      ]
    },
    auditEvent: {
      auditEventId: 'audit-export-request-synthetic-001',
      tenantId: syntheticIds.tenantId,
      siteId: syntheticIds.siteId,
      actorUserId: 'user-compliance-synthetic-001',
      action: 'audit.export_request',
      entityType: 'AuditExport',
      entityId: 'audit-export-synthetic-001',
      traceId: 'trace-audit-export-synthetic-001',
      createdAt: '2026-05-26T19:35:00.000Z'
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
