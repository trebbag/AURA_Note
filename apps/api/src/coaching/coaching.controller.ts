import { Controller, Get, Headers, Inject, Query } from '@nestjs/common';
import type { CoachingVisibilityMode } from '@aura-note/domain';
import { CoachingService } from './coaching.service';

@Controller('coaching')
export class CoachingController {
  constructor(@Inject(CoachingService) private readonly coachingService: CoachingService) {}

  @Get('own')
  getOwnCoaching(@Headers() headers: Record<string, string | string[] | undefined>) {
    return this.coachingService.getOwnCoaching(headers);
  }

  @Get('dashboard')
  getDashboard(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query('visibilityMode') visibilityMode?: CoachingVisibilityMode
  ) {
    return this.coachingService.getDashboard(headers, visibilityMode);
  }
}
