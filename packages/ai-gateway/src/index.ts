import {
  redactForbiddenPhi,
  scanForForbiddenPhiKeys,
  scanForForbiddenPhiText
} from '@aura-note/security';

export type AiOutputType = 'suggestion' | 'draft' | 'candidate' | 'summary' | 'coaching_feedback';
export type AiGatewayPurpose = 'suggestions' | 'compose_note' | 'patient_summary' | 'billing_preview' | 'coaching';
export type AiGatewayModelMode = 'mock' | 'private_baa' | 'external_disabled';
export type AiGatewayPolicyMode = 'mock_only' | 'external_disabled' | 'private_baa_governed';
export type AiPhiHandling = 'reject' | 'redact';
export type AiHumanReviewStatus = 'required' | 'approved_by_human' | 'rejected_by_human';
export type EvidenceType =
  | 'note_text'
  | 'transcript_segment'
  | 'chart_slice'
  | 'lab'
  | 'vital'
  | 'medication'
  | 'problem'
  | 'diagnosis'
  | 'quality_measure'
  | 'payer_rule'
  | 'staff_answer'
  | 'patient_form'
  | 'task'
  | 'prior_note';

export interface AiEvidenceNode {
  evidenceId: string;
  evidenceType: EvidenceType;
  sourceSystem: 'aura_note' | 'ehr_adapter' | 'clinicos' | 'synthetic_fixture';
  sourceRef: string;
  displayLabel: string;
  excerptOrValue: string;
  freshness: 'current_visit' | 'recent' | 'historical' | 'unknown';
  sourceQuality: 'high' | 'medium' | 'low';
  phiClassification: 'deidentified' | 'phi_reference' | 'restricted';
  allowedRoles: string[];
}

export interface AiContextPackage {
  contextPackageId: string;
  tenantId: string;
  siteId: string;
  safePatientId: string;
  noteId?: string;
  appointmentId?: string;
  visitType?: string;
  clinicalFacts: Record<string, unknown>;
  evidence: AiEvidenceNode[];
  sourceIds: string[];
  phiHandling: AiPhiHandling;
  redactedPaths: string[];
  rejectedPaths: string[];
  deidentified: boolean;
  createdAt: string;
}

export interface AiSafetyPolicy {
  policyId: 'aura-note-ai-policy-v1';
  mode: AiGatewayPolicyMode;
  externalAiEnabled: boolean;
  privateBaaRequired: true;
  humanReviewRequired: true;
  allowedOutputTypes: readonly AiOutputType[];
  prohibitedAutonomousActions: readonly string[];
}

export interface AiPromptRegistryEntry {
  promptId: string;
  promptVersion: string;
  purpose: AiGatewayPurpose;
  outputType: AiOutputType;
  description: string;
  sourceLinkRequired: boolean;
  humanReviewRequired: true;
}

export interface AiGatewayRequest<TContext = AiContextPackage> {
  tenantId: string;
  siteId?: string;
  purpose: AiGatewayPurpose;
  context: TContext;
  outputType: AiOutputType;
  traceId: string;
  promptId?: string;
  promptVersion?: string;
  modelVersion?: string;
  policyMode?: AiGatewayPolicyMode;
  humanReviewStatus?: AiHumanReviewStatus;
}

export interface AiGatewayResponse<TOutput = unknown> {
  output: TOutput;
  outputType: AiOutputType;
  modelMode: AiGatewayModelMode;
  confidence?: number;
  warnings: string[];
  promptId?: string;
  promptVersion?: string;
  modelVersion?: string;
  humanReviewRequired: true;
  sourceEvidenceIds: string[];
  rejected: boolean;
}

export interface AiContextPackageInput {
  tenantId: string;
  siteId: string;
  safePatientId: string;
  noteId?: string;
  appointmentId?: string;
  visitType?: string;
  clinicalFacts: Record<string, unknown>;
  evidence: AiEvidenceNode[];
  sourceIds?: string[];
  traceId: string;
}

export interface AiContextPreparationResult {
  package: AiContextPackage;
  warnings: string[];
}

export interface AiProviderInvocation<TOutput = unknown> {
  request: AiGatewayRequest;
  policy: AiSafetyPolicy;
  expectedOutput?: TOutput;
}

