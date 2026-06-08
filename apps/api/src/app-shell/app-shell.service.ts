import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import {
  createApiEnvelope,
  createEventEnvelope,
  type ActivityFeedItemDto,
  type ApiEnvelope,
  type AppShellCurrentUserDto,
  type AppShellNavItemDto,
  type AppShellRequiredPermissionDto,
  type AppShellResponseDto,
  type AppShellRouteStateDto,
  type AuditEventDto,
  type ClinicalWorkflowDashboardDto,
  type CoreEventType,
  type DashboardMetricDto,
  type DisabledFeatureStateDto,
  type NotificationDto,
  type ScheduleViewDto,
  type TaskWorklistViewDto,
  type AuraNoteEvent
} from '@aura-note/contracts';
import {
  canPerform,
  createSyntheticLocalSession,
  type AccessContext,
  type Permission,
  type Role
} from '@aura-note/security';
import { OperationsService } from '../operations/operations.service';
import { ScheduleService } from '../schedule/schedule.service';

const TENANT_ID = 'tenant-synthetic-primary';
const SITE_ID = 'site-synthetic-primary';
const APP_MODE = 'standalone' as const;

interface RequestContext {
  requestId: string;
  traceId: string;
  actorUserId: string;
  access: AccessContext;
  idempotencyKey?: string;
}

@Injectable()
export class AppShellService {
  private sequence = 1;

  constructor(
    @Inject(ScheduleService)
    private readonly scheduleService: ScheduleService,
    @Inject(OperationsService)
    private readonly operationsService: OperationsService
  ) {}

  getAppShell(headers: Record<string, string | string[] | undefined>): ApiEnvelope<AppShellResponseDto> {
    const context = this.createRequestContext(headers);
    this.assertTenantScope(context);

    const schedule = this.getScheduleIfAllowed(context);
    const drafts = this.getDraftsIfAllowed(context);
    const finalized = this.getFinalizedIfAllowed(context);
    const tasks = this.getTasksIfAllowed(context);

    const navigation = this.createNavigation(context.access, schedule, drafts, finalized, tasks);
    const notifications = this.createNotifications(tasks, navigation);
    const activity = this.createActivity(context, schedule);
    const dashboard = this.createDashboard(schedule, drafts, finalized, tasks, notifications);

    return createApiEnvelope(
      {
        appShell: {
          currentUser: this.createCurrentUser(context),
          navigation,
          notifications,
          activity,
          dashboard,
          layoutPreference: {
            preferenceId: 'layout-pref-local-transient',
            sidebarDefaultCollapsed: false,
            persisted: false,
            storageMode: 'transient_ui_only',
            updatedAt: dashboard.generatedAt
          },
          routeStates: dashboard.requiredUiStates,
          localReactStateLimit: 'transient_controls_only',
          productName: 'AURA Note',
          rejectedPrototypeBackend: 'supabase',
          revenuePilotBrandingAccepted: false,
          supabaseBackendAccepted: false,
          patientFacingRevenueExposed: false
        },
        auditEvent: this.createAuditEvent('app_shell.view', 'AppShell', 'aura-note-runtime-shell', context),
        domainEvents: [
          this.createDomainEvent('audit.event_recorded.v1', context, {
            action: 'app_shell.view',
            routeCount: navigation.length,
            notificationCount: notifications.length,
            productionLaunchApproved: false
          })
        ]
      },
      this.createMeta(context)
    );
  }

  createRequestContext(headers: Record<string, string | string[] | undefined>): RequestContext {
    const session = createSyntheticLocalSession(headers, {
      defaultTenantId: TENANT_ID,
      defaultSiteId: SITE_ID,
      requestId: 'req-app-shell',
      traceId: 'trace-app-shell',
      defaultLinkedToPatient: (role) => role !== 'support' && role !== 'service_account',
      defaultLinkedToVisit: (role) => role === 'clinician' || role === 'ma' || role === 'billing_staff',
      defaultBillingReviewTriggered: false,
      userIdForRole: (role) => `user-${role}-synthetic-app-shell`
    });
    if (!session.tenantScopeAllowed) {
      throw new ForbiddenException(session.denialReason ?? 'tenant scope denied');
    }
    return {
      requestId: session.requestId,
      traceId: session.traceId,
      actorUserId: session.actorUserId,
      access: session.access,
      ...(session.idempotencyKey ? { idempotencyKey: session.idempotencyKey } : {})
    };
  }

