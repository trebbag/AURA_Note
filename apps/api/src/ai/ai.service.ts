import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import {
  AURA_NOTE_AI_SAFETY_POLICY,
  AI_EVALUATION_CASES,
  AI_MODEL_CONFIGURATIONS,
  PROMPT_REGISTRY,
  buildAiGovernanceEventPayload,
  createAiGatewayRequest,
  inspectAiGatewayResponse,
  invokeGovernedMockAi,
  prepareAiContextPackage,
  runDeterministicAiEvaluationCase,
  type AiContextPackage,
  type AiGatewayRequest as PackageAiGatewayRequest,
  type AiGatewayResponse as PackageAiGatewayResponse,
  type AiOutputValidationResult
} from '@aura-note/ai-gateway';
import {
  createApiEnvelope,
  createEventEnvelope,
  type AiContextPackageDto,
  type AiRuntimeBoundaryDto,
  type AiRuntimeBoundaryResponseDto,
  type AiEvaluationCaseDto,
  type AiEvaluationRunRequestDto,
  type AiEvaluationRunResponseDto,
  type AiEvaluationResultDto,
  type AiGatewayInvocationRequestDto,
  type AiGatewayInvocationResponseDto,
  type AiGatewayModelModeDto,
  type AiGatewayOutputTypeDto,
  type AiGatewayRequestDto,
  type AiGatewayResponseDto,
  type AiGatewayStatusDto,
  type AiModelConfigurationDto,
  type AiOutputValidationRequestDto,
  type AiOutputValidationResponseDto,
  type AiOutputValidationResultDto,
  type AiPromptRegistryEntryDto,
  type AiSafetyPolicyDto,
  type ApiEnvelope,
  type ApiMeta,
  type AuditEventDto
} from '@aura-note/contracts';
import { canPerform, createSyntheticLocalSession, type AccessContext } from '@aura-note/security';

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
export class AiService {
  private sequence = 1;

  getStatus(headers: Record<string, string | string[] | undefined>): ApiEnvelope<AiGatewayStatusDto> {
    const context = this.createRequestContext(headers);
    if (!canPerform('ai_governance:view', context.access) && !canPerform('ai_gateway:invoke', context.access)) {
      throw new ForbiddenException('role cannot view AI gateway status');
    }

    return createApiEnvelope(
      {
        policy: this.toPolicyDto(),
        promptRegistry: PROMPT_REGISTRY.map((entry): AiPromptRegistryEntryDto => ({
          promptId: entry.promptId,
          promptVersion: entry.promptVersion,
          purpose: entry.purpose,
          outputType: entry.outputType,
          description: entry.description,
          sourceLinkRequired: entry.sourceLinkRequired,
          humanReviewRequired: entry.humanReviewRequired,
          schemaVersion: entry.schemaVersion,
          riskLabel: entry.riskLabel,
          active: entry.active
        })),
        modelConfigurations: AI_MODEL_CONFIGURATIONS.map((config): AiModelConfigurationDto => ({ ...config })),
        evaluationCases: AI_EVALUATION_CASES.map((evalCase): AiEvaluationCaseDto => ({ ...evalCase })),
        providerMode: 'mock',
        externalAiEnabled: false,
        liveModelCredentialPresent: false,
        rawPhiToExternalAiAllowed: false,
        humanReviewRequiredForAllOutputs: true,
        runtimeBoundary: this.createRuntimeBoundary()
      },
      this.createMeta(context)
    );
  }

  getRuntimeBoundary(headers: Record<string, string | string[] | undefined>): ApiEnvelope<AiRuntimeBoundaryResponseDto> {
    const context = this.createRequestContext(headers);
    if (!canPerform('ai_governance:view', context.access)) {
      throw new ForbiddenException('role cannot view AI governance runtime boundary');
    }

    const runtimeBoundary = this.createRuntimeBoundary();
    return createApiEnvelope(
      {
        runtimeBoundary,
        auditEvent: this.createAuditEvent('ai.runtime_boundary_checked', 'AiGatewayRuntimeBoundary', 'ai-runtime-boundary-v1', context),
        domainEvents: [
          createEventEnvelope({
            eventId: this.nextId('evt'),
            eventType: 'ai.runtime_boundary_checked.v1',
            tenantId: TENANT_ID,
            siteId: SITE_ID,
            producer: 'aura-note-api',
            traceId: context.traceId,
            idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
            sensitivity: 'restricted',
            retentionClass: 'audit',
            payload: {
              providerBoundary: runtimeBoundary.providerBoundary,
              liveModelCallsEnabled: false,
              rawPhiToExternalAiAllowed: false,
              evaluationCaseCount: runtimeBoundary.evaluationCaseCount,
              prohibitedBehaviorCoverage: runtimeBoundary.prohibitedBehaviorCoverage,
              humanReviewGate: runtimeBoundary.humanReviewGate
            }
          })
        ]
      },
      this.createMeta(context)
    );
  }