export interface AiModelProvider {
  readonly mode: AiGatewayModelMode;
  invoke<TOutput = unknown>(input: AiProviderInvocation<TOutput>): Promise<AiGatewayResponse<TOutput>>;
}

export const AURA_NOTE_AI_SAFETY_POLICY: AiSafetyPolicy = {
  policyId: 'aura-note-ai-policy-v1',
  mode: 'mock_only',
  externalAiEnabled: false,
  privateBaaRequired: true,
  humanReviewRequired: true,
  allowedOutputTypes: ['suggestion', 'draft', 'candidate', 'summary', 'coaching_feedback'],
  prohibitedAutonomousActions: [
    'diagnose_patient',
    'finalize_diagnosis',
    'finalize_code',
    'finalize_charge',
    'submit_claim',
    'determine_medical_necessity',
    'place_order'
  ]
};

export const PROMPT_REGISTRY: readonly AiPromptRegistryEntry[] = [
  {
    promptId: 'aura-note-suggestions-v1',
    promptVersion: '2026-05-26.cp3',
    purpose: 'suggestions',
    outputType: 'suggestion',
    description: 'Draft-only suggestion candidate generation over deidentified context.',
    sourceLinkRequired: true,
    humanReviewRequired: true
  },
  {
    promptId: 'aura-note-compose-note-v1',
    promptVersion: '2026-05-26.cp3',
    purpose: 'compose_note',
    outputType: 'draft',
    description: 'Draft enhanced note composition requiring clinician review.',
    sourceLinkRequired: true,
    humanReviewRequired: true
  },
  {
    promptId: 'aura-note-patient-summary-v1',
    promptVersion: '2026-05-26.cp3',
    purpose: 'patient_summary',
    outputType: 'summary',
    description: 'Draft patient-friendly summary with internal billing details excluded.',
    sourceLinkRequired: true,
    humanReviewRequired: true
  },
  {
    promptId: 'aura-note-billing-preview-v1',
    promptVersion: '2026-05-26.cp3',
    purpose: 'billing_preview',
    outputType: 'candidate',
    description: 'Candidate-only draft claim preview support requiring clinician/billing review.',
    sourceLinkRequired: true,
    humanReviewRequired: true
  },
  {
    promptId: 'aura-note-coaching-v1',
    promptVersion: '2026-05-26.cp3',
    purpose: 'coaching',
    outputType: 'coaching_feedback',
    description: 'Clinician coaching feedback draft with role-limited visibility.',
    sourceLinkRequired: true,
    humanReviewRequired: true
  }
] as const;

export function assertNoRawPhi(request: AiGatewayRequest): void {
  const keyScan = scanForUnredactedForbiddenPhiKeys(request.context);
  const textScan = scanForForbiddenPhiText(request.context);
  if (keyScan.paths.length > 0 || textScan.containsForbiddenPhiText) {
    const paths = [...keyScan.paths, ...textScan.paths].join(', ');
    throw new Error(`AI gateway rejected request containing forbidden PHI at ${paths}.`);
  }
}

export function getPromptRegistryEntry(purpose: AiGatewayPurpose): AiPromptRegistryEntry {
  const entry = PROMPT_REGISTRY.find((candidate) => candidate.purpose === purpose);
  if (!entry) {
    throw new Error(`No prompt registry entry exists for purpose ${purpose}.`);
  }
  return entry;
}

export function scanAiContextForPhi(value: unknown): { containsPhi: boolean; paths: string[] } {
  const keyScan = scanForForbiddenPhiKeys(value);
  const textScan = scanForForbiddenPhiText(value);
  return {
    containsPhi: keyScan.containsForbiddenPhi || textScan.containsForbiddenPhiText,
    paths: [...keyScan.paths, ...textScan.paths]
  };
}

