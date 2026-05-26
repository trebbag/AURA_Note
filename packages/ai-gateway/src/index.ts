import { containsForbiddenPhiKeys } from '@aura-note/security';

export type AiOutputType = 'suggestion' | 'draft' | 'candidate' | 'summary' | 'coaching_feedback';

export interface AiGatewayRequest<TContext = unknown> {
  tenantId: string;
  purpose: 'suggestions' | 'compose_note' | 'patient_summary' | 'billing_preview' | 'coaching';
  context: TContext;
  outputType: AiOutputType;
  traceId: string;
}

export interface AiGatewayResponse<TOutput = unknown> {
  output: TOutput;
  outputType: AiOutputType;
  modelMode: 'mock' | 'private_baa' | 'external_disabled';
  confidence?: number;
  warnings: string[];
}

export function assertNoRawPhi(request: AiGatewayRequest): void {
  if (containsForbiddenPhiKeys(request.context)) {
    throw new Error('AI gateway rejected request containing forbidden PHI keys.');
  }
}

export async function invokeMockAi<TOutput = unknown>(request: AiGatewayRequest): Promise<AiGatewayResponse<TOutput>> {
  assertNoRawPhi(request);
  return {
    output: {} as TOutput,
    outputType: request.outputType,
    modelMode: 'mock',
    confidence: 0.8,
    warnings: ['Mock AI output. Replace through WO-009.']
  };
}
