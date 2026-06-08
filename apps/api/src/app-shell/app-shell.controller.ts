import { Controller, Get, Headers, Inject } from '@nestjs/common';
import { AppShellService } from './app-shell.service';

@Controller('app-shell')
export class AppShellController {
  constructor(@Inject(AppShellService) private readonly appShellService: AppShellService) {}

  @Get()
  getAppShell(@Headers() headers: Record<string, string | string[] | undefined>) {
    return this.appShellService.getAppShell(headers);
  }
}
