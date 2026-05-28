import type {
  AddVisitSelectionRequestDto,
  ApiEnvelope,
  ApprovalRequestDto,
  BillingAttestRequestDto,
  CreateAppointmentRequestDto,
  CreateAppointmentResponseDto,
  ExportActionResponseDto,
  FinalizationActionResponseDto,
  FinalizedNoteDetailDto,
  FinalizedNotesViewDto,
  ScheduleViewDto,
  StartVisitResponseDto
} from '@aura-note/contracts';

export type AuraNoteRuntimeRole = 'clinician' | 'ma' | 'billing_staff' | 'admin' | 'authorized_admin' | 'compliance_privacy_lead' | 'support';

export interface AuraNoteApiClientOptions {
  baseUrl?: string;
  role?: AuraNoteRuntimeRole;
  userId?: string;
  tenantId?: string;
  siteId?: string;
}

const defaultBillingAttestationStatements = [
  'I have reviewed and accepted the final note.',
  'I have reviewed and accepted the patient summary.',
  'I have reviewed selected codes/items and understand they remain my responsibility.',
  'I have resolved, closed, or assigned open history questions.',
  'I understand the draft claim preview is a support tool and not an automated claim submission.'
];

export const frontendRuntimeBillingAttestationStatements = defaultBillingAttestationStatements;

export function getAuraNoteApiBaseUrl() {
  return process.env.AURA_NOTE_API_BASE_URL ?? process.env.NEXT_PUBLIC_AURA_NOTE_API_BASE_URL ?? 'http://127.0.0.1:4000/api/v1';
}

export function createAuraNoteApiClient(options: AuraNoteApiClientOptions = {}) {
  const baseUrl = (options.baseUrl ?? getAuraNoteApiBaseUrl()).replace(/\/$/, '');
  const role = options.role ?? 'clinician';
  const userId = options.userId ?? `user-${role}-synthetic-runtime`;
  const tenantId = options.tenantId ?? 'tenant-synthetic-primary';
  const siteId = options.siteId ?? 'site-synthetic-primary';

  async function request<TData>(path: string, init: RequestInit = {}): Promise<ApiEnvelope<TData>> {
    const headers = new Headers(init.headers);
    headers.set('content-type', headers.get('content-type') ?? 'application/json');
    headers.set('x-aura-role', role);
    headers.set('x-aura-user-id', userId);
    headers.set('x-aura-tenant-id', tenantId);
    headers.set('x-aura-site-id', siteId);

    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
      cache: 'no-store'
    });
    const payload = (await response.json()) as ApiEnvelope<TData> | { message?: string; error?: string };
    if (!response.ok) {
      const message = 'message' in payload && payload.message ? payload.message : `AURA Note API request failed: ${response.status}`;
      throw new Error(Array.isArray(message) ? message.join('; ') : message);
    }
    return payload as ApiEnvelope<TData>;
  }

  function post<TData>(path: string, body?: object, idempotencyKey?: string) {
    return request<TData>(path, {
      method: 'POST',
      ...(idempotencyKey ? { headers: { 'idempotency-key': idempotencyKey } } : {}),
      body: body ? JSON.stringify(body) : '{}'
    });
  }

  return {
    listSchedule: () => request<ScheduleViewDto>('/schedule/appointments'),
    listFinalizedNotes: () => request<FinalizedNotesViewDto>('/notes/finalized'),
    getFinalizedNote: (noteId: string) => request<FinalizedNoteDetailDto>(`/notes/finalized/${noteId}`),
    createAppointment: (body: CreateAppointmentRequestDto, idempotencyKey?: string) =>
      post<CreateAppointmentResponseDto>('/schedule/appointments', body, idempotencyKey),
    startVisit: (appointmentId: string) => post<StartVisitResponseDto>(`/schedule/appointments/${appointmentId}/start-visit`),
    addVisitSelection: (noteId: string, body: AddVisitSelectionRequestDto) =>
      post(`/notes/${noteId}/visit-selections`, body),
    startFinalization: (noteId: string) => post<FinalizationActionResponseDto>(`/notes/${noteId}/finalization/start`),
    decideFinalizationSelection: (noteId: string, visitSelectionId: string, decision: 'keep' | 'remove') =>
      post<FinalizationActionResponseDto>(`/notes/${noteId}/finalization/code-review/selections/${visitSelectionId}`, { decision }),
    completeCodeReview: (noteId: string) => post<FinalizationActionResponseDto>(`/notes/${noteId}/finalization/code-review/complete`),
    decideFinalizationSuggestion: (noteId: string, suggestionId: string, decision: 'keep' | 'remove', reason?: string) =>
      post<FinalizationActionResponseDto>(`/notes/${noteId}/finalization/suggestion-review/suggestions/${suggestionId}`, {
        decision,
        ...(reason ? { reason } : {})
      }),
    completeSuggestionReview: (noteId: string) =>
      post<FinalizationActionResponseDto>(`/notes/${noteId}/finalization/suggestion-review/complete`),
    composeFinalizationDrafts: (noteId: string) => post<FinalizationActionResponseDto>(`/notes/${noteId}/finalization/compose`),
    approveFinalNote: (noteId: string, body: ApprovalRequestDto) =>
      post<FinalizationActionResponseDto>(`/notes/${noteId}/finalization/compare-edit/approve-note`, body),
    approvePatientSummary: (noteId: string, body: ApprovalRequestDto) =>
      post<FinalizationActionResponseDto>(`/notes/${noteId}/finalization/compare-edit/approve-summary`, body),
    generateDraftClaimPreview: (noteId: string) =>
      post<FinalizationActionResponseDto>(`/notes/${noteId}/finalization/billing-attest/draft-claim-preview`),
    completeBillingAttest: (noteId: string, body: BillingAttestRequestDto) =>
      post<FinalizationActionResponseDto>(`/notes/${noteId}/finalization/billing-attest/complete`, body),
    signAndDispatch: (noteId: string) => post<FinalizationActionResponseDto>(`/notes/${noteId}/finalization/sign-dispatch`),
    generateFinalNotePdf: (noteId: string) => post<ExportActionResponseDto>(`/notes/${noteId}/exports/final-note-pdf`)
  };
}