  private getScheduleIfAllowed(context: RequestContext): ScheduleViewDto | undefined {
    if (!canPerform('schedule:view', context.access)) return undefined;
    return this.scheduleService.listAppointments(context).data;
  }

  private getDraftsIfAllowed(context: RequestContext) {
    if (!canPerform('draft_note:view', context.access)) return undefined;
    return this.scheduleService.listDraftNotes(context).data;
  }

  private getFinalizedIfAllowed(context: RequestContext) {
    if (!canPerform('final_note:view', context.access)) return undefined;
    return this.scheduleService.listFinalizedNotes(context).data;
  }

  private getTasksIfAllowed(context: RequestContext): TaskWorklistViewDto | undefined {
    if (!canPerform('task:view', context.access)) return undefined;
    return this.operationsService.listTasks(context).data;
  }

  private createNavigation(
    access: AccessContext,
    schedule?: ScheduleViewDto,
    drafts?: { notes: unknown[] },
    finalized?: { notes: unknown[] },
    tasks?: TaskWorklistViewDto
  ): AppShellNavItemDto[] {
    const workspaceHref = schedule?.appointments[0]?.appointmentId
      ? `/aura-note/workspace/${schedule.appointments[0].appointmentId}`
      : '/aura-note/drafts';
    return [
      this.nav('dashboard', 'Dashboard', '/aura-note', 'schedule:view', access, 0),
      this.nav('schedule', 'Schedule', '/aura-note/schedule', 'schedule:view', access, schedule?.appointments.length ?? 0),
      this.nav('drafts', 'Draft Notes', '/aura-note/drafts', 'draft_note:view', access, drafts?.notes.length ?? 0),
      this.nav('workspace', 'Workspace', workspaceHref, 'draft_note:view', access, drafts?.notes.length ?? 0),
      this.nav('finalized', 'Finalized Notes', '/aura-note/finalized', 'final_note:view', access, finalized?.notes.length ?? 0, 'Read only'),
      this.nav('operations', 'Tasks', '/aura-note/operations', 'task:view', access, tasks?.counts.total ?? 0),
      this.nav('platform', 'Settings', '/aura-note/platform', 'config:view', access, 0),
      this.nav('ehr', 'EHR', '/aura-note/integrations/ehr', 'ehr_adapter:view', access, 0, 'Disabled'),
      this.nav('clinicos', 'ClinicOS', '/aura-note/integrations/clinicos', 'clinicos_adapter:view', access, 0, 'Adapter'),
      this.nav('ai_governance', 'AI Governance', '/aura-note/ai-governance', 'ai_governance:view', access, 0, 'Gated'),
      this.nav('coaching', 'Coaching', '/aura-note/coaching', 'coaching_own:view', access, 0),
      this.nav('support', 'Support', '/aura-note/support/status', 'support_status:view', access, 0),
      this.nav('runtime_integration', 'Runtime Gate', '/aura-note/runtime-integration', 'schedule:view', access, 0),
      this.nav('figma_handoff', 'Figma Handoff', '/aura-note/figma-handoff', 'schedule:view', access, 0, 'Design')
    ];
  }

  private nav(
    key: AppShellNavItemDto['key'],
    label: string,
    href: string,
    requiredPermission: AppShellRequiredPermissionDto,
    access: AccessContext,
    itemCount: number,
    badgeLabel?: string
  ): AppShellNavItemDto {
    const allowed = canPerform(requiredPermission as Permission, access);
    const disabledLiveFeature = ['ehr', 'ai_governance'].includes(key);
    return {
      key,
      label,
      href,
      requiredPermission,
      state: allowed ? (disabledLiveFeature ? 'degraded' : 'ready') : 'permission-denied',
      itemCount: allowed ? itemCount : 0,
      ...(badgeLabel ? { badgeLabel } : {}),
      ...(!allowed ? { disabledReason: `Role ${access.role} cannot perform ${requiredPermission}.` } : {})
    };
  }

