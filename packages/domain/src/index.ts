export type AppMode = 'standalone' | 'clinicos_integrated';

export type NoteState =
  | 'shell_created'
  | 'draft_not_started'
  | 'visit_active'
  | 'visit_paused'
  | 'documentation_in_progress'
  | 'ready_to_finalize'
  | 'finalization_code_review'
  | 'finalization_suggestion_review'
  | 'finalization_compose'
  | 'finalization_compare_edit'
  | 'finalization_billing_attest'
  | 'finalization_sign_dispatch'
  | 'blocked_compliance'
  | 'blocked_history_gap'
  | 'blocked_billing_review'
  | 'finalized'
  | 'exported'
  | 'writeback_pending'
  | 'writeback_complete'
  | 'writeback_failed';

export type AppointmentState =
  | 'scheduled'
  | 'checked_in'
  | 'in_room'
  | 'visit_started'
  | 'visit_paused'
  | 'visit_completed'
  | 'finalization_in_progress'
  | 'finalized'
  | 'cancelled'
  | 'no_show';

export type VisitSelectionCategory =
  | 'cpt'
  | 'hcpcs'
  | 'icd10'
  | 'hcc'
  | 'em'
  | 'quality_measure'
  | 'diagnosis'
  | 'differential'
  | 'service'
  | 'procedure'
  | 'appointment_to_schedule'
  | 'plan_item'
  | 'staff_task';

export type WizardStep =
  | 'code_review'
  | 'suggestion_review'
  | 'compose'
  | 'compare_edit'
  | 'billing_attest'
  | 'sign_dispatch';

export type WizardStepStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';
export type FinalizationSelectionDecision = 'keep' | 'remove' | 'convert_to_task' | 'send_follow_up';
export type FinalizationSuggestionDecision = 'keep' | 'remove';

export const FINALIZATION_WIZARD_STEPS: readonly WizardStep[] = [
  'code_review',
  'suggestion_review',
  'compose',
  'compare_edit',
  'billing_attest',
  'sign_dispatch'
] as const;

export type TaskAdjudicationStatus = 'open' | 'answered' | 'closed' | 'assigned' | 'deferred';
export type TimerState = 'not_started' | 'running' | 'paused' | 'stopped';
export type RecordingState = 'not_started' | 'recording' | 'paused' | 'stopped' | 'exception_approved';
export type AppointmentSource = 'standalone' | 'ehr_import' | 'clinicos';
export type AppointmentModality = 'in_person' | 'telehealth' | 'phone';

export interface AppointmentRef {
  appointmentId: string;
  noteId: string;
}

export interface NoteRef {
  noteId: string;
  appointmentId: string;
}

export interface AppointmentNoteInvariant {
  appointmentId: string;
  noteId: string;
  relationship: 'one_to_one';
}

export interface AppointmentDraft {
  tenantId: string;
  siteId: string;
  safePatientId: string;
  clinicianId: string;
  visitType: string;
  startsAt: string;
  durationMinutes: number;
  modality: AppointmentModality;
  source: AppointmentSource;
  reasonForVisit?: string;
}

export interface AppointmentLifecycle {
  appointmentId: string;
  noteId: string;
  appointmentState: AppointmentState;
  noteState: NoteState;
  noteVisibleInDrafts: boolean;
}

export interface VisitSessionGate {
  noteId: string;
  timerState: TimerState;
  recordingState: RecordingState;
  editorUnlocked: boolean;
  exceptionReason?: string;
}

export interface RawAudioRetentionMetadata {
  recordingId: string;
  noteId: string;
  retentionClass: 'audio_ephemeral';
  capturedAt: string;
  purgeAfter: string;
  purgeEligible: boolean;
}

export interface TranscriptRetentionMetadata {
  transcriptId: string;
  noteId: string;
  retentionClass: 'transcript';
  retentionPolicy: 'indefinite';
}

export interface BlockingTaskState {
  blocksSigning: boolean;
  adjudicationStatus: TaskAdjudicationStatus;
}

export interface LowConfidenceOverrideInput {
  confidence: number;
  overrideReason?: string;
  supportingEvidence?: string;
  nonSupportingEvidence?: string;
  uncertaintyExplanation?: string;
  confidenceImprovementPlan?: string;
}

