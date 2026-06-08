import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  createApiEnvelope,
  createEventEnvelope,
  type ApiEnvelope,
  type AuditEventDto,
  type BillingReviewQueueItemDto,
  type BillingReviewQueueViewDto,
  type CoreEventType,
  type CreateTemplateRequestDto,
  type DotPhraseDto,
  type EstimateConfigurationDto,
  type IntegrationConnectionDto,
  type OperationalActionResponseDto,
  type OperationalTaskDto,
  type OperationsRuntimeResponseDto,
  type OperationsRuntimeViewDto,
  type PublishRulesCatalogRequestDto,
  type RulesCatalogEntryDto,
  type RulesCatalogViewDto,
  type SettingsAdminViewDto,
  type TaskWorklistViewDto,
  type TemplateManagementDto,
  type TemplatesViewDto,
  type UpdateBillingReviewRequestDto,
  type UpdateDotPhraseRequestDto,
  type UpdateEstimateConfigurationRequestDto,
  type UpdateIntegrationRequestDto,
  type UpdateOperationalTaskRequestDto,
  type AuraNoteEvent
} from '@aura-note/contracts';
import {
  canAccessBillingTranscriptForReview,
  estimateConfigurationIsSafe,
  rulesCatalogEntryIsSafe,
  validateDotPhrase,
  validateTemplateDefinition
} from '@aura-note/domain';
import { canPerform, createSyntheticLocalSession, scanForForbiddenPhiKeys, scanForForbiddenPhiText, type AccessContext } from '@aura-note/security';

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
export class OperationsService {
  private sequence = 1;

  private readonly tasks: OperationalTaskDto[] = [
    {
      taskId: 'task-ma-gap-001',
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      noteId: 'note-demo-001',
      appointmentId: 'appt-demo-001',
      safePatientId: 'safe-patient-demo-001',
      patientDisplayLabel: 'Standalone safe-patient-demo-001',
      title: 'Clarify home BP readings for HCC support',
      blocksSigning: true,
      adjudicationStatus: 'open',
      ownerRole: 'ma',
      dueAt: '2026-05-28T14:00:00.000Z',
      priority: 'urgent',
      worklist: 'ma_follow_up',
      source: 'history_gap',
      demoFixture: true
    },
    {
      taskId: 'task-clinician-plan-001',
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      noteId: 'note-demo-002',
      appointmentId: 'appt-demo-002',
      safePatientId: 'safe-patient-new-002',
      patientDisplayLabel: 'Standalone safe-patient-new-002',
      title: 'Review plan item evidence before finalization prep',
      blocksSigning: false,
      adjudicationStatus: 'assigned',
      ownerRole: 'clinician',
      dueAt: '2026-05-29T16:00:00.000Z',
      priority: 'routine',
      worklist: 'task_inbox',
      source: 'manual_synthetic',
      demoFixture: true
    }
  ];

  private readonly billingReviews: BillingReviewQueueItemDto[] = [
    {
      billingReviewId: 'billing-review-demo-001',
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      noteId: 'note-demo-finalized-001',
      safePatientId: 'safe-patient-demo-001',
      draftClaimPreviewId: 'draft-claim-demo-001',
      status: 'triggered',
      transcriptAccess: 'denied',
      transcriptAccessReason: 'Transcript access requires billing_staff role, linked visit, and triggered billing review context.',
      draftClaimPreview: {
        draftClaimPreviewId: 'draft-claim-demo-001',
        noteId: 'note-demo-finalized-001',
        status: 'draft_preview',
        claimReadiness: 'needs_billing_review',
        patientReference: 'safe-patient-demo-001',
        encounterDate: '2026-05-27',
        renderingClinicianId: 'clinician-demo-001',
        placeOfService: '11',
        visitType: 'AWV plus problem',
        cptCandidates: ['99214'],
        hcpcsCandidates: ['G0439'],
        icd10Candidates: ['I10'],
        emCandidate: 'moderate',
        diagnosisToServiceLinks: ['I10 -> 99214 candidate support'],
        payerReadableJustification: 'Synthetic payer-readable support only; human billing review is required.',
        missingEvidence: ['Confirm medication reconciliation detail before final billing review.'],
        denialRiskFlags: ['Transcript access is limited to the triggered billing review context.'],
        estimateStatus: 'unavailable_caveated',
        estimateCaveat: 'Internal estimate support is not a patient-facing financial conclusion.',
        billingReviewTriggered: true,
        submittedClaim: false
      },
      assignedRole: 'billing_staff',
      dueAt: '2026-05-28T20:00:00.000Z',
      submittedClaim: false
    }
  ];

