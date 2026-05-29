import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureAuraApi } from './runtime/api-runtime';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureAuraApi(app);
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 4000);
}

bootstrap();