export interface LowConfidenceOverrideDecision {
  overrideRequired: boolean;
  accepted: boolean;
  flagsBillingReview: boolean;
  flagsCoachingReview: boolean;
}

export interface SuggestionAcceptanceInput extends LowConfidenceOverrideInput {
  category: VisitSelectionCategory;
}

export interface ComplianceGateInput {
  hardBlockCount: number;
  unresolvedBlockerTaskCount: number;
}

export interface SignDispatchReadiness {
  tasks: BlockingTaskState[];
  finalNoteApproved: boolean;
  patientSummaryApproved: boolean;
}

export interface FinalizationStartReadiness {
  noteState: NoteState;
  hardBlockCount: number;
  unresolvedBlockerTaskCount: number;
}

export interface CodeReviewReadiness {
  requiredDecisionCount: number;
  completedDecisionCount: number;
  unresolvedBlockerTaskCount: number;
}

export interface SuggestionReviewReadiness {
  includedSuggestionCount: number;
  completedDecisionCount: number;
}

export interface ComposeReadiness {
  enhancedNoteGenerated: boolean;
  patientSummaryGenerated: boolean;
  patientSummaryContainsInternalDetails: boolean;
}

export interface CompareEditReadiness {
  finalNoteApproved: boolean;
  patientSummaryApproved: boolean;
  enhancedOutputStale: boolean;
}

export interface BillingAttestReadiness {
  finalNoteApproved: boolean;
  patientSummaryApproved: boolean;
  draftClaimPreviewGenerated: boolean;
  requiredAttestationsAccepted: boolean;
  estimateCaveatAcknowledged: boolean;
  unresolvedBlockerTaskCount: number;
  criticalPayerEvidenceGapCount: number;
}

export interface SignDispatchGateReadiness extends SignDispatchReadiness {
  billingAttested: boolean;
}

export const LOW_CONFIDENCE_DIAGNOSIS_THRESHOLD = 0.75;
const patientSummaryForbiddenPattern = /\b(revenue|claim|payer|billing|cpt|hcpcs|icd-?10|hcc|modifier|medical necessity|confidence|coaching)\b/i;

export function validateAppointmentDraft(draft: AppointmentDraft): string[] {
  const errors: string[] = [];
  if (!draft.tenantId.trim()) errors.push('tenantId is required');
  if (!draft.siteId.trim()) errors.push('siteId is required');
  if (!draft.safePatientId.trim()) errors.push('safePatientId is required');
  if (!draft.clinicianId.trim()) errors.push('clinicianId is required');
  if (!draft.visitType.trim()) errors.push('visitType is required');
  if (!Number.isInteger(draft.durationMinutes) || draft.durationMinutes < 5 || draft.durationMinutes > 480) {
    errors.push('durationMinutes must be an integer between 5 and 480');
  }
  if (Number.isNaN(Date.parse(draft.startsAt))) {
    errors.push('startsAt must be a valid ISO date-time');
  }
  return errors;
}

export function createAppointmentLifecycle(
  appointmentId: string,
  noteId: string,
  draft: AppointmentDraft
): AppointmentLifecycle {
  const errors = validateAppointmentDraft(draft);
  if (errors.length > 0) {
    throw new Error(`invalid appointment draft: ${errors.join('; ')}`);
  }

  createAppointmentNoteInvariant({ appointmentId, noteId }, { appointmentId, noteId });

  return {
    appointmentId,
    noteId,
    appointmentState: 'scheduled',
    noteState: 'shell_created',
    noteVisibleInDrafts: false
  };
}

export function canStartVisit(appointmentState: AppointmentState, noteState: NoteState): boolean {
  return appointmentState !== 'cancelled' && appointmentState !== 'no_show' && noteState === 'shell_created';
}

export function startVisitLifecycle(lifecycle: AppointmentLifecycle): AppointmentLifecycle {
  if (!canStartVisit(lifecycle.appointmentState, lifecycle.noteState)) {
    throw new Error('visit cannot be started from the current appointment/note state');
  }

  return {
    ...lifecycle,
    appointmentState: 'visit_started',
    noteState: 'visit_active',
    noteVisibleInDrafts: true
  };
}