  private readonly templates: TemplateManagementDto[] = [
    {
      templateId: 'template-primary-care-follow-up',
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      name: 'Primary Care Follow-Up',
      visitType: 'Chronic follow-up',
      sections: ['Subjective', 'Objective', 'Assessment', 'Plan'],
      variables: ['{{chief_concern}}', '{{follow_up_interval}}'],
      status: 'active',
      syntheticOnly: true
    }
  ];

  private readonly dotPhrases: DotPhraseDto[] = [
    {
      dotPhraseId: 'dotphrase-awv-counseling',
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      trigger: '.awvplan',
      expansion: 'Reviewed preventive care plan and follow-up interval {{follow_up_interval}}.',
      variables: ['{{follow_up_interval}}'],
      smartPhrasePlaceholders: ['{{follow_up_interval}}'],
      status: 'active',
      syntheticOnly: true
    }
  ];

  private estimateConfig: EstimateConfigurationDto = {
    estimateConfigId: 'estimate-config-primary',
    tenantId: TENANT_ID,
    siteId: SITE_ID,
    internalEstimatesEnabled: true,
    patientFacingEstimatesEnabled: false,
    sourceDataConfigured: false,
    caveatText: 'Internal estimate support is not a patient-facing financial conclusion.',
    updatedAt: '2026-05-27T22:55:00.000Z',
    syntheticOnly: true
  };

  private readonly rulesCatalog: RulesCatalogEntryDto[] = [
    {
      ruleId: 'rule-cpt-99214-source-evidence',
      category: 'cpt',
      codeOrKey: '99214',
      title: 'Office/outpatient established visit candidate support',
      sourceEvidence: ['synthetic-rules-catalog:v1', 'human-review-required'],
      effectiveDate: '2026-05-27',
      status: 'draft',
      humanReviewRequired: true,
      autonomousFinalizationAllowed: false,
      medicalNecessityDeterminationAllowed: false
    },
    {
      ruleId: 'rule-confidence-diagnosis-threshold',
      category: 'confidence_threshold',
      codeOrKey: 'diagnosis-low-confidence-0.75',
      title: 'Diagnosis suggestions below 75 percent require override metadata',
      sourceEvidence: ['WO-001 low-confidence diagnosis threshold', 'human-review-required'],
      effectiveDate: '2026-05-27',
      status: 'active',
      humanReviewRequired: true,
      autonomousFinalizationAllowed: false,
      medicalNecessityDeterminationAllowed: false
    }
  ];

  private readonly integrations: IntegrationConnectionDto[] = [
    {
      integrationId: 'integration-athenahealth',
      vendor: 'athenahealth',
      status: 'disabled',
      configured: false,
      liveCredentialPresent: false,
      mode: 'mock_adapter'
    },
    {
      integrationId: 'integration-clinicos',
      vendor: 'clinicos',
      status: 'not_configured',
      configured: false,
      liveCredentialPresent: false,
      mode: 'standalone_local'
    }
  ];

  listTasks(context: RequestContext): ApiEnvelope<TaskWorklistViewDto> {
    this.assertTenantScope(context);
    if (!canPerform('task:view', context.access)) {
      throw new ForbiddenException('role cannot view standalone worklists');
    }

    const tasks = this.tasks.filter((task) => this.canSeeTask(task, context.access));
    return createApiEnvelope(
      {
        tasks,
        counts: {
          total: tasks.length,
          blockers: tasks.filter((task) => task.blocksSigning).length,
          maFollowUp: tasks.filter((task) => task.worklist === 'ma_follow_up').length,
          overdue: 0
        },
        states: ['empty', 'loading', 'ready', 'saving', 'blocked', 'failed', 'permission-denied', 'read-only', 'demo fixture']
      },
      this.createMeta(context)
    );
  }

