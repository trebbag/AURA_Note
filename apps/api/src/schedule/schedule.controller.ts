import { Body, Controller, Get, Headers, Inject, Param, Post } from '@nestjs/common';
import type { CreateAppointmentRequestDto } from '@aura-note/contracts';
import { ScheduleService } from './schedule.service';

@Controller('schedule/appointments')
export class ScheduleController {
  constructor(@Inject(ScheduleService) private readonly scheduleService: ScheduleService) {}

  @Get()
  listAppointments(@Headers() headers: Record<string, string | string[] | undefined>) {
    return this.scheduleService.listAppointments(this.scheduleService.createRequestContext(headers));
  }

  @Post()
  createAppointment(
    @Body() body: CreateAppointmentRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.createAppointment(body, this.scheduleService.createRequestContext(headers));
  }

  @Post(':appointmentId/start-visit')
  startVisit(
    @Param('appointmentId') appointmentId: string,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.startVisit(appointmentId, this.scheduleService.createRequestContext(headers));
  }
}
