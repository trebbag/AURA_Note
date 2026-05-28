import { Body, Controller, Get, Headers, Inject, Param, Post } from '@nestjs/common';
import type {
  AddVisitSelectionRequestDto,
  AppendRecordingChunkRequestDto,
  ApprovalRequestDto,
  BillingAttestRequestDto,
  CorrectTranscriptSegmentRequestDto,
  EhrWritebackRequestDto,
  AppendTranscriptSegmentRequestDto,
  CompareEditUpdateRequestDto,
  CreateHistoryGapTaskRequestDto,
  FinalizationSelectionDecisionRequestDto,
  FinalizationSuggestionDecisionRequestDto,
  RecordMicrophonePermissionRequestDto,
  RecordingExceptionRequestDto,
  RebeautifyRequestDto,
  SecureDownloadRequestDto,
  SuggestionDecisionRequestDto
} from '@aura-note/contracts';
import { ScheduleService } from '../schedule/schedule.service';

@Controller()
export class NotesController {
  constructor(@Inject(ScheduleService) private readonly scheduleService: ScheduleService) {}

  @Get('notes/drafts')
  listDraftNotes(@Headers() headers: Record<string, string | string[] | undefined>) {
    return this.scheduleService.listDraftNotes(this.scheduleService.createRequestContext(headers));
  }

  @Get('notes/finalized')
  listFinalizedNotes(@Headers() headers: Record<string, string | string[] | undefined>) {
    return this.scheduleService.listFinalizedNotes(this.scheduleService.createRequestContext(headers));
  }

  @Get('notes/finalized/:noteId')
  getFinalizedNote(
    @Param('noteId') noteId: string,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.getFinalizedNote(noteId, this.scheduleService.createRequestContext(headers));
  }

  @Get('documentation-workspace/appointments/:appointmentId')
  getDocumentationWorkspace(
    @Param('appointmentId') appointmentId: string,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.getDocumentationWorkspaceByAppointment(
      appointmentId,
      this.scheduleService.createRequestContext(headers)
    );
  }

  @Post('documentation-workspace/appointments/:appointmentId/visit-session/pause')
  pauseVisit(@Param('appointmentId') appointmentId: string, @Headers() headers: Record<string, string | string[] | undefined>) {
    return this.scheduleService.pauseVisit(appointmentId, this.scheduleService.createRequestContext(headers));
  }

  @Post('documentation-workspace/appointments/:appointmentId/visit-session/resume')
  resumeVisit(@Param('appointmentId') appointmentId: string, @Headers() headers: Record<string, string | string[] | undefined>) {
    return this.scheduleService.resumeVisit(appointmentId, this.scheduleService.createRequestContext(headers));
  }

  @Post('documentation-workspace/appointments/:appointmentId/visit-session/stop')
  stopVisit(@Param('appointmentId') appointmentId: string, @Headers() headers: Record<string, string | string[] | undefined>) {
    return this.scheduleService.stopVisit(appointmentId, this.scheduleService.createRequestContext(headers));
  }

  @Post('documentation-workspace/appointments/:appointmentId/recording-exception')
  approveRecordingException(
    @Param('appointmentId') appointmentId: string,
    @Body() body: RecordingExceptionRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.approveRecordingException(
      appointmentId,
      body,
      this.scheduleService.createRequestContext(headers)
    );
  }

  @Post('documentation-workspace/appointments/:appointmentId/recording/permission')
  recordMicrophonePermission(
    @Param('appointmentId') appointmentId: string,
    @Body() body: RecordMicrophonePermissionRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.recordMicrophonePermission(
      appointmentId,
      body,
      this.scheduleService.createRequestContext(headers)
    );
  }

  @Post('documentation-workspace/appointments/:appointmentId/recording/chunks')
  appendRecordingChunk(
    @Param('appointmentId') appointmentId: string,
    @Body() body: AppendRecordingChunkRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.appendRecordingChunk(
      appointmentId,
      body,
      this.scheduleService.createRequestContext(headers)
    );
  }

  @Get('documentation-workspace/appointments/:appointmentId/recording/retention')
  getRecordingRetention(
    @Param('appointmentId') appointmentId: string,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.getRecordingRetention(appointmentId, this.scheduleService.createRequestContext(headers));
  }

  @Get('documentation-workspace/appointments/:appointmentId/transcription/provider-status')
  getTranscriptionProviderStatus(
    @Param('appointmentId') appointmentId: string,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.getTranscriptionProviderStatus(
      appointmentId,
      this.scheduleService.createRequestContext(headers)
    );
  }

  @Post('documentation-workspace/appointments/:appointmentId/transcription/jobs/mock')
  processMockTranscriptionJob(
    @Param('appointmentId') appointmentId: string,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.processMockTranscriptionJob(appointmentId, this.scheduleService.createRequestContext(headers));
  }