  async runEvaluations(
    body: AiEvaluationRunRequestDto,
    headers: Record<string, string | string[] | undefined>
  ): Promise<ApiEnvelope<AiEvaluationRunResponseDto>> {
    const context = this.createRequestContext(headers);
    if (!canPerform('ai_governance:view', context.access)) {
      throw new ForbiddenException('role cannot run AI governance evaluations');
    }

    const requestedCaseIds = body.evalCaseIds && body.evalCaseIds.length > 0
      ? body.evalCaseIds
      : AI_EVALUATION_CASES.map((evalCase) => evalCase.evalCaseId);
    const knownCaseIds = new Set(AI_EVALUATION_CASES.map((evalCase) => evalCase.evalCaseId));
    const unknownCaseIds = requestedCaseIds.filter((caseId) => !knownCaseIds.has(caseId));
    if (unknownCaseIds.length > 0) {
      throw new BadRequestException(`unknown AI evaluation cases: ${unknownCaseIds.join(', ')}`);
    }

    const results = await Promise.all(
      requestedCaseIds.map((caseId, index) =>
        runDeterministicAiEvaluationCase({
          caseId,
          evidence: this.syntheticEvidence(),
          traceId: `${context.traceId}-eval-${index + 1}`
        })
      )
    );
    const allPassed = results.every((result) => result.passed);
    const blockedBehaviorCoverage = [
      ...new Set(results.map((result) => result.blockedBehavior).filter((behavior): behavior is NonNullable<typeof behavior> => Boolean(behavior)))
    ];
    const sourceFreshnessStatuses = [...new Set(results.map((result) => result.sourceFreshnessStatus))];
    const regressionBlockedCount = results.filter((result) => result.validationStatus === 'rejected').length;
    const eventType = allPassed ? 'ai.evaluation_run_completed.v1' : 'ai.evaluation_run_failed.v1';
    const eventPayload = {
      evalCaseIds: requestedCaseIds,
      resultCount: results.length,
      allPassed,
      liveModelCalled: false,
      regressionBlockedCount,
      prohibitedBehaviorCoverage: blockedBehaviorCoverage,
      sourceFreshnessStatuses,
      modelModes: [...new Set(results.map((result) => result.modelMode))]
    };
    const event = createEventEnvelope({
      eventId: this.nextId('evt'),
      eventType,
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      producer: 'aura-note-api',
      traceId: context.traceId,
      idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
      sensitivity: 'restricted',
      retentionClass: 'audit',
      payload: eventPayload
    });
    const humanReviewEvent = createEventEnvelope({
      eventId: this.nextId('evt'),
      eventType: 'ai.human_review_required.v1',
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      producer: 'aura-note-api',
      traceId: context.traceId,
      idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
      sensitivity: 'restricted',
      retentionClass: 'audit',
      payload: {
        evalCaseIds: requestedCaseIds,
        humanReviewGate: 'required_before_use',
        outputTypes: [...new Set(results.map((result) => result.outputType))]
      }
    });
    const regressionEvent = createEventEnvelope({
      eventId: this.nextId('evt'),
      eventType: 'ai.regression_blocked.v1',
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      producer: 'aura-note-api',
      traceId: context.traceId,
      idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
      sensitivity: 'restricted',
      retentionClass: 'audit',
      payload: {
        regressionBlockedCount,
        prohibitedBehaviorCoverage: blockedBehaviorCoverage,
        liveModelCalled: false
      }
    });

    return createApiEnvelope(
      {
        results: results.map((result): AiEvaluationResultDto => ({ ...result })),
        allPassed,
        liveModelCalled: false,
        regressionBlockedCount,
        prohibitedBehaviorCoverage: blockedBehaviorCoverage,
        sourceFreshnessStatuses,
        auditEvent: this.createAuditEvent('ai.evaluation_run', 'AiGatewayEvaluation', this.nextId('eval-run'), context),
        domainEvents: regressionBlockedCount > 0 ? [event, humanReviewEvent, regressionEvent] : [event, humanReviewEvent]
      },
      this.createMeta(context)
    );
  }

