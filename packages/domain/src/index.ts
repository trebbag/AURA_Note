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

export interface VisitSessionGate {
  noteId: string;
  timerState: TimerState;
  recordingState: RecordingState;
  editorUnlocked: boolean;
  exceptionReason?: string;
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

export interface SignDispatchReadiness {
  tasks: BlockingTaskState[];
  finalNoteApproved: boolean;
  patientSummaryApproved: boolean;
}

export const LOW_CONFIDENCE_DIAGNOSIS_THRESHOLD = 0.75;

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

export function isTaskAdjudicatedForSigning(status: TaskAdjudicationStatus): boolean {
  return status === 'answered' || status === 'closed' || status === 'assigned';
}

export function blocksSigning(tasks: BlockingTaskState[]): boolean {
  return tasks.some((task) => task.blocksSigning && !isTaskAdjudicatedForSigning(task.adjudicationStatus));
}

export function canSignAndDispatch(readiness: SignDispatchReadiness): boolean {
  return readiness.finalNoteApproved && readiness.patientSummaryApproved && !blocksSigning(readiness.tasks);
}

export function getNextWizardStep(completedSteps: readonly WizardStep[]): WizardStep | null {
  return FINALIZATION_WIZARD_STEPS.find((step) => !completedSteps.includes(step)) ?? null;
}

export function canCompleteWizardStep(completedSteps: readonly WizardStep[], candidate: WizardStep): boolean {
  return getNextWizardStep(completedSteps) === candidate;
}