  @Get('documentation-workspace/appointments/:appointmentId/transcript')
  getTranscript(@Param('appointmentId') appointmentId: string, @Headers() headers: Record<string, string | string[] | undefined>) {
    return this.scheduleService.getTranscriptByAppointment(appointmentId, this.scheduleService.createRequestContext(headers));
  }

  @Post('documentation-workspace/appointments/:appointmentId/transcript/segments')
  appendTranscriptSegment(
    @Param('appointmentId') appointmentId: string,
    @Body() body: AppendTranscriptSegmentRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.appendTranscriptSegment(
      appointmentId,
      body,
      this.scheduleService.createRequestContext(headers)
    );
  }

  @Post('documentation-workspace/appointments/:appointmentId/transcript/segments/:transcriptSegmentId/correction')
  correctTranscriptSegment(
    @Param('appointmentId') appointmentId: string,
    @Param('transcriptSegmentId') transcriptSegmentId: string,
    @Body() body: CorrectTranscriptSegmentRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.correctTranscriptSegment(
      appointmentId,
      transcriptSegmentId,
      body,
      this.scheduleService.createRequestContext(headers)
    );
  }

  @Get('notes/:noteId/suggestions')
  listSuggestions(@Param('noteId') noteId: string, @Headers() headers: Record<string, string | string[] | undefined>) {
    return this.scheduleService.listSuggestions(noteId, this.scheduleService.createRequestContext(headers));
  }

  @Post('notes/:noteId/suggestions/evaluate')
  evaluateSuggestions(@Param('noteId') noteId: string, @Headers() headers: Record<string, string | string[] | undefined>) {
    return this.scheduleService.evaluateSuggestions(noteId, this.scheduleService.createRequestContext(headers));
  }

  @Post('notes/:noteId/suggestions/:suggestionId/accept')
  acceptSuggestion(
    @Param('noteId') noteId: string,
    @Param('suggestionId') suggestionId: string,
    @Body() body: SuggestionDecisionRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.acceptSuggestion(
      noteId,
      suggestionId,
      body,
      this.scheduleService.createRequestContext(headers)
    );
  }

  @Post('notes/:noteId/suggestions/:suggestionId/remove')
  removeSuggestion(
    @Param('noteId') noteId: string,
    @Param('suggestionId') suggestionId: string,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.removeSuggestion(noteId, suggestionId, this.scheduleService.createRequestContext(headers));
  }

  @Get('notes/:noteId/visit-selections')
  listVisitSelections(
    @Param('noteId') noteId: string,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.listVisitSelections(noteId, this.scheduleService.createRequestContext(headers));
  }

  @Post('notes/:noteId/visit-selections')
  addVisitSelection(
    @Param('noteId') noteId: string,
    @Body() body: AddVisitSelectionRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.addVisitSelection(noteId, body, this.scheduleService.createRequestContext(headers));
  }

  @Get('notes/:noteId/compliance')
  evaluateCompliance(@Param('noteId') noteId: string, @Headers() headers: Record<string, string | string[] | undefined>) {
    return this.scheduleService.evaluateCompliance(noteId, this.scheduleService.createRequestContext(headers));
  }

  @Get('notes/:noteId/history-gaps')
  listHistoryGaps(@Param('noteId') noteId: string, @Headers() headers: Record<string, string | string[] | undefined>) {
    return this.scheduleService.listHistoryGaps(noteId, this.scheduleService.createRequestContext(headers));
  }

  @Post('notes/:noteId/history-gaps/:questionId/tasks')
  createHistoryGapTask(
    @Param('noteId') noteId: string,
    @Param('questionId') questionId: string,
    @Body() body: CreateHistoryGapTaskRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.createHistoryGapTask(
      noteId,
      questionId,
      body,
      this.scheduleService.createRequestContext(headers)
    );
  }

  @Get('notes/:noteId/finalization')
  getFinalizationSession(
    @Param('noteId') noteId: string,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.getFinalizationSession(noteId, this.scheduleService.createRequestContext(headers));
  }

  @Post('notes/:noteId/finalization/start')
  startFinalization(@Param('noteId') noteId: string, @Headers() headers: Record<string, string | string[] | undefined>) {
    return this.scheduleService.startFinalization(noteId, this.scheduleService.createRequestContext(headers));
  }

  @Post('notes/:noteId/finalization/code-review/selections/:visitSelectionId')
  decideFinalizationSelection(
    @Param('noteId') noteId: string,
    @Param('visitSelectionId') visitSelectionId: string,
    @Body() body: FinalizationSelectionDecisionRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.decideFinalizationSelection(
      noteId,
      visitSelectionId,
      body,
      this.scheduleService.createRequestContext(headers)
    );
  }

  @Post('notes/:noteId/finalization/code-review/complete')
  completeCodeReview(@Param('noteId') noteId: string, @Headers() headers: Record<string, string | string[] | undefined>) {
    return this.scheduleService.completeCodeReview(noteId, this.scheduleService.createRequestContext(headers));
  }