  validateOutput(
    body: AiOutputValidationRequestDto,
    headers: Record<string, string | string[] | undefined>
  ): ApiEnvelope<AiOutputValidationResponseDto> {
    const context = this.createRequestContext(headers);
    if (!canPerform('ai_governance:view', context.access)) {
      throw new ForbiddenException('role cannot validate AI governance outputs');
    }

    const response: PackageAiGatewayResponse<Record<string, unknown>> = {
      output: body.output,
      outputType: body.outputType,
      modelMode: 'mock',
      modelVersion: 'mock-aura-note-p9',
      warnings: ['Synthetic output validation only. External AI remains disabled.'],
      humanReviewRequired: true,
      sourceEvidenceIds: body.sourceEvidenceIds ?? [],
      rejected: false
    };
    const validation = inspectAiGatewayResponse(response);
    const eventType = validation.validationStatus === 'rejected' ? 'ai.output_rejected.v1' : 'ai.output_validated.v1';
    const outputEvent = createEventEnvelope({
      eventId: this.nextId('evt'),
      eventType,
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      producer: 'aura-note-api',
      traceId: context.traceId,
      idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
      sensitivity: 'restricted',
      retentionClass: 'audit',
      payload: {
        outputType: body.outputType,
        validationStatus: validation.validationStatus,
        schemaValidationStatus: validation.schemaValidationStatus,
        sourceFreshnessStatus: validation.sourceFreshnessStatus,
        confidence: validation.confidence,
        riskLabel: validation.riskLabel,
        unsafeReasons: validation.unsafeReasons,
        prohibitedActionDetected: validation.prohibitedActionDetected,
        rawPhiDetected: validation.rawPhiDetected,
        blockedBehavior: validation.blockedBehavior,
        sourceEvidenceIds: body.sourceEvidenceIds ?? [],
        humanReviewRequired: true
      }
    });
    const humanReviewEvent = createEventEnvelope({
      eventId: this.nextId('evt'),
      eventType: 'ai.human_review_required.v1',
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      producer: 'aura-note-api',
      traceId: context.traceId,
      idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
      sensitivity: 'restricted',
      retentionClass: 'audit',
      payload: {
        outputType: body.outputType,
        humanReviewGate: 'required_before_use',
        validationStatus: validation.validationStatus
      }
    });
    const regressionEvent = createEventEnvelope({
      eventId: this.nextId('evt'),
      eventType: 'ai.regression_blocked.v1',
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      producer: 'aura-note-api',
      traceId: context.traceId,
      idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
      sensitivity: 'restricted',
      retentionClass: 'audit',
      payload: {
        blockedBehavior: validation.blockedBehavior,
        validationStatus: validation.validationStatus,
        liveModelCalled: false
      }
    });

    return createApiEnvelope(
      {
        validation: this.toValidationDto(validation),
        auditEvent: this.createAuditEvent('ai.output_validated', 'AiGatewayOutput', this.nextId('ai-output'), context),
        domainEvents: validation.validationStatus === 'rejected' ? [outputEvent, humanReviewEvent, regressionEvent] : [outputEvent, humanReviewEvent]
      },
      this.createMeta(context)
    );
  }