export function prepareAiContextPackage(
  input: AiContextPackageInput,
  phiHandling: AiPhiHandling = 'reject',
  nowIso = new Date().toISOString()
): AiContextPreparationResult {
  const scan = scanAiContextForPhi(input);
  if (scan.containsPhi && phiHandling === 'reject') {
    return {
      package: {
        contextPackageId: `ai-context-rejected-${input.traceId}`,
        tenantId: input.tenantId,
        siteId: input.siteId,
        safePatientId: input.safePatientId,
        ...(input.noteId ? { noteId: input.noteId } : {}),
        ...(input.appointmentId ? { appointmentId: input.appointmentId } : {}),
        ...(input.visitType ? { visitType: input.visitType } : {}),
        clinicalFacts: {},
        evidence: [],
        sourceIds: input.sourceIds ?? [],
        phiHandling,
        redactedPaths: [],
        rejectedPaths: scan.paths,
        deidentified: false,
        createdAt: nowIso
      },
      warnings: ['AI context package rejected before model invocation because raw PHI was detected.']
    };
  }

  const redacted = scan.containsPhi ? redactForbiddenPhi(input.clinicalFacts) : input.clinicalFacts;
  return {
    package: {
      contextPackageId: `ai-context-${input.traceId}`,
      tenantId: input.tenantId,
      siteId: input.siteId,
      safePatientId: input.safePatientId,
      ...(input.noteId ? { noteId: input.noteId } : {}),
      ...(input.appointmentId ? { appointmentId: input.appointmentId } : {}),
      ...(input.visitType ? { visitType: input.visitType } : {}),
      clinicalFacts: redacted as Record<string, unknown>,
      evidence: input.evidence,
      sourceIds: input.sourceIds ?? input.evidence.map((node) => node.evidenceId),
      phiHandling,
      redactedPaths: scan.containsPhi ? scan.paths : [],
      rejectedPaths: [],
      deidentified: true,
      createdAt: nowIso
    },
    warnings: scan.containsPhi ? ['AI context package redacted forbidden PHI before mock invocation.'] : []
  };
}

export function createAiGatewayRequest(input: {
  purpose: AiGatewayPurpose;
  contextPackage: AiContextPackage;
  traceId: string;
  outputType?: AiOutputType;
  policyMode?: AiGatewayPolicyMode;
}): AiGatewayRequest<AiContextPackage> {
  if (input.contextPackage.rejectedPaths.length > 0) {
    throw new Error('AI gateway request cannot be created from a rejected context package.');
  }

  const prompt = getPromptRegistryEntry(input.purpose);
  const outputType = input.outputType ?? prompt.outputType;
  if (!AURA_NOTE_AI_SAFETY_POLICY.allowedOutputTypes.includes(outputType)) {
    throw new Error(`AI output type ${outputType} is not allowed by the AURA Note safety policy.`);
  }

  return {
    tenantId: input.contextPackage.tenantId,
    siteId: input.contextPackage.siteId,
    purpose: input.purpose,
    context: input.contextPackage,
    outputType,
    traceId: input.traceId,
    promptId: prompt.promptId,
    promptVersion: prompt.promptVersion,
    modelVersion: 'mock-aura-note-cp3',
    policyMode: input.policyMode ?? AURA_NOTE_AI_SAFETY_POLICY.mode,
    humanReviewStatus: 'required'
  };
}

export function validateAiGatewayResponse(response: AiGatewayResponse): void {
  if (!AURA_NOTE_AI_SAFETY_POLICY.allowedOutputTypes.includes(response.outputType)) {
    throw new Error(`AI gateway rejected unsupported output type ${response.outputType}.`);
  }

  const candidate = response.output as Record<string, unknown>;
  if (candidate && (candidate.finalizesClinicalDecision === true || candidate.submitsClaim === true)) {
    throw new Error('AI gateway rejected output that attempted a prohibited autonomous action.');
  }
}

export async function invokeMockAi<TOutput = unknown>(request: AiGatewayRequest): Promise<AiGatewayResponse<TOutput>> {
  assertNoRawPhi(request);

  const response: AiGatewayResponse<TOutput> = {
    output: {} as TOutput,
    outputType: request.outputType,
    modelMode: 'mock',
    confidence: 0.8,
    warnings: ['Mock AI output. External AI remains disabled by default.'],
    ...(request.promptId ? { promptId: request.promptId } : {}),
    ...(request.promptVersion ? { promptVersion: request.promptVersion } : {}),
    modelVersion: request.modelVersion ?? 'mock-aura-note-cp3',
    humanReviewRequired: true,
    sourceEvidenceIds: isAiContextPackage(request.context) ? request.context.sourceIds : [],
    rejected: false
  };

  validateAiGatewayResponse(response);
  return response;
}

