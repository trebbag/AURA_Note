import { Body, Controller, Get, Headers, Inject, Param, Patch, Post, Query } from '@nestjs/common';
import type {
  AppointmentStatusActionRequestDto,
  CreateAppointmentRequestDto,
  CreateStandalonePatientRequestDto,
  UpdateAppointmentRequestDto,
  UpdateStandalonePatientRequestDto
} from '@aura-note/contracts';
import { ScheduleService } from './schedule.service';

@Controller('standalone/patients')
export class StandalonePatientsController {
  constructor(@Inject(ScheduleService) private readonly scheduleService: ScheduleService) {}

  @Get()
  searchPatients(
    @Query() query: { safePatientId?: string; status?: 'active' | 'inactive' },
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.searchPatients(query, this.scheduleService.createRequestContext(headers));
  }

  @Post()
  createPatient(
    @Body() body: CreateStandalonePatientRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.createPatient(body, this.scheduleService.createRequestContext(headers));
  }

  @Patch(':safePatientId')
  updatePatient(
    @Param('safePatientId') safePatientId: string,
    @Body() body: UpdateStandalonePatientRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.updatePatient(safePatientId, body, this.scheduleService.createRequestContext(headers));
  }
}

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

  @Patch(':appointmentId')
  updateAppointment(
    @Param('appointmentId') appointmentId: string,
    @Body() body: UpdateAppointmentRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.updateAppointment(appointmentId, body, this.scheduleService.createRequestContext(headers));
  }

  @Post(':appointmentId/status')
  updateAppointmentStatus(
    @Param('appointmentId') appointmentId: string,
    @Body() body: AppointmentStatusActionRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.updateAppointmentStatus(appointmentId, body, this.scheduleService.createRequestContext(headers));
  }

  @Get(':appointmentId/chart-context')
  getChartContext(
    @Param('appointmentId') appointmentId: string,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.getChartContextSnapshot(appointmentId, this.scheduleService.createRequestContext(headers));
  }

  @Post(':appointmentId/start-visit')
  startVisit(
    @Param('appointmentId') appointmentId: string,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.scheduleService.startVisit(appointmentId, this.scheduleService.createRequestContext(headers));
  }
}