  private createCurrentUser(context: RequestContext): AppShellCurrentUserDto {
    const role = context.access.role as Role;
    return {
      userId: context.actorUserId,
      displayName: this.roleLabel(role),
      role,
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      identityProvider: 'local_synthetic',
      purposeOfUse: context.access.purposeOfUse ?? 'treatment',
      localSyntheticOnly: true
    };
  }

  private createNotifications(tasks: TaskWorklistViewDto | undefined, navigation: AppShellNavItemDto[]): NotificationDto[] {
    const blockerCount = tasks?.counts.blockers ?? 0;
    const permissionDeniedCount = navigation.filter((item) => item.state === 'permission-denied').length;
    const now = new Date().toISOString();
    return [
      ...(blockerCount > 0
        ? [
            {
              notificationId: 'notif-blocker-tasks',
              category: 'task',
              title: 'Open blocker tasks',
              body: `${blockerCount} synthetic task blocks finalization preparation until reviewed.`,
              severity: 'warning',
              read: false,
              linkedRoute: '/aura-note/operations',
              patientFacingExcluded: true,
              metadataOnly: true,
              createdAt: now
            } satisfies NotificationDto
          ]
        : []),
      {
        notificationId: 'notif-live-vendors-disabled',
        category: 'disabled_feature',
        title: 'Live vendor actions disabled',
        body: 'EHR writeback, live transcription, live external AI, patient portal delivery, and claim submission remain gated.',
        severity: 'info',
        read: false,
        linkedRoute: '/aura-note/runtime-integration',
        patientFacingExcluded: true,
        metadataOnly: true,
        createdAt: now
      },
      ...(permissionDeniedCount > 0
        ? [
            {
              notificationId: 'notif-role-scoped-nav',
              category: 'system',
              title: 'Role-scoped navigation',
              body: `${permissionDeniedCount} shell surfaces are hidden or permission-denied for this role.`,
              severity: 'info',
              read: true,
              patientFacingExcluded: true,
              metadataOnly: true,
              createdAt: now
            } satisfies NotificationDto
          ]
        : [])
    ];
  }

  private createActivity(context: RequestContext, schedule?: ScheduleViewDto): ActivityFeedItemDto[] {
    const now = new Date().toISOString();
    return [
      {
        activityId: 'activity-app-shell-viewed',
        category: 'governance',
        label: 'App shell composed from typed API state',
        detail: `Trace ${context.traceId} rendered AURA Note shell without prototype-local authoritative state.`,
        actorLabel: this.roleLabel(context.access.role),
        route: '/aura-note',
        metadataOnly: true,
        patientFacingExcluded: true,
        occurredAt: now
      },
      ...(schedule?.appointments[0]
        ? [
            {
              activityId: 'activity-next-appointment-ready',
              category: 'appointment',
              label: 'Next synthetic appointment available',
              detail: `${schedule.appointments[0].safePatientId} is ready for Start Visit handoff.`,
              actorLabel: 'AURA Note API',
              route: `/aura-note/workspace/${schedule.appointments[0].appointmentId}`,
              metadataOnly: true,
              patientFacingExcluded: true,
              occurredAt: now
            } satisfies ActivityFeedItemDto
          ]
        : [])
    ];
  }