export function createAppointmentNoteInvariant(
  appointment: AppointmentRef,
  note: NoteRef
): AppointmentNoteInvariant {
  if (!appointment.appointmentId || !appointment.noteId || !note.appointmentId || !note.noteId) {
    throw new Error('appointment-note invariant requires appointment and note identifiers');
  }

  if (appointment.appointmentId !== note.appointmentId || appointment.noteId !== note.noteId) {
    throw new Error('appointment and note must reference each other one-to-one');
  }

  return {
    appointmentId: appointment.appointmentId,
    noteId: note.noteId,
    relationship: 'one_to_one'
  };
}

export function canEditNote(gate: VisitSessionGate): boolean {
  return gate.timerState === 'running' || gate.recordingState === 'exception_approved';
}

export function recordingExceptionIsActive(gate: VisitSessionGate): boolean {
  return gate.recordingState === 'exception_approved' && Boolean(gate.exceptionReason?.trim());
}

export function pauseVisitGate(gate: VisitSessionGate): VisitSessionGate {
  if (gate.timerState !== 'running') {
    throw new Error('visit timer can only be paused while running');
  }

  return {
    ...gate,
    timerState: 'paused',
    recordingState: gate.recordingState === 'recording' ? 'paused' : gate.recordingState,
    editorUnlocked: false
  };
}

export function resumeVisitGate(gate: VisitSessionGate): VisitSessionGate {
  if (gate.timerState !== 'paused') {
    throw new Error('visit timer can only be resumed from paused state');
  }

  return {
    ...gate,
    timerState: 'running',
    recordingState: gate.recordingState === 'paused' ? 'recording' : gate.recordingState,
    editorUnlocked: true
  };
}

export function stopVisitGate(gate: VisitSessionGate): VisitSessionGate {
  if (gate.timerState !== 'running' && gate.timerState !== 'paused') {
    throw new Error('visit timer can only be stopped after the visit starts');
  }

  return {
    ...gate,
    timerState: 'stopped',
    recordingState: gate.recordingState === 'exception_approved' ? 'exception_approved' : 'stopped',
    editorUnlocked: gate.recordingState === 'exception_approved'
  };
}

export function approveRecordingException(gate: VisitSessionGate, exceptionReason: string): VisitSessionGate {
  if (!exceptionReason.trim()) {
    throw new Error('recording exception requires an approved reason');
  }

  return {
    ...gate,
    timerState: gate.timerState === 'not_started' ? 'running' : gate.timerState,
    recordingState: 'exception_approved',
    exceptionReason,
    editorUnlocked: true
  };
}

export function createRawAudioRetentionMetadata(
  recordingId: string,
  noteId: string,
  capturedAt: string
): RawAudioRetentionMetadata {
  const capturedDate = new Date(capturedAt);
  if (!recordingId.trim() || !noteId.trim() || Number.isNaN(capturedDate.valueOf())) {
    throw new Error('raw audio retention metadata requires recording, note, and capture timestamp');
  }

  const purgeAfter = new Date(capturedDate);
  purgeAfter.setUTCDate(purgeAfter.getUTCDate() + 7);

  return {
    recordingId,
    noteId,
    retentionClass: 'audio_ephemeral',
    capturedAt: capturedDate.toISOString(),
    purgeAfter: purgeAfter.toISOString(),
    purgeEligible: false
  };
}

export function createTranscriptRetentionMetadata(
  transcriptId: string,
  noteId: string
): TranscriptRetentionMetadata {
  if (!transcriptId.trim() || !noteId.trim()) {
    throw new Error('transcript retention metadata requires transcript and note identifiers');
  }

  return {
    transcriptId,
    noteId,
    retentionClass: 'transcript',
    retentionPolicy: 'indefinite'
  };
}

export function isLowConfidenceDiagnosis(confidence: number): boolean {
  return confidence < LOW_CONFIDENCE_DIAGNOSIS_THRESHOLD;
}