  async invokeMock(
    body: AiGatewayInvocationRequestDto,
    headers: Record<string, string | string[] | undefined>
  ): Promise<ApiEnvelope<AiGatewayInvocationResponseDto>> {
    const context = this.createRequestContext(headers);
    if (!canPerform('ai_gateway:invoke', context.access)) {
      throw new ForbiddenException('role cannot invoke AI gateway');
    }

    if (!body.safePatientId?.trim()) {
      throw new BadRequestException('safePatientId is required for AI context packaging');
    }
    if (!body.clinicalFacts || typeof body.clinicalFacts !== 'object') {
      throw new BadRequestException('clinicalFacts must be a structured object');
    }

    const prepared = prepareAiContextPackage(
      {
        tenantId: TENANT_ID,
        siteId: SITE_ID,
        safePatientId: body.safePatientId,
        ...(body.noteId ? { noteId: body.noteId } : {}),
        ...(body.appointmentId ? { appointmentId: body.appointmentId } : {}),
        ...(body.visitType ? { visitType: body.visitType } : {}),
        clinicalFacts: body.clinicalFacts,
        evidence: body.evidence ?? [],
        traceId: context.traceId
      },
      body.phiHandling ?? 'reject'
    );

    if (prepared.package.rejectedPaths.length > 0) {
      const syntheticRequest = this.createSyntheticRejectedRequest(body, prepared.package, context.traceId);
      throw new BadRequestException({
        code: 'AI_PHI_BOUNDARY_REJECTED',
        message: 'AI gateway rejected raw PHI before model invocation.',
        rejectedPaths: prepared.package.rejectedPaths,
        auditEvent: this.createAuditEvent('ai.phi_rejected', 'AiGateway', prepared.package.contextPackageId, context),
        domainEvents: [
          createEventEnvelope({
            eventId: this.nextId('evt'),
            eventType: 'ai.phi_rejected.v1',
            tenantId: TENANT_ID,
            siteId: SITE_ID,
            producer: 'aura-note-api',
            traceId: context.traceId,
            idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
            sensitivity: 'restricted',
            retentionClass: 'audit',
            payload: buildAiGovernanceEventPayload({
              request: syntheticRequest,
              status: 'phi_rejected'
          }),
          }),
          createEventEnvelope({
            eventId: this.nextId('evt'),
            eventType: 'ai.request_denied.v1',
            tenantId: TENANT_ID,
            siteId: SITE_ID,
            producer: 'aura-note-api',
            traceId: context.traceId,
            idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
            sensitivity: 'restricted',
            retentionClass: 'audit',
            payload: {
              purpose: body.purpose,
              outputType: body.outputType ?? 'suggestion',
              reason: 'raw_phi_rejected',
              rejectedPaths: prepared.package.rejectedPaths,
              liveModelCalled: false
            }
          })
        ]
      });
    }

    const request = createAiGatewayRequest({
      purpose: body.purpose,
      contextPackage: prepared.package,
      traceId: context.traceId,
      ...(body.outputType ? { outputType: body.outputType } : {})
    });
    const response = await invokeGovernedMockAi<Record<string, unknown>>({
      purpose: body.purpose,
      contextPackage: prepared.package,
      traceId: context.traceId,
      expectedOutput: {
        draftOnly: true,
        humanReviewRequired: true,
        purpose: body.purpose,
        synthetic: true
      }
    });

    const eventTypes = prepared.package.redactedPaths.length > 0
      ? ['ai.context_package_created.v1' as const, 'ai.context_scrubbed.v1' as const, 'ai.request_prepared.v1' as const, 'ai.response_recorded.v1' as const, 'ai.human_review_required.v1' as const]
      : ['ai.context_package_created.v1' as const, 'ai.request_prepared.v1' as const, 'ai.response_recorded.v1' as const, 'ai.human_review_required.v1' as const];

    return createApiEnvelope(
      {
        contextPackage: this.toContextPackageDto(prepared.package),
        request: this.toRequestDto(request),
        response: this.toResponseDto(response),
        auditEvent: this.createAuditEvent('ai.mock_invocation', 'AiGateway', prepared.package.contextPackageId, context),
        domainEvents: eventTypes.map((eventType) =>
          createEventEnvelope({
            eventId: this.nextId('evt'),
            eventType,
            tenantId: TENANT_ID,
            siteId: SITE_ID,
            producer: 'aura-note-api',
            traceId: context.traceId,
            idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
            sensitivity: 'restricted',
            retentionClass: 'audit',
            payload: buildAiGovernanceEventPayload({
              request,
              response,
              status:
                eventType === 'ai.context_scrubbed.v1'
                  ? 'context_scrubbed'
                  : eventType === 'ai.context_package_created.v1'
                    ? 'prepared'
                    : eventType === 'ai.human_review_required.v1'
                      ? 'response_recorded'
                      : eventType === 'ai.response_recorded.v1'
                        ? 'response_recorded'
                        : 'prepared'
            })
          })
        )
      },
      this.createMeta(context),
      prepared.warnings.map((message) => ({ code: 'AI_CONTEXT_SCRUBBED', message, severity: 'warning' as const }))
    );
  }

