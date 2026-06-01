import { Body, Controller, Get, Headers, Inject, Post } from '@nestjs/common';
import type {
  AiEvaluationRunRequestDto,
  AiGatewayInvocationRequestDto,
  AiOutputValidationRequestDto
} from '@aura-note/contracts';
import { AiService } from './ai.service';

@Controller('ai-gateway')
export class AiController {
  constructor(@Inject(AiService) private readonly aiService: AiService) {}

  @Get('status')
  getStatus(@Headers() headers: Record<string, string | string[] | undefined>) {
    return this.aiService.getStatus(headers);
  }

  @Get('runtime-boundary')
  getRuntimeBoundary(@Headers() headers: Record<string, string | string[] | undefined>) {
    return this.aiService.getRuntimeBoundary(headers);
  }

  @Post('mock-invocations')
  invokeMock(
    @Body() body: AiGatewayInvocationRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.aiService.invokeMock(body, headers);
  }

  @Post('evaluations/run')
  runEvaluations(
    @Body() body: AiEvaluationRunRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.aiService.runEvaluations(body, headers);
  }

  @Post('outputs/validate')
  validateOutput(
    @Body() body: AiOutputValidationRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.aiService.validateOutput(body, headers);
  }
}