  @Post('notes/:noteId/finalization/suggestion-review/suggestions/:suggestionId')
  decideFinalizationSuggestion(
    @Param('noteId') noteId: string,
    @Param('suggestionId') suggestionId: string,
    @Body() body: FinalizationSuggestionDecisionRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.decideFinalizationSuggestion(
      noteId,
      suggestionId,
      body,
      this.scheduleService.createRequestContext(headers)
    );
  }

  @Post('notes/:noteId/finalization/suggestion-review/complete')
  completeSuggestionReview(
    @Param('noteId') noteId: string,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.completeSuggestionReview(noteId, this.scheduleService.createRequestContext(headers));
  }

  @Post('notes/:noteId/finalization/compose')
  composeFinalizationDrafts(
    @Param('noteId') noteId: string,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.composeFinalizationDrafts(noteId, this.scheduleService.createRequestContext(headers));
  }

  @Post('notes/:noteId/finalization/compare-edit/original')
  updateCompareEditOriginal(
    @Param('noteId') noteId: string,
    @Body() body: CompareEditUpdateRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.updateCompareEditOriginal(noteId, body, this.scheduleService.createRequestContext(headers));
  }

  @Post('notes/:noteId/finalization/compare-edit/rebeautify')
  rebeautifyFinalization(
    @Param('noteId') noteId: string,
    @Body() body: RebeautifyRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.rebeautifyFinalization(noteId, body, this.scheduleService.createRequestContext(headers));
  }

  @Post('notes/:noteId/finalization/compare-edit/approve-note')
  approveFinalNote(
    @Param('noteId') noteId: string,
    @Body() body: ApprovalRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.approveFinalNote(noteId, body, this.scheduleService.createRequestContext(headers));
  }

  @Post('notes/:noteId/finalization/compare-edit/approve-summary')
  approvePatientSummary(
    @Param('noteId') noteId: string,
    @Body() body: ApprovalRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.approvePatientSummary(noteId, body, this.scheduleService.createRequestContext(headers));
  }

  @Post('notes/:noteId/finalization/billing-attest/draft-claim-preview')
  generateDraftClaimPreview(
    @Param('noteId') noteId: string,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.generateDraftClaimPreview(noteId, this.scheduleService.createRequestContext(headers));
  }

  @Post('notes/:noteId/finalization/billing-attest/complete')
  completeBillingAttest(
    @Param('noteId') noteId: string,
    @Body() body: BillingAttestRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.completeBillingAttest(noteId, body, this.scheduleService.createRequestContext(headers));
  }

  @Post('notes/:noteId/finalization/sign-dispatch')
  signAndDispatch(
    @Param('noteId') noteId: string,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.signAndDispatch(noteId, this.scheduleService.createRequestContext(headers));
  }

  @Post('notes/:noteId/exports/final-note-pdf')
  generateFinalNotePdf(@Param('noteId') noteId: string, @Headers() headers: Record<string, string | string[] | undefined>) {
    return this.scheduleService.generateFinalNotePdf(noteId, this.scheduleService.createRequestContext(headers));
  }

  @Post('notes/:noteId/exports/patient-summary-pdf')
  generatePatientSummaryPdf(
    @Param('noteId') noteId: string,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.generatePatientSummaryPdf(noteId, this.scheduleService.createRequestContext(headers));
  }

  @Post('notes/:noteId/exports/final-note-copy')
  copyFinalNote(@Param('noteId') noteId: string, @Headers() headers: Record<string, string | string[] | undefined>) {
    return this.scheduleService.copyFinalNote(noteId, this.scheduleService.createRequestContext(headers));
  }

  @Post('notes/:noteId/exports/patient-summary-copy')
  copyPatientSummary(@Param('noteId') noteId: string, @Headers() headers: Record<string, string | string[] | undefined>) {
    return this.scheduleService.copyPatientSummary(noteId, this.scheduleService.createRequestContext(headers));
  }

  @Post('notes/:noteId/exports/structured')
  exportStructuredFinalNote(
    @Param('noteId') noteId: string,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.exportStructuredFinalNote(noteId, this.scheduleService.createRequestContext(headers));
  }

  @Post('notes/:noteId/exports/:exportArtifactId/download')
  deliverExportDownload(
    @Param('noteId') noteId: string,
    @Param('exportArtifactId') exportArtifactId: string,
    @Body() body: SecureDownloadRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.deliverExportDownload(
      noteId,
      exportArtifactId,
      body.signedDownloadToken,
      this.scheduleService.createRequestContext(headers)
    );
  }

  @Post('notes/:noteId/ehr-writeback')
  requestEhrWriteback(
    @Param('noteId') noteId: string,
    @Body() body: EhrWritebackRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.requestEhrWriteback(noteId, body, this.scheduleService.createRequestContext(headers));
  }
}
