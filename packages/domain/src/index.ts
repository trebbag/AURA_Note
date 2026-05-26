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

export type TaskAdjudicationStatus = 'open' | 'answered' | 'closed' | 'assigned' | 'deferred';

export interface AppointmentNoteInvariant {
  appointmentId: string;
  noteId: string;
  relationship: 'one_to_one';
}

export interface VisitSessionGate {
  noteId: string;
  timerState: 'not_started' | 'running' | 'paused' | 'stopped';
  recordingState: 'not_started' | 'recording' | 'paused' | 'stopped' | 'exception_approved';
  editorUnlocked: boolean;
  exceptionReason?: string;
}

export function canEditNote(gate: VisitSessionGate): boolean {
  return gate.timerState === 'running' || gate.recordingState === 'exception_approved';
}

export function isLowConfidenceDiagnosis(confidence: number): boolean {
  return confidence < 0.75;
}

export function blocksSigning(tasks: Array<{ blocksSigning: boolean; adjudicationStatus: TaskAdjudicationStatus }>): boolean {
  return tasks.some((task) => task.blocksSigning && !['answered', 'closed', 'deferred'].includes(task.adjudicationStatus));
}