  getOperationsRuntime(context: RequestContext): ApiEnvelope<OperationsRuntimeResponseDto> {
    this.assertTenantScope(context);
    if (!canPerform('task:view', context.access) && !canPerform('settings:view', context.access)) {
      throw new ForbiddenException('role cannot view operations runtime');
    }

    const tasks = canPerform('task:view', context.access) ? this.listTasks(context).data : undefined;
    const billing =
      canPerform('billing_review:view', context.access) && context.access.role !== 'support'
        ? this.listBillingReviews(context).data
        : undefined;
    const settings = canPerform('settings:view', context.access) ? this.getSettings(context).data : undefined;
    const templates = canPerform('template:manage', context.access) ? this.listTemplates(context).data : undefined;
    const estimate =
      canPerform('settings:view', context.access) || canPerform('billing_review:view', context.access)
        ? this.getEstimateConfig(context).data
        : undefined;
    const rules = canPerform('rules_catalog:view', context.access) ? this.listRulesCatalog(context).data : undefined;

    const operationsRuntime = this.createOperationsRuntime(context, {
      tasks,
      billing,
      settings,
      templates,
      estimate,
      rules
    });

    return createApiEnvelope(
      {
        operationsRuntime,
        auditEvent: this.createAuditEvent('operations.runtime_view', 'OperationsRuntime', operationsRuntime.runtimeId, context),
        domainEvents: [
          this.createDomainEvent('operational.readiness_checked.v1', context, {
            runtimeId: operationsRuntime.runtimeId,
            analyticsSeriesCount: operationsRuntime.analytics.series.length,
            productionAnalyticsVendorEnabled: false,
            submittedClaim: false
          }),
          this.createDomainEvent('audit.event_recorded.v1', context, {
            action: 'operations.runtime_view',
            metadataOnly: true,
            patientFacingRevenueExposed: false
          })
        ]
      },
      this.createMeta(context)
    );
  }

  updateTask(taskId: string, request: UpdateOperationalTaskRequestDto, context: RequestContext): ApiEnvelope<OperationalActionResponseDto> {
    this.assertTenantScope(context);
    if (!canPerform('task:update', context.access)) {
      throw new ForbiddenException('role cannot update standalone worklist tasks');
    }
    const task = this.getTask(taskId);
    if (!this.canUpdateTask(task, context.access)) {
      throw new ForbiddenException('role cannot update this task owner scope');
    }
    if (request.resolutionNote && this.hasPhi(request.resolutionNote)) {
      throw new BadRequestException('task resolution note must not contain obvious PHI');
    }

    task.adjudicationStatus = request.adjudicationStatus;
    if (request.blocksSigning !== undefined) {
      task.blocksSigning = request.blocksSigning;
    }

    return createApiEnvelope(
      {
        task,
        auditEvent: this.createAuditEvent('task.adjudicate', 'Task', task.taskId, context),
        domainEvents: [
          this.createDomainEvent('task.adjudicated.v1', context, { taskId: task.taskId, adjudicationStatus: task.adjudicationStatus }),
          ...(request.blocksSigning !== undefined
            ? [this.createDomainEvent('task.blocker_changed.v1', context, { taskId: task.taskId, blocksSigning: task.blocksSigning })]
            : [])
        ]
      },
      this.createMeta(context)
    );
  }

  listBillingReviews(context: RequestContext): ApiEnvelope<BillingReviewQueueViewDto> {
    this.assertTenantScope(context);
    if (!canPerform('billing_review:view', context.access)) {
      throw new ForbiddenException('role cannot view billing review queue');
    }
    if (context.access.role === 'support') {
      throw new ForbiddenException('support users cannot access billing review');
    }

    return createApiEnvelope(
      {
        items: this.billingReviews.map((item) => this.withTranscriptAccessDecision(item, context.access)),
        transcriptAccessLimitedToTriggeredReview: true,
        supportUsersDenied: true
      },
      this.createMeta(context)
    );
  }

  updateBillingReview(
    billingReviewId: string,
    request: UpdateBillingReviewRequestDto,
    context: RequestContext
  ): ApiEnvelope<OperationalActionResponseDto> {
    this.assertTenantScope(context);
    if (!canPerform('billing_review:update', context.access)) {
      throw new ForbiddenException('role cannot update billing review queue');
    }
    if (request.noteForClinician && this.hasPhi(request.noteForClinician)) {
      throw new BadRequestException('billing review notes must not contain obvious PHI');
    }
    const item = this.getBillingReview(billingReviewId);
    item.status = request.status;
    const updated = this.withTranscriptAccessDecision(item, {
      ...context.access,
      billingReviewTriggered: Boolean(request.requestTranscriptAccess) || context.access.billingReviewTriggered
    });
    item.transcriptAccess = updated.transcriptAccess;
    item.transcriptAccessReason = updated.transcriptAccessReason;

    return createApiEnvelope(
      {
        billingReview: updated,
        auditEvent: this.createAuditEvent('billing_review.update', 'BillingReview', item.billingReviewId, context),
        domainEvents: [
          this.createDomainEvent('billing_review.status_changed.v1', context, {
            billingReviewId: item.billingReviewId,
            status: item.status,
            transcriptAccess: item.transcriptAccess
          })
        ]
      },
      this.createMeta(context)
    );
  }