  createRequestContext(headers: Record<string, string | string[] | undefined>): RequestContext {
    const session = createSyntheticLocalSession(headers, {
      defaultTenantId: TENANT_ID,
      defaultSiteId: SITE_ID,
      requestId: this.nextId('req'),
      traceId: this.nextId('trace'),
      defaultLinkedToPatient: (role) => role !== 'billing_staff',
      defaultLinkedToVisit: (role) => role === 'clinician'
    });

    if (!session.tenantScopeAllowed) {
      throw new ForbiddenException(session.denialReason ?? 'tenant access denied');
    }

    const context: RequestContext = {
      requestId: session.requestId,
      traceId: session.traceId,
      actorUserId: session.actorUserId,
      access: session.access
    };

    if (session.idempotencyKey) {
      context.idempotencyKey = session.idempotencyKey;
    }

    return context;
  }

  private createSyntheticRejectedRequest(
    body: AiGatewayInvocationRequestDto,
    contextPackage: AiContextPackage,
    traceId: string
  ): PackageAiGatewayRequest<AiContextPackage> {
    return {
      tenantId: contextPackage.tenantId,
      siteId: contextPackage.siteId,
      purpose: body.purpose,
      context: contextPackage,
      outputType: body.outputType ?? 'suggestion',
      traceId,
      promptId: 'aura-note-rejected-before-prompt',
      promptVersion: '2026-05-26.cp3',
      modelVersion: 'not-invoked',
      policyMode: 'mock_only',
      humanReviewStatus: 'required'
    };
  }

  private toPolicyDto(): AiSafetyPolicyDto {
    return {
      policyId: AURA_NOTE_AI_SAFETY_POLICY.policyId,
      mode: AURA_NOTE_AI_SAFETY_POLICY.mode,
      externalAiEnabled: AURA_NOTE_AI_SAFETY_POLICY.externalAiEnabled,
      privateBaaRequired: AURA_NOTE_AI_SAFETY_POLICY.privateBaaRequired,
      humanReviewRequired: AURA_NOTE_AI_SAFETY_POLICY.humanReviewRequired,
      allowedOutputTypes: [...AURA_NOTE_AI_SAFETY_POLICY.allowedOutputTypes],
      prohibitedAutonomousActions: [...AURA_NOTE_AI_SAFETY_POLICY.prohibitedAutonomousActions]
    };
  }

  private createRuntimeBoundary(): AiRuntimeBoundaryDto {
    return {
      providerBoundary: 'server_side_ai_gateway',
      gatewayMode: AURA_NOTE_AI_SAFETY_POLICY.mode,
      liveModelCallsEnabled: false,
      liveModelCredentialPresent: false,
      rawPhiToExternalAiAllowed: false,
      productionPromptStoreEnabled: false,
      privateBaaPathwayApproved: false,
      driftMonitoringEnabled: false,
      driftMonitoringStatus: 'placeholder_disabled',
      supportedRuntimeStates: [
        'disabled',
        'configured',
        'degraded',
        'failed',
        'source_stale',
        'scrubbed',
        'phi_rejected',
        'output_validation_failed',
        'unsafe_output_rejected',
        'human_review_required',
        'permission_denied',
        'read_only',
        'loading',
        'empty',
        'ready',
        'demo_fixture'
      ],
      promptRegistryCount: PROMPT_REGISTRY.length,
      modelConfigurationCount: AI_MODEL_CONFIGURATIONS.length,
      evaluationCaseCount: AI_EVALUATION_CASES.length,
      prohibitedBehaviorCoverage: [
        ...new Set(AI_EVALUATION_CASES.map((evalCase) => evalCase.blockedBehavior).filter((behavior): behavior is NonNullable<typeof behavior> => Boolean(behavior)))
      ],
      sourceFreshnessStatuses: [...new Set(AI_EVALUATION_CASES.map((evalCase) => evalCase.expectedSourceFreshnessStatus))],
      humanReviewGate: 'required_before_use',
      schemaValidationRequired: true,
      sourceEvidenceRequired: true,
      syntheticOnly: true,
      reviewedAt: new Date().toISOString()
    };
  }

