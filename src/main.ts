import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);

  // Get ConfigService
  const configService = app.get(ConfigService);

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to DTO instances
    }),
  );

  // Enable CORS
  const corsOrigins = configService
    .get<string>('CORS_ORIGIN', 'http://localhost:4200')
    .split(',');

  app.enableCors({
    origin: [
      'http://localhost:4200',
      'https://bid-manager-frontend.vercel.app',
      'https://autobidmanager.bid',
    ],
    credentials: true,
  });

  // Set global API prefix
  app.setGlobalPrefix('api');

  // Get port from environment
  const port = configService.get<number>('PORT', 3000);

  await app.listen(port);

  logger.log(`🚀 Backend running on http://localhost:${port}/api`);
  logger.log(`📊 Environment: ${configService.get<string>('NODE_ENV')}`);
  logger.log(`🔐 CORS Origins: ${corsOrigins.join(', ')}`);
}

bootstrap();
