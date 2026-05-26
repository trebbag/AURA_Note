import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import {
  AURA_NOTE_AI_SAFETY_POLICY,
  PROMPT_REGISTRY,
  buildAiGovernanceEventPayload,
  createAiGatewayRequest,
  invokeGovernedMockAi,
  prepareAiContextPackage,
  type AiContextPackage,
  type AiGatewayRequest as PackageAiGatewayRequest,
  type AiGatewayResponse as PackageAiGatewayResponse
} from '@aura-note/ai-gateway';
import {
  createApiEnvelope,
  createEventEnvelope,
  type AiContextPackageDto,
  type AiGatewayInvocationRequestDto,
  type AiGatewayInvocationResponseDto,
  type AiGatewayRequestDto,
  type AiGatewayResponseDto,
  type AiGatewayStatusDto,
  type AiPromptRegistryEntryDto,
  type AiSafetyPolicyDto,
  type ApiEnvelope,
  type ApiMeta,
  type AuditEventDto
} from '@aura-note/contracts';
import { canPerform, type AccessContext, type Role } from '@aura-note/security';

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
          sourceLinkRequired: entry.sourceLinkRequired,
          humanReviewRequired: entry.humanReviewRequired
        })),
        providerMode: 'mock',
        externalAiEnabled: false
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
            })
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
      ? ['ai.context_scrubbed.v1' as const, 'ai.request_prepared.v1' as const, 'ai.response_recorded.v1' as const]
      : ['ai.request_prepared.v1' as const, 'ai.response_recorded.v1' as const];

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
    const roleHeader = this.headerValue(headers['x-aura-role']);
    const role = this.parseRole(roleHeader);
    const requestId = this.headerValue(headers['x-request-id']) ?? this.nextId('req');
    const traceId = this.headerValue(headers['x-trace-id']) ?? this.nextId('trace');
    const idempotencyKey = this.headerValue(headers['idempotency-key']);
    const linkedToPatient =
      this.parseBooleanHeader(this.headerValue(headers['x-aura-linked-patient'])) ?? role !== 'billing_staff';
    const linkedToVisit = this.parseBooleanHeader(this.headerValue(headers['x-aura-linked-visit'])) ?? role === 'clinician';
    const billingReviewTriggered =
      this.parseBooleanHeader(this.headerValue(headers['x-aura-billing-review-triggered'])) ?? false;

    const context: RequestContext = {
      requestId,
      traceId,
      actorUserId: this.headerValue(headers['x-aura-user-id']) ?? `synthetic-${role}`,
      access: {
        role,
        linkedToPatient,
        linkedToVisit,
        treatingClinician: role === 'clinician' && linkedToVisit,
        billingReviewTriggered,
        authorizedAdmin: role === 'authorized_admin' || role === 'admin'
      }
    };

    if (idempotencyKey) {
      context.idempotencyKey = idempotencyKey;
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

  private parseRole(value: string | undefined): Role {
    switch (value) {
      case 'ma':
      case 'billing_staff':
      case 'admin':
      case 'authorized_admin':
      case 'clinic_manager':
      case 'compliance_privacy_lead':
      case 'support':
      case 'service_account':
        return value;
      default:
        return 'clinician';
    }
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