  getSettings(context: RequestContext): ApiEnvelope<SettingsAdminViewDto> {
    this.assertTenantScope(context);
    if (!canPerform('settings:view', context.access)) {
      throw new ForbiddenException('role cannot view settings/admin center');
    }
    return createApiEnvelope(this.createSettingsView(), this.createMeta(context));
  }

  updateIntegration(
    integrationId: string,
    request: UpdateIntegrationRequestDto,
    context: RequestContext
  ): ApiEnvelope<OperationalActionResponseDto> {
    this.assertTenantScope(context);
    if (!canPerform('settings:manage', context.access)) {
      throw new ForbiddenException('role cannot manage integrations');
    }
    if (!request.reason.trim()) {
      throw new BadRequestException('integration update reason is required');
    }
    const integration = this.integrations.find((candidate) => candidate.integrationId === integrationId);
    if (!integration) {
      throw new NotFoundException('integration not found');
    }
    integration.status = request.status;
    integration.configured = request.status === 'mock_ready';

    return createApiEnvelope(
      {
        settings: this.createSettingsView(),
        auditEvent: this.createAuditEvent('settings.integration_update', 'IntegrationConnection', integration.integrationId, context),
        domainEvents: [
          this.createDomainEvent('settings.integration_updated.v1', context, {
            integrationId: integration.integrationId,
            status: integration.status,
            liveCredentialPresent: false
          })
        ]
      },
      this.createMeta(context)
    );
  }

  listTemplates(context: RequestContext): ApiEnvelope<TemplatesViewDto> {
    this.assertTenantScope(context);
    if (!canPerform('template:manage', context.access)) {
      throw new ForbiddenException('role cannot view template management');
    }
    return createApiEnvelope(
      {
        templates: this.templates,
        dotPhrases: this.dotPhrases,
        forbiddenPhiRejected: true
      },
      this.createMeta(context)
    );
  }

  createTemplate(request: CreateTemplateRequestDto, context: RequestContext): ApiEnvelope<OperationalActionResponseDto> {
    this.assertTenantScope(context);
    if (!canPerform('template:manage', context.access)) {
      throw new ForbiddenException('role cannot create templates');
    }
    if (scanForForbiddenPhiKeys(request).containsForbiddenPhi || scanForForbiddenPhiText(request).containsForbiddenPhiText) {
      throw new BadRequestException('template payload must not contain obvious PHI');
    }
    const validationErrors = validateTemplateDefinition(request);
    if (validationErrors.length > 0) {
      throw new BadRequestException({ code: 'INVALID_TEMPLATE', validationErrors });
    }
    const template: TemplateManagementDto = {
      templateId: this.nextId('template'),
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      name: request.name,
      visitType: request.visitType,
      sections: request.sections,
      variables: request.variables,
      status: 'draft',
      syntheticOnly: true
    };
    this.templates.push(template);
    return createApiEnvelope(
      {
        template,
        auditEvent: this.createAuditEvent('template.create', 'Template', template.templateId, context),
        domainEvents: [this.createDomainEvent('template.created.v1', context, { templateId: template.templateId })]
      },
      this.createMeta(context)
    );
  }

  updateDotPhrase(
    dotPhraseId: string,
    request: UpdateDotPhraseRequestDto,
    context: RequestContext
  ): ApiEnvelope<OperationalActionResponseDto> {
    this.assertTenantScope(context);
    if (!canPerform('template:manage', context.access)) {
      throw new ForbiddenException('role cannot update dot phrases');
    }
    if (scanForForbiddenPhiKeys(request).containsForbiddenPhi || scanForForbiddenPhiText(request).containsForbiddenPhiText) {
      throw new BadRequestException('dot phrase payload must not contain obvious PHI');
    }
    const dotPhrase = this.dotPhrases.find((candidate) => candidate.dotPhraseId === dotPhraseId);
    if (!dotPhrase) {
      throw new NotFoundException('dot phrase not found');
    }
    const variables = request.variables ?? dotPhrase.variables;
    const validationErrors = validateDotPhrase({ trigger: dotPhrase.trigger, expansion: request.expansion, variables });
    if (validationErrors.length > 0) {
      throw new BadRequestException({ code: 'INVALID_DOT_PHRASE', validationErrors });
    }
    dotPhrase.expansion = request.expansion;
    dotPhrase.variables = variables;
    dotPhrase.smartPhrasePlaceholders = variables;
    if (request.status) {
      dotPhrase.status = request.status;
    }
    return createApiEnvelope(
      {
        dotPhrase,
        auditEvent: this.createAuditEvent('dot_phrase.update', 'DotPhrase', dotPhrase.dotPhraseId, context),
        domainEvents: [this.createDomainEvent('dot_phrase.updated.v1', context, { dotPhraseId: dotPhrase.dotPhraseId })]
      },
      this.createMeta(context)
    );
  }