export function evaluateLowConfidenceOverride(input: LowConfidenceOverrideInput): LowConfidenceOverrideDecision {
  const overrideRequired = isLowConfidenceDiagnosis(input.confidence);
  if (!overrideRequired) {
    return {
      overrideRequired,
      accepted: true,
      flagsBillingReview: false,
      flagsCoachingReview: false
    };
  }

  const requiredFields = [
    input.overrideReason,
    input.supportingEvidence,
    input.nonSupportingEvidence,
    input.uncertaintyExplanation,
    input.confidenceImprovementPlan
  ];
  const accepted = requiredFields.every((value) => Boolean(value?.trim()));

  return {
    overrideRequired,
    accepted,
    flagsBillingReview: accepted,
    flagsCoachingReview: accepted
  };
}

export function canAcceptSuggestion(input: SuggestionAcceptanceInput): LowConfidenceOverrideDecision {
  if (input.category !== 'diagnosis' && input.category !== 'icd10') {
    return {
      overrideRequired: false,
      accepted: true,
      flagsBillingReview: false,
      flagsCoachingReview: false
    };
  }

  return evaluateLowConfidenceOverride(input);
}

export function complianceBlocksFinalize(input: ComplianceGateInput): boolean {
  return input.hardBlockCount > 0 || input.unresolvedBlockerTaskCount > 0;
}

export function isTaskAdjudicatedForSigning(status: TaskAdjudicationStatus): boolean {
  return status === 'answered' || status === 'closed' || status === 'assigned';
}

export function blocksSigning(tasks: BlockingTaskState[]): boolean {
  return tasks.some((task) => task.blocksSigning && !isTaskAdjudicatedForSigning(task.adjudicationStatus));
}

export function canSignAndDispatch(readiness: SignDispatchReadiness): boolean {
  return readiness.finalNoteApproved && readiness.patientSummaryApproved && !blocksSigning(readiness.tasks);
}

export function canCompleteBillingAttest(readiness: BillingAttestReadiness): boolean {
  return (
    readiness.finalNoteApproved &&
    readiness.patientSummaryApproved &&
    readiness.draftClaimPreviewGenerated &&
    readiness.requiredAttestationsAccepted &&
    readiness.estimateCaveatAcknowledged &&
    readiness.unresolvedBlockerTaskCount === 0 &&
    readiness.criticalPayerEvidenceGapCount === 0
  );
}

export function canSignAndDispatchAfterBilling(readiness: SignDispatchGateReadiness): boolean {
  return readiness.billingAttested && canSignAndDispatch(readiness);
}

export function canStartFinalization(readiness: FinalizationStartReadiness): boolean {
  return (
    ['visit_active', 'documentation_in_progress', 'ready_to_finalize'].includes(readiness.noteState) &&
    readiness.hardBlockCount === 0 &&
    readiness.unresolvedBlockerTaskCount === 0
  );
}

export function canCompleteCodeReview(readiness: CodeReviewReadiness): boolean {
  return (
    readiness.requiredDecisionCount === readiness.completedDecisionCount &&
    readiness.unresolvedBlockerTaskCount === 0
  );
}

export function canCompleteSuggestionReview(readiness: SuggestionReviewReadiness): boolean {
  return readiness.includedSuggestionCount === readiness.completedDecisionCount;
}

export function patientSummaryContainsInternalDetails(text: string): boolean {
  return patientSummaryForbiddenPattern.test(text);
}

export function canCompleteCompose(readiness: ComposeReadiness): boolean {
  return (
    readiness.enhancedNoteGenerated &&
    readiness.patientSummaryGenerated &&
    !readiness.patientSummaryContainsInternalDetails
  );
}

export function canCompleteCompareEdit(readiness: CompareEditReadiness): boolean {
  return readiness.finalNoteApproved && readiness.patientSummaryApproved && !readiness.enhancedOutputStale;
}

export function getNextWizardStep(completedSteps: readonly WizardStep[]): WizardStep | null {
  return FINALIZATION_WIZARD_STEPS.find((step) => !completedSteps.includes(step)) ?? null;
}

export function canCompleteWizardStep(completedSteps: readonly WizardStep[], candidate: WizardStep): boolean {
  return getNextWizardStep(completedSteps) === candidate;
}