  private createDashboard(
    schedule: ScheduleViewDto | undefined,
    drafts: { notes: unknown[] } | undefined,
    finalized: { notes: unknown[] } | undefined,
    tasks: TaskWorklistViewDto | undefined,
    notifications: NotificationDto[]
  ): ClinicalWorkflowDashboardDto {
    const disabledFeatureStates: DisabledFeatureStateDto[] = [
      { feature: 'live_ehr_writeback', state: 'disabled', reason: 'Human approval and live EHR credentials are not enabled.' },
      { feature: 'live_transcription_vendor', state: 'mock_only', reason: 'Browser/live provider streaming remains governed and disabled.' },
      { feature: 'live_external_ai', state: 'disabled', reason: 'No raw PHI may be sent to external AI; gateway remains governed.' },
      { feature: 'patient_portal_delivery', state: 'gated', reason: 'Patient portal integration is not approved.' },
      { feature: 'claim_submission', state: 'disabled', reason: 'Draft claim preview stays submittedClaim=false.' },
      { feature: 'autonomous_finalization', state: 'disabled', reason: 'Clinical, coding, and billing outputs require human review.' },
      { feature: 'public_object_url', state: 'disabled', reason: 'Downloads are server-mediated metadata only.' },
      { feature: 'supabase_backend', state: 'disabled', reason: 'Figma prototype backend is rejected; Nest/Prisma contracts stay authoritative.' }
    ];
    const metrics: DashboardMetricDto[] = [
      this.metric('appointments-today', 'Today schedule', schedule?.appointments.length ?? 'permission-denied', 'count', '/aura-note/schedule', schedule),
      this.metric('draft-notes', 'Draft notes', drafts?.notes.length ?? 'permission-denied', 'count', '/aura-note/drafts', drafts),
      this.metric('finalized-notes', 'Finalized notes', finalized?.notes.length ?? 'permission-denied', 'count', '/aura-note/finalized', finalized),
      this.metric('blocker-tasks', 'Blockers', tasks?.counts.blockers ?? 'permission-denied', 'count', '/aura-note/operations', tasks),
      {
        metricId: 'notifications-unread',
        label: 'Unread notifications',
        value: notifications.filter((notification) => !notification.read).length,
        unit: 'count',
        route: '/aura-note',
        state: 'ready',
        patientFacingExcluded: true
      },
      {
        metricId: 'internal-revenue',
        label: 'Internal revenue estimates',
        value: 'unavailable_caveated',
        unit: 'status',
        route: '/aura-note/operations',
        state: 'disabled',
        patientFacingExcluded: true
      }
    ];

    return {
      dashboardId: 'clinical-workflow-dashboard-synthetic',
      generatedAt: new Date().toISOString(),
      dataSource: 'typed_api_client_composite',
      productionLaunchApproved: false,
      liveVendorActionsEnabled: false,
      submittedClaim: false,
      internalRevenueMetricsVisible: false,
      internalRevenueMetricLabel: 'unavailable_caveated',
      metrics,
      disabledFeatureStates,
      requiredUiStates: ['loading', 'empty', 'ready', 'saving', 'failed', 'permission-denied', 'read-only', 'blocked', 'degraded', 'disabled', 'demo fixture']
    };
  }

  private metric(
    metricId: string,
    label: string,
    value: number | string,
    unit: DashboardMetricDto['unit'],
    route: string,
    source: unknown
  ): DashboardMetricDto {
    return {
      metricId,
      label,
      value,
      route,
      state: source ? 'ready' : 'permission-denied',
      patientFacingExcluded: true,
      ...(unit ? { unit } : {})
    };
  }

  private assertTenantScope(context: RequestContext): void {
    if (context.access.tenantId !== TENANT_ID || context.access.siteId !== SITE_ID) {
      throw new ForbiddenException('cross-tenant or cross-site access denied');
    }
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

  private createDomainEvent(
    eventType: CoreEventType,
    context: RequestContext,
    payload: Record<string, unknown>
  ): AuraNoteEvent<Record<string, unknown>> {
    return createEventEnvelope({
      eventId: this.nextId('evt'),
      eventType,
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      producer: 'aura-note-api',
      traceId: context.traceId,
      idempotencyKey: context.idempotencyKey ?? `${context.requestId}:${eventType}`,
      sensitivity: 'non_phi',
      retentionClass: 'audit',
      payload
    });
  }

  private createMeta(context: RequestContext) {
    return {
      requestId: context.requestId,
      traceId: context.traceId,
      mode: APP_MODE,
      generatedAt: new Date().toISOString()
    };
  }

  private roleLabel(role: Role | undefined): string {
    if (!role) return 'AURA Note user';
    return role
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private nextId(prefix: string): string {
    const value = `${prefix}-${String(this.sequence).padStart(4, '0')}`;
    this.sequence += 1;
    return value;
  }
}