  private toContextPackageDto(contextPackage: AiContextPackage): AiContextPackageDto {
    return {
      contextPackageId: contextPackage.contextPackageId,
      tenantId: contextPackage.tenantId,
      siteId: contextPackage.siteId,
      safePatientId: contextPackage.safePatientId,
      ...(contextPackage.noteId ? { noteId: contextPackage.noteId } : {}),
      ...(contextPackage.appointmentId ? { appointmentId: contextPackage.appointmentId } : {}),
      ...(contextPackage.visitType ? { visitType: contextPackage.visitType } : {}),
      clinicalFacts: contextPackage.clinicalFacts,
      evidence: contextPackage.evidence,
      sourceIds: contextPackage.sourceIds,
      phiHandling: contextPackage.phiHandling,
      redactedPaths: contextPackage.redactedPaths,
      rejectedPaths: contextPackage.rejectedPaths,
      deidentified: contextPackage.deidentified,
      createdAt: contextPackage.createdAt
    };
  }

  private toRequestDto(request: PackageAiGatewayRequest<AiContextPackage>): AiGatewayRequestDto {
    if (!request.siteId || !request.promptId || !request.promptVersion || !request.modelVersion || !request.policyMode) {
      throw new BadRequestException('AI request missing required governance metadata');
    }

    return {
      tenantId: request.tenantId,
      siteId: request.siteId,
      purpose: request.purpose,
      contextPackage: this.toContextPackageDto(request.context),
      outputType: request.outputType,
      traceId: request.traceId,
      promptId: request.promptId,
      promptVersion: request.promptVersion,
      modelVersion: request.modelVersion,
      policyMode: request.policyMode,
      humanReviewStatus: request.humanReviewStatus ?? 'required'
    };
  }

  private toResponseDto(response: PackageAiGatewayResponse<Record<string, unknown>>): AiGatewayResponseDto {
    return {
      output: response.output,
      outputType: response.outputType,
      modelMode: response.modelMode,
      ...(typeof response.confidence === 'number' ? { confidence: response.confidence } : {}),
      warnings: response.warnings,
      ...(response.promptId ? { promptId: response.promptId } : {}),
      ...(response.promptVersion ? { promptVersion: response.promptVersion } : {}),
      ...(response.modelVersion ? { modelVersion: response.modelVersion } : {}),
      humanReviewRequired: response.humanReviewRequired,
      sourceEvidenceIds: response.sourceEvidenceIds,
      rejected: response.rejected
    };
  }

  private toValidationDto(validation: AiOutputValidationResult): AiOutputValidationResultDto {
    return {
      validationStatus: validation.validationStatus,
      riskLabel: validation.riskLabel,
      schemaValidationStatus: validation.schemaValidationStatus,
      sourceFreshnessStatus: validation.sourceFreshnessStatus,
      confidence: validation.confidence,
      unsafeReasons: validation.unsafeReasons,
      prohibitedActionDetected: validation.prohibitedActionDetected,
      rawPhiDetected: validation.rawPhiDetected,
      ...(validation.blockedBehavior ? { blockedBehavior: validation.blockedBehavior } : {}),
      humanReviewRequired: validation.humanReviewRequired
    };
  }

  private syntheticEvidence() {
    return [
      {
        evidenceId: 'evidence-synthetic-001',
        evidenceType: 'chart_slice' as const,
        sourceSystem: 'synthetic_fixture' as const,
        sourceRef: 'chart-synthetic-001',
        displayLabel: 'Synthetic chart slice',
        excerptOrValue: 'Synthetic deidentified value',
        freshness: 'recent' as const,
        sourceQuality: 'high' as const,
        phiClassification: 'deidentified' as const,
        allowedRoles: ['clinician', 'compliance_privacy_lead']
      }
    ];
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

  private nextId(prefix: string): string {
    const id = `${prefix}-${this.sequence.toString().padStart(4, '0')}`;
    this.sequence += 1;
    return id;
  }
}
