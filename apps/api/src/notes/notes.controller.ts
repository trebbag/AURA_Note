import { Body, Controller, Get, Headers, Inject, Param, Post } from '@nestjs/common';
import type { AppendTranscriptSegmentRequestDto, RecordingExceptionRequestDto } from '@aura-note/contracts';
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
}
