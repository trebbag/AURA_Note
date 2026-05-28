import { Body, Controller, Get, Headers, Inject, Param, Patch, Post } from '@nestjs/common';
import type {
  ProductionConfigValidationRequestDto,
  SessionEvaluationRequestDto,
  UpdateGovernedFeatureFlagRequestDto,
  UpdateWorkforceUserRequestDto
} from '@aura-note/contracts';
import { PlatformService } from './platform.service';

@Controller('platform')
export class PlatformController {
  constructor(@Inject(PlatformService) private readonly platformService: PlatformService) {}

  @Get('admin')
  getPlatformAdmin(@Headers() headers: Record<string, string | string[] | undefined>) {
    return this.platformService.getPlatformAdmin(this.platformService.createRequestContext(headers));
  }

  @Post('identity/session-evaluations')
  evaluateSession(
    @Body() body: SessionEvaluationRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.platformService.evaluateSession(body, this.platformService.createRequestContext(headers));
  }

  @Patch('identity/users/:userId')
  updateUser(
    @Param('userId') userId: string,
    @Body() body: UpdateWorkforceUserRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.platformService.updateUser(userId, body, this.platformService.createRequestContext(headers));
  }

  @Post('config/validate')
  validateConfig(
    @Body() body: ProductionConfigValidationRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.platformService.validateConfig(body, this.platformService.createRequestContext(headers));
  }

  @Patch('feature-flags/:key')
  updateFeatureFlag(
    @Param('key') key: string,
    @Body() body: UpdateGovernedFeatureFlagRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.platformService.updateFeatureFlag(key, body, this.platformService.createRequestContext(headers));
  }
}