  getEstimateConfig(context: RequestContext): ApiEnvelope<EstimateConfigurationDto> {
    this.assertTenantScope(context);
    if (!canPerform('settings:view', context.access) && !canPerform('billing_review:view', context.access)) {
      throw new ForbiddenException('role cannot view estimate configuration');
    }
    return createApiEnvelope(this.estimateConfig, this.createMeta(context));
  }

  updateEstimateConfig(
    request: UpdateEstimateConfigurationRequestDto,
    context: RequestContext
  ): ApiEnvelope<OperationalActionResponseDto> {
    this.assertTenantScope(context);
    if (!canPerform('estimate_config:manage', context.access)) {
      throw new ForbiddenException('role cannot manage estimate configuration');
    }
    const next = {
      ...this.estimateConfig,
      internalEstimatesEnabled: request.internalEstimatesEnabled,
      patientFacingEstimatesEnabled: false as const,
      caveatText: request.caveatText,
      updatedAt: new Date().toISOString()
    };
    if (request.patientFacingEstimatesEnabled || !estimateConfigurationIsSafe(next)) {
      throw new BadRequestException('patient-facing estimate output is not enabled in WO-039');
    }
    this.estimateConfig = next;
    return createApiEnvelope(
      {
        estimateConfig: this.estimateConfig,
        auditEvent: this.createAuditEvent('estimate_config.update', 'EstimateConfiguration', this.estimateConfig.estimateConfigId, context),
        domainEvents: [
          this.createDomainEvent('estimate_config.updated.v1', context, {
            estimateConfigId: this.estimateConfig.estimateConfigId,
            patientFacingEstimatesEnabled: false
          })
        ]
      },
      this.createMeta(context)
    );
  }

  listRulesCatalog(context: RequestContext): ApiEnvelope<RulesCatalogViewDto> {
    this.assertTenantScope(context);
    if (!canPerform('rules_catalog:view', context.access)) {
      throw new ForbiddenException('role cannot view rules catalog');
    }
    return createApiEnvelope(this.createRulesCatalogView(), this.createMeta(context));
  }

  publishRulesCatalog(
    request: PublishRulesCatalogRequestDto,
    context: RequestContext
  ): ApiEnvelope<OperationalActionResponseDto> {
    this.assertTenantScope(context);
    if (!canPerform('rules_catalog:manage', context.access)) {
      throw new ForbiddenException('role cannot publish rules catalog entries');
    }
    if (!/human review/i.test(request.attestation)) {
      throw new BadRequestException('rules catalog publication requires human-review attestation');
    }
    for (const ruleId of request.ruleIds) {
      const rule = this.rulesCatalog.find((candidate) => candidate.ruleId === ruleId);
      if (!rule) {
        throw new NotFoundException(`rules catalog entry not found: ${ruleId}`);
      }
      if (!rulesCatalogEntryIsSafe(rule)) {
        throw new BadRequestException('rules catalog entry is missing safe human-review controls');
      }
      rule.status = 'active';
    }
    return createApiEnvelope(
      {
        rulesCatalog: this.createRulesCatalogView(),
        auditEvent: this.createAuditEvent('rules_catalog.publish', 'RulesCatalog', 'rules-catalog-primary', context),
        domainEvents: [this.createDomainEvent('rules_catalog.published.v1', context, { ruleIds: request.ruleIds })]
      },
      this.createMeta(context)
    );
  }

