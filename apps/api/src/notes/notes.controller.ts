import { Controller, Get, Headers, Inject, Param } from '@nestjs/common';
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
}