export class MockAiModelProvider implements AiModelProvider {
  readonly mode = 'mock' as const;

  async invoke<TOutput = unknown>(input: AiProviderInvocation<TOutput>): Promise<AiGatewayResponse<TOutput>> {
    const response = await invokeMockAi<TOutput>(input.request);
    if (input.expectedOutput === undefined) {
      return response;
    }
    return { ...response, output: input.expectedOutput };
  }
}

export class ExternalDisabledModelProvider implements AiModelProvider {
  readonly mode = 'external_disabled' as const;

  async invoke<TOutput = unknown>(input: AiProviderInvocation<TOutput>): Promise<AiGatewayResponse<TOutput>> {
    return {
      output: input.expectedOutput ?? ({} as TOutput),
      outputType: input.request.outputType,
      modelMode: 'external_disabled',
      confidence: 0,
      warnings: ['External AI invocation is disabled until private/BAA governance approval is configured.'],
      ...(input.request.promptId ? { promptId: input.request.promptId } : {}),
      ...(input.request.promptVersion ? { promptVersion: input.request.promptVersion } : {}),
      modelVersion: 'external-disabled',
      humanReviewRequired: true,
      sourceEvidenceIds: isAiContextPackage(input.request.context) ? input.request.context.sourceIds : [],
      rejected: true
    };
  }
}

export async function invokeGovernedMockAi<TOutput = unknown>(input: {
  purpose: AiGatewayPurpose;
  contextPackage: AiContextPackage;
  traceId: string;
  provider?: AiModelProvider;
  expectedOutput?: TOutput;
}): Promise<AiGatewayResponse<TOutput>> {
  const request = createAiGatewayRequest({
    purpose: input.purpose,
    contextPackage: input.contextPackage,
    traceId: input.traceId
  });
  const provider = input.provider ?? new MockAiModelProvider();
  const invocation: AiProviderInvocation<TOutput> = {
    request,
    policy: AURA_NOTE_AI_SAFETY_POLICY
  };
  if (input.expectedOutput !== undefined) {
    invocation.expectedOutput = input.expectedOutput;
  }
  const response = await provider.invoke<TOutput>(invocation);
  validateAiGatewayResponse(response);
  return response;
}

export function buildAiGovernanceEventPayload(input: {
  request: AiGatewayRequest<AiContextPackage>;
  response?: AiGatewayResponse;
  status: 'prepared' | 'phi_rejected' | 'context_scrubbed' | 'response_recorded' | 'output_rejected';
}) {
  return {
    purpose: input.request.purpose,
    outputType: input.request.outputType,
    promptId: input.request.promptId,
    promptVersion: input.request.promptVersion,
    modelVersion: input.response?.modelVersion ?? input.request.modelVersion,
    modelMode: input.response?.modelMode ?? 'mock',
    policyId: AURA_NOTE_AI_SAFETY_POLICY.policyId,
    policyMode: input.request.policyMode ?? AURA_NOTE_AI_SAFETY_POLICY.mode,
    contextPackageId: input.request.context.contextPackageId,
    sourceEvidenceIds: input.request.context.sourceIds,
    redactedPaths: input.request.context.redactedPaths,
    rejectedPaths: input.request.context.rejectedPaths,
    humanReviewRequired: true,
    status: input.status
  };
}

function isAiContextPackage(value: unknown): value is AiContextPackage {
  return Boolean(value && typeof value === 'object' && 'contextPackageId' in value && 'sourceIds' in value);
}

function scanForUnredactedForbiddenPhiKeys(value: unknown): { paths: string[] } {
  const rawScan = scanForForbiddenPhiKeys(value);
  if (!rawScan.containsForbiddenPhi) {
    return { paths: [] };
  }

  const paths = rawScan.paths.filter((path) => valueAtPath(value, path) !== '[REDACTED]');
  return { paths };
}

function valueAtPath(value: unknown, path: string): unknown {
  return path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean)
    .reduce<unknown>((current, segment) => {
      if (Array.isArray(current)) {
        return current[Number(segment)];
      }
      if (current && typeof current === 'object') {
        return (current as Record<string, unknown>)[segment];
      }
      return undefined;
    }, value);
}