  createRequestContext(headers: Record<string, string | string[] | undefined>): RequestContext {
    const session = createSyntheticLocalSession(headers, {
      defaultTenantId: TENANT_ID,
      defaultSiteId: SITE_ID,
      requestId: 'req-operations',
      traceId: 'trace-operations',
      defaultLinkedToPatient: (role) => role !== 'support',
      defaultLinkedToVisit: (role) => role === 'clinician' || role === 'billing_staff' || role === 'ma',
      defaultBillingReviewTriggered: false,
      userIdForRole: (role) => `user-${role}-synthetic-001`
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

  private createOperationsRuntime(
    context: RequestContext,
    sources: {
      tasks: TaskWorklistViewDto | undefined;
      billing: BillingReviewQueueViewDto | undefined;
      settings: SettingsAdminViewDto | undefined;
      templates: TemplatesViewDto | undefined;
      estimate: EstimateConfigurationDto | undefined;
      rules: RulesCatalogViewDto | undefined;
    }
  ): OperationsRuntimeViewDto {
    const now = new Date().toISOString();
    const blockerCount = sources.tasks?.counts.blockers ?? 0;
    const billingReviewCount = sources.billing?.items.length ?? 0;
    const integrationCount = sources.settings?.integrations.length ?? 0;
    const disabledIntegrationCount = sources.settings?.integrations.filter((integration) => integration.status !== 'mock_ready').length ?? 0;
    const activeTemplateCount = sources.templates?.templates.filter((template) => template.status === 'active').length ?? 0;
    const activeRuleCount = sources.rules?.entries.filter((rule) => rule.status === 'active').length ?? 0;
    const routeState = sources.tasks || sources.settings ? 'ready' : 'permission-denied';

    return {
      runtimeId: 'operations-runtime-synthetic',
      routeState,
      requiredUiStates: ['empty', 'loading', 'ready', 'saving', 'failed', 'permission-denied', 'read-only', 'blocked', 'degraded', 'disabled', 'demo fixture'],
      analytics: {
        analyticsId: 'operations-analytics-synthetic',
        generatedAt: now,
        dataSource: 'standalone_operations_api_composite',
        metrics: [
          this.operationsMetric('operations-blockers', 'Open blockers', blockerCount, 'count', '/aura-note/operations', sources.tasks),
          this.operationsMetric('billing-review-items', 'Billing review items', billingReviewCount, 'count', '/aura-note/operations', sources.billing),
          this.operationsMetric('active-templates', 'Active templates', activeTemplateCount, 'count', '/aura-note/operations', sources.templates),
          this.operationsMetric('active-rules', 'Active rules', activeRuleCount, 'count', '/aura-note/operations', sources.rules),
          {
            metricId: 'internal-revenue-caveat',
            label: 'Internal revenue estimate posture',
            value: sources.estimate?.patientFacingEstimatesEnabled ? 'blocked' : 'unavailable_caveated',
            unit: 'status',
            route: '/aura-note/operations',
            state: sources.estimate ? 'disabled' : 'permission-denied',
            patientFacingExcluded: true
          }
        ],
        series: [
          {
            seriesId: 'worklist-composition',
            label: 'Worklist composition',
            kind: 'bar',
            source: 'tasks',
            patientFacingExcluded: true,
            internalOnly: true,
            points: [
              this.analyticsPoint('total tasks', sources.tasks?.counts.total ?? 0, sources.tasks),
              this.analyticsPoint('blockers', blockerCount, sources.tasks),
              this.analyticsPoint('MA follow-up', sources.tasks?.counts.maFollowUp ?? 0, sources.tasks)
            ]
          },
          {
            seriesId: 'billing-review-posture',
            label: 'Billing review posture',
            kind: 'status',
            source: 'billing_review',
            patientFacingExcluded: true,
            internalOnly: true,
            points: [
              this.analyticsPoint('triggered reviews', billingReviewCount, sources.billing),
              this.analyticsPoint('submitted claims', 0, sources.billing),
              this.analyticsPoint('transcript access limited', sources.billing?.transcriptAccessLimitedToTriggeredReview ? 1 : 0, sources.billing)
            ]
          },
          {
            seriesId: 'settings-integration-posture',
            label: 'Settings and integration posture',
            kind: 'bar',
            source: 'settings',
            patientFacingExcluded: true,
            internalOnly: true,
            points: [
              this.analyticsPoint('integrations', integrationCount, sources.settings),
              this.analyticsPoint('disabled or gated', disabledIntegrationCount, sources.settings),
              this.analyticsPoint('live credentials', 0, sources.settings)
            ]
          },
          {
            seriesId: 'rules-and-templates',
            label: 'Rules and templates',
            kind: 'bar',
            source: 'rules_catalog',
            patientFacingExcluded: true,
            internalOnly: true,
            points: [
              this.analyticsPoint('active templates', activeTemplateCount, sources.templates),
              this.analyticsPoint('active rules', activeRuleCount, sources.rules),
              this.analyticsPoint('certified production rules', sources.rules?.certifiedProductionRules ? 1 : 0, sources.rules)
            ]
          }
        ],
        internalRevenueVisible: false,
        patientFacingRevenueExposed: false,
        productionAnalyticsVendorEnabled: false,
        caveat: 'Synthetic operational analytics are backend-composed for workflow review only; they are not production analytics, patient-facing revenue, or claim submission evidence.'
      },
      notifications: this.createOperationsNotifications(blockerCount, disabledIntegrationCount, now),
      activity: this.createOperationsActivity(context, sources, now),
      settingsSummary: {
        settingsSummaryId: 'operations-settings-summary-synthetic',
        tenantId: TENANT_ID,
        siteId: SITE_ID,
        integrations:
          sources.settings?.integrations.map((integration) => ({
            integrationId: integration.integrationId,
            vendor: integration.vendor,
            status: integration.status,
            liveCredentialPresent: false,
            routeState: integration.status === 'mock_ready' ? 'degraded' : 'disabled'
          })) ?? [],
        featureFlags:
          sources.settings?.featureFlags.map((flag) => ({
            key: flag.key,
            enabled: flag.enabled,
            governs: flag.governs,
            runtimeEffect: flag.enabled ? 'internal_only' : 'disabled'
          })) ?? [],
        maskedSecretsOnly: true,
        secretValuesReturned: false,
        aiPreferencesGovernedBy: 'ai_gateway_policy',
        patientFacingRevenueEnabled: false,
        claimSubmissionEnabled: false,
        certifiedProductionRules: sources.rules?.certifiedProductionRules ?? false
      },
      localReactStateLimit: 'transient_tabs_and_form_inputs_only',
      productionLaunchApproved: false,
      liveVendorActionsEnabled: false,
      submittedClaim: false,
      demoFixture: true
    };
  }

  private operationsMetric(
    metricId: string,
    label: string,
    value: number | string,
    unit: 'count' | 'percent' | 'status',
    route: string,
    source: unknown
  ) {
    return {
      metricId,
      label,
      value,
      unit,
      route,
      state: source ? 'ready' : 'permission-denied',
      patientFacingExcluded: true
    } as const;
  }

  private analyticsPoint(label: string, value: number | string, source: unknown) {
    return {
      label,
      value,
      state: source ? 'ready' : 'permission-denied',
      patientFacingExcluded: true
    } as const;
  }

  private createOperationsNotifications(blockerCount: number, disabledIntegrationCount: number, now: string) {
    return [
      {
        notificationId: 'operations-notif-blockers',
        category: 'task',
        title: 'Operational blockers',
        body: `${blockerCount} blocker tasks require human review before signing/finalization preparation.`,
        severity: blockerCount > 0 ? 'warning' : 'success',
        read: blockerCount === 0,
        linkedRoute: '/aura-note/operations',
        patientFacingExcluded: true,
        metadataOnly: true,
        createdAt: now
      },
      {
        notificationId: 'operations-notif-live-integrations-disabled',
        category: 'disabled_feature',
        title: 'Live integrations gated',
        body: `${disabledIntegrationCount} integration surfaces remain disabled or mock-only with no live credentials.`,
        severity: 'info',
        linkedRoute: '/aura-note/platform',
        read: false,
        patientFacingExcluded: true,
        metadataOnly: true,
        createdAt: now
      }
    ] satisfies OperationsRuntimeViewDto['notifications'];
  }

  private createOperationsActivity(
    context: RequestContext,
    sources: {
      tasks: TaskWorklistViewDto | undefined;
      billing: BillingReviewQueueViewDto | undefined;
      settings: SettingsAdminViewDto | undefined;
      templates: TemplatesViewDto | undefined;
      rules: RulesCatalogViewDto | undefined;
    },
    now: string
  ) {
    return [
      {
        activityId: 'operations-activity-runtime-composed',
        category: 'governance',
        label: 'Operations runtime composed',
        detail: `Trace ${context.traceId} composed tasks, billing, settings, templates, estimates, and rules into one typed API view.`,
        actorLabel: context.actorUserId,
        route: '/aura-note/operations',
        metadataOnly: true,
        patientFacingExcluded: true,
        occurredAt: now
      },
      {
        activityId: 'operations-activity-billing-safe',
        category: 'support',
        label: 'Billing review remains draft-only',
        detail: `${sources.billing?.items.length ?? 0} billing review records are visible for authorized roles with submittedClaim=false.`,
        actorLabel: 'AURA Note API',
        route: '/aura-note/operations',
        metadataOnly: true,
        patientFacingExcluded: true,
        occurredAt: now
      },
      {
        activityId: 'operations-activity-settings-gated',
        category: 'integration',
        label: 'Settings and integrations are gated',
        detail: `${sources.settings?.integrations.length ?? 0} integration settings are metadata-only; secret values are never returned.`,
        actorLabel: 'AURA Note API',
        route: '/aura-note/platform',
        metadataOnly: true,
        patientFacingExcluded: true,
        occurredAt: now
      },
      {
        activityId: 'operations-activity-rules-human-review',
        category: 'governance',
        label: 'Rules catalog requires human review',
        detail: `${sources.rules?.entries.length ?? 0} rules are source-linked and cannot autonomously finalize coding or medical necessity.`,
        actorLabel: 'AURA Note API',
        route: '/aura-note/operations',
        metadataOnly: true,
        patientFacingExcluded: true,
        occurredAt: now
      }
    ] satisfies OperationsRuntimeViewDto['activity'];
  }

  private canSeeTask(task: OperationalTaskDto, access: AccessContext): boolean {
    if (access.authorizedAdmin || access.role === 'admin' || access.role === 'clinic_manager') return true;
    if (access.role === 'ma') return task.ownerRole === 'ma' || task.worklist === 'ma_follow_up';
    if (access.role === 'clinician') return task.ownerRole === 'clinician' || Boolean(task.noteId && access.linkedToVisit);
    return false;
  }

  private canUpdateTask(task: OperationalTaskDto, access: AccessContext): boolean {
    if (access.authorizedAdmin || access.role === 'admin' || access.role === 'clinic_manager') return true;
    if (access.role === 'ma') return task.ownerRole === 'ma';
    if (access.role === 'clinician') return task.ownerRole === 'clinician';
    return false;
  }

  private getTask(taskId: string): OperationalTaskDto {
    const task = this.tasks.find((candidate) => candidate.taskId === taskId);
    if (!task) {
      throw new NotFoundException('task not found');
    }
    return task;
  }

  private getBillingReview(billingReviewId: string): BillingReviewQueueItemDto {
    const item = this.billingReviews.find((candidate) => candidate.billingReviewId === billingReviewId);
    if (!item) {
      throw new NotFoundException('billing review item not found');
    }
    return item;
  }

  private withTranscriptAccessDecision(item: BillingReviewQueueItemDto, access: AccessContext): BillingReviewQueueItemDto {
    const allowed = canAccessBillingTranscriptForReview({
      role: access.role,
      billingReviewTriggered: access.billingReviewTriggered,
      linkedToVisit: access.linkedToVisit
    });
    return {
      ...item,
      transcriptAccess: allowed ? 'allowed_for_triggered_review' : 'denied',
      transcriptAccessReason: allowed
        ? 'Billing transcript access is allowed only for this triggered review context.'
        : 'Transcript access requires billing_staff role, linked visit, and triggered billing review context.'
    };
  }

  private createSettingsView(): SettingsAdminViewDto {
    return {
      tenant: {
        tenantId: TENANT_ID,
        displayName: 'Synthetic Primary Tenant',
        standaloneOwned: true
      },
      sites: [{ siteId: SITE_ID, displayName: 'Synthetic Primary Site', status: 'active' }],
      users: [
        { userId: 'user-clinician-synthetic-001', role: 'clinician', status: 'active', disabledUserBlocked: false },
        { userId: 'user-ma-synthetic-001', role: 'ma', status: 'active', disabledUserBlocked: false },
        { userId: 'user-support-disabled', role: 'support', status: 'disabled', disabledUserBlocked: true }
      ],
      featureFlags: [
        {
          key: 'AURA_ENABLE_EXTERNAL_AI',
          enabled: false,
          governs: 'external_ai',
          defaultValue: false,
          visibleToAdmins: true
        },
        {
          key: 'AURA_ENABLE_PATIENT_FACING_ESTIMATES',
          enabled: false,
          governs: 'patient_facing_estimates',
          defaultValue: false,
          visibleToAdmins: true
        }
      ],
      integrations: this.integrations,
      modeMappings: [
        { localObject: 'task', clinicosTarget: 'M04 WorkOS task', status: 'safe_degraded' },
        { localObject: 'rules_catalog', clinicosTarget: 'M21 Charge Integrity', status: 'not_configured' }
      ],
      demoFixture: true
    };
  }

  private createRulesCatalogView(): RulesCatalogViewDto {
    return {
      entries: this.rulesCatalog,
      sourceEvidenceRequired: true,
      certifiedProductionRules: false,
      draftOnly: true
    };
  }

  private hasPhi(value: string): boolean {
    return scanForForbiddenPhiText(value).containsForbiddenPhiText;
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
      sensitivity: 'phi_reference',
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

  private nextId(prefix: string): string {
    const value = `${prefix}-${String(this.sequence).padStart(4, '0')}`;
    this.sequence += 1;
    return value;
  }
}
