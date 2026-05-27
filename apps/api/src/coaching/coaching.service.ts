import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  buildCoachingDashboardProjection,
  buildOwnCoachingReport,
  validateCoachingSignal,
  type CoachingSignal,
  type CoachingVisibilityMode
} from '@aura-note/domain';
import {
  createApiEnvelope,
  createEventEnvelope,
  type ApiEnvelope,
  type ApiMeta,
  type AuditEventDto,
  type CoachingDashboardDto,
  type CoachingReportDto,
  type CoachingSignalDto
} from '@aura-note/contracts';
import { canPerform, createSyntheticLocalSession, type AccessContext } from '@aura-note/security';

const TENANT_ID = 'tenant-synthetic-primary';
const SITE_ID = 'site-synthetic-primary';
const APP_MODE = 'standalone' as const;
const SYNTHETIC_CLINICIAN_ID = 'user-clinician-synthetic-001';
const SYNTHETIC_NOTE_ID = 'note-synthetic-001';

interface RequestContext {
  requestId: string;
  traceId: string;
  actorUserId: string;
  access: AccessContext;
  idempotencyKey?: string;
}

@Injectable()
export class CoachingService {
  private sequence = 1;

  getOwnCoaching(headers: Record<string, string | string[] | undefined>): ApiEnvelope<CoachingReportDto> {
    const context = this.createRequestContext(headers, { ownCoachingReport: true });
    if (!canPerform('coaching_own:view', context.access)) {
      throw new ForbiddenException('role cannot view clinician coaching report');
    }

    const recordingExceptionApproved = this.parseBooleanHeader(
      this.headerValue(headers['x-aura-recording-exception-approved'])
    ) ?? false;
    const signals = this.syntheticSignals();
    const report = buildOwnCoachingReport({
      reportId: 'coach-report-synthetic-001',
      clinicianId: SYNTHETIC_CLINICIAN_ID,
      noteId: SYNTHETIC_NOTE_ID,
      generatedAt: '2026-05-26T18:45:00.000Z',
      signals,
      recordingExceptionApproved
    });

    return createApiEnvelope(
      {
        ...report,
        signals: report.signals.map((signal) => this.toSignalDto(signal, true)),
        privacyLabel: 'own_clinician_only',
        auditEvent: this.createAuditEvent('coaching.view_own', 'CoachingReport', report.reportId, context),
        domainEvents: [
          createEventEnvelope({
            eventId: this.nextId('evt'),
            eventType: 'coaching.report_generated.v1',
            tenantId: TENANT_ID,
            siteId: SITE_ID,
            noteId: report.noteId,
            producer: 'aura-note-api',
            traceId: context.traceId,
            idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
            sensitivity: 'restricted',
            retentionClass: 'audit',
            payload: {
              reportId: report.reportId,
              clinicianId: report.clinicianId,
              signalCount: report.signals.length,
              patientFacingExcluded: true
            }
          })
        ]
      },
      this.createMeta(context)
    );
  }

  getDashboard(
    headers: Record<string, string | string[] | undefined>,
    visibilityMode: CoachingVisibilityMode = 'aggregate_only'
  ): ApiEnvelope<CoachingDashboardDto> {
    const context = this.createRequestContext(headers);
    if (!canPerform('coaching_dashboard:view', context.access)) {
      throw new ForbiddenException('role cannot view coaching dashboard');
    }

    const safeVisibilityMode: CoachingVisibilityMode =
      visibilityMode === 'full_admin' || visibilityMode === 'aggregate_only' ? visibilityMode : 'aggregate_only';
    const dashboard = buildCoachingDashboardProjection({
      dashboardId: 'coach-dashboard-synthetic-001',
      visibilityMode: safeVisibilityMode,
      generatedAt: '2026-05-26T18:50:00.000Z',
      signals: this.syntheticSignals()
    });

    return createApiEnvelope(
      {
        ...dashboard,
        roiSignals: {
          timeSavedMinutes: 42,
          revenueCapturedLabel: 'internal_only_not_patient_facing',
          denialsReducedCount: 1,
          trainingImprovementItems: 3
        },
        privacyLabel: dashboard.aggregateOnly ? 'aggregate_only' : 'admin_dashboard',
        auditEvent: this.createAuditEvent('coaching.dashboard_view', 'CoachingDashboard', dashboard.dashboardId, context),
        domainEvents: [
          createEventEnvelope({
            eventId: this.nextId('evt'),
            eventType: 'coaching.dashboard_viewed.v1',
            tenantId: TENANT_ID,
            siteId: SITE_ID,
            producer: 'aura-note-api',
            traceId: context.traceId,
            idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
            sensitivity: 'restricted',
            retentionClass: 'audit',
            payload: {
              dashboardId: dashboard.dashboardId,
              visibilityMode: dashboard.visibilityMode,
              aggregateOnly: dashboard.aggregateOnly,
              providerCount: dashboard.providerCount
            }
          })
        ]
      },
      this.createMeta(context)
    );
  }

