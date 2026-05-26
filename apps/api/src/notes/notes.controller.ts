import { Body, Controller, Get, Headers, Inject, Param, Post } from '@nestjs/common';
import type {
  AddVisitSelectionRequestDto,
  AppendTranscriptSegmentRequestDto,
  CreateHistoryGapTaskRequestDto,
  RecordingExceptionRequestDto,
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
}
