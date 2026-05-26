import { Body, Controller, Get, Headers, Inject, Post } from '@nestjs/common';
import type { AiGatewayInvocationRequestDto } from '@aura-note/contracts';
import { AiService } from './ai.service';

@Controller('ai-gateway')
export class AiController {
  constructor(@Inject(AiService) private readonly aiService: AiService) {}

  @Get('status')
  getStatus(@Headers() headers: Record<string, string | string[] | undefined>) {
    return this.aiService.getStatus(headers);
  }

  @Post('mock-invocations')
  invokeMock(
    @Body() body: AiGatewayInvocationRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.aiService.invokeMock(body, headers);
  }
}
