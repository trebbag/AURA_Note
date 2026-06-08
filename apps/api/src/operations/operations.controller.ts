import { Body, Controller, Get, Headers, Inject, Param, Patch, Post } from '@nestjs/common';
import type {
  CreateTemplateRequestDto,
  PublishRulesCatalogRequestDto,
  UpdateBillingReviewRequestDto,
  UpdateDotPhraseRequestDto,
  UpdateEstimateConfigurationRequestDto,
  UpdateIntegrationRequestDto,
  UpdateOperationalTaskRequestDto
} from '@aura-note/contracts';
import { OperationsService } from './operations.service';

@Controller('standalone/operations')
export class OperationsController {
  constructor(@Inject(OperationsService) private readonly operationsService: OperationsService) {}

  @Get('runtime')
  getOperationsRuntime(@Headers() headers: Record<string, string | string[] | undefined>) {
    return this.operationsService.getOperationsRuntime(this.operationsService.createRequestContext(headers));
  }

  @Get('tasks')
  listTasks(@Headers() headers: Record<string, string | string[] | undefined>) {
    return this.operationsService.listTasks(this.operationsService.createRequestContext(headers));
  }

  @Patch('tasks/:taskId')
  updateTask(
    @Param('taskId') taskId: string,
    @Body() body: UpdateOperationalTaskRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.operationsService.updateTask(taskId, body, this.operationsService.createRequestContext(headers));
  }

  @Get('billing-review')
  listBillingReviews(@Headers() headers: Record<string, string | string[] | undefined>) {
    return this.operationsService.listBillingReviews(this.operationsService.createRequestContext(headers));
  }

  @Patch('billing-review/:billingReviewId')
  updateBillingReview(
    @Param('billingReviewId') billingReviewId: string,
    @Body() body: UpdateBillingReviewRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.operationsService.updateBillingReview(
      billingReviewId,
      body,
      this.operationsService.createRequestContext(headers)
    );
  }

  @Get('settings')
  getSettings(@Headers() headers: Record<string, string | string[] | undefined>) {
    return this.operationsService.getSettings(this.operationsService.createRequestContext(headers));
  }

  @Patch('settings/integrations/:integrationId')
  updateIntegration(
    @Param('integrationId') integrationId: string,
    @Body() body: UpdateIntegrationRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.operationsService.updateIntegration(
      integrationId,
      body,
      this.operationsService.createRequestContext(headers)
    );
  }

  @Get('templates')
  listTemplates(@Headers() headers: Record<string, string | string[] | undefined>) {
    return this.operationsService.listTemplates(this.operationsService.createRequestContext(headers));
  }

  @Post('templates')
  createTemplate(
    @Body() body: CreateTemplateRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.operationsService.createTemplate(body, this.operationsService.createRequestContext(headers));
  }

  @Patch('dot-phrases/:dotPhraseId')
  updateDotPhrase(
    @Param('dotPhraseId') dotPhraseId: string,
    @Body() body: UpdateDotPhraseRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.operationsService.updateDotPhrase(dotPhraseId, body, this.operationsService.createRequestContext(headers));
  }

  @Get('estimate-config')
  getEstimateConfig(@Headers() headers: Record<string, string | string[] | undefined>) {
    return this.operationsService.getEstimateConfig(this.operationsService.createRequestContext(headers));
  }

  @Patch('estimate-config')
  updateEstimateConfig(
    @Body() body: UpdateEstimateConfigurationRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.operationsService.updateEstimateConfig(body, this.operationsService.createRequestContext(headers));
  }

  @Get('rules-catalog')
  listRulesCatalog(@Headers() headers: Record<string, string | string[] | undefined>) {
    return this.operationsService.listRulesCatalog(this.operationsService.createRequestContext(headers));
  }

  @Post('rules-catalog/publish')
  publishRulesCatalog(
    @Body() body: PublishRulesCatalogRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.operationsService.publishRulesCatalog(body, this.operationsService.createRequestContext(headers));
  }
}