  private syntheticSignals(): CoachingSignal[] {
    const generatedAt = '2026-05-26T18:40:00.000Z';
    const signals: CoachingSignal[] = [
      {
        coachingSignalId: 'coach-signal-synthetic-001',
        noteId: SYNTHETIC_NOTE_ID,
        clinicianId: SYNTHETIC_CLINICIAN_ID,
        category: 'documentation_completeness',
        score: 86,
        title: 'Problem-specific assessment linked to plan',
        detail: 'Synthetic signal shows the assessment and plan stay paired by problem.',
        evidenceIds: ['evidence-final-note-synthetic-001'],
        improvementPrompt: 'Keep plans grouped under the related assessment item.',
        billingRelated: false,
        patientFacingExcluded: true,
        generatedAt
      },
      {
        coachingSignalId: 'coach-signal-synthetic-002',
        noteId: SYNTHETIC_NOTE_ID,
        clinicianId: SYNTHETIC_CLINICIAN_ID,
        category: 'em_justification',
        score: 74,
        title: 'E/M support needs concise risk detail',
        detail: 'Synthetic signal flags a missing MDM risk sentence for the selected level.',
        evidenceIds: ['evidence-draft-claim-synthetic-001'],
        improvementPrompt: 'Add a brief MDM risk rationale when selected E/M support depends on risk.',
        billingRelated: true,
        patientFacingExcluded: true,
        generatedAt
      },
      {
        coachingSignalId: 'coach-signal-synthetic-003',
        noteId: 'note-synthetic-002',
        clinicianId: 'user-clinician-synthetic-002',
        category: 'patient_voice_fidelity',
        score: 91,
        title: 'Patient concern retained in plan',
        detail: 'Synthetic signal shows the patient-stated concern remains visible in the plan.',
        evidenceIds: ['evidence-transcript-synthetic-002'],
        improvementPrompt: 'Continue preserving patient-stated goals in the final note.',
        billingRelated: false,
        patientFacingExcluded: true,
        generatedAt
      }
    ];

    const invalid = signals.flatMap((signal) => validateCoachingSignal(signal));
    if (invalid.length > 0) {
      throw new Error(`synthetic coaching signals are invalid: ${invalid.join(', ')}`);
    }
    return signals;
  }

  private toSignalDto(signal: CoachingSignal, includeClinicianId: boolean): CoachingSignalDto {
    return {
      coachingSignalId: signal.coachingSignalId,
      noteId: signal.noteId,
      ...(includeClinicianId ? { clinicianId: signal.clinicianId } : {}),
      category: signal.category,
      score: signal.score,
      title: signal.title,
      detail: signal.detail,
      evidenceIds: signal.evidenceIds,
      improvementPrompt: signal.improvementPrompt,
      billingRelated: signal.billingRelated,
      patientFacingExcluded: true,
      generatedAt: signal.generatedAt
    };
  }

  createRequestContext(
    headers: Record<string, string | string[] | undefined>,
    overrides: Partial<AccessContext> = {}
  ): RequestContext {
    const session = createSyntheticLocalSession(headers, {
      defaultTenantId: TENANT_ID,
      defaultSiteId: SITE_ID,
      requestId: this.nextId('req'),
      traceId: this.nextId('trace'),
      defaultLinkedToPatient: (role) => role !== 'billing_staff',
      defaultLinkedToVisit: (role) => role === 'clinician',
      userIdForRole: (role) => (role === 'clinician' ? SYNTHETIC_CLINICIAN_ID : `synthetic-${role}`),
      overrides
    });

    if (!session.tenantScopeAllowed) {
      throw new ForbiddenException(session.denialReason ?? 'tenant access denied');
    }

    const requestContext: RequestContext = {
      requestId: session.requestId,
      traceId: session.traceId,
      actorUserId: session.actorUserId,
      access: session.access
    };

    if (session.idempotencyKey) {
      requestContext.idempotencyKey = session.idempotencyKey;
    }

    return requestContext;
  }

  private createAuditEvent(action: string, entityType: string, entityId: string, context: RequestContext): AuditEventDto {
    return {
      auditEventId: this.nextId('audit'),
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      actorUserId: context.actorUserId,
      action,
      entityType,
      entityId,
      traceId: context.traceId,
      createdAt: new Date().toISOString()
    };
  }

  private createMeta(context: RequestContext): ApiMeta {
    return {
      requestId: context.requestId,
      traceId: context.traceId,
      mode: APP_MODE,
      generatedAt: new Date().toISOString()
    };
  }

  private headerValue(value: string | string[] | undefined): string | undefined {
    return Array.isArray(value) ? value[0] : value;
  }

  private parseBooleanHeader(value: string | undefined): boolean | undefined {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  }

  private nextId(prefix: string): string {
    const id = `${prefix}-${this.sequence.toString().padStart(4, '0')}`;
    this.sequence += 1;
    return id;
  }
}
