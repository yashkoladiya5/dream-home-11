import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { SanitizePipe } from './common/pipes/sanitize.pipe';

async function bootstrap() {
  const criticalVars = ['JWT_SECRET', 'DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE'];
  const nonCriticalVars = ['PORT', 'NODE_ENV'];

  const missingCritical = criticalVars.filter(v => !process.env[v]);
  const missingNonCritical = nonCriticalVars.filter(v => !process.env[v]);

  if (missingNonCritical.length > 0) {
    console.warn(`[ENV] Warning: Missing non-critical env vars: ${missingNonCritical.join(', ')}`);
  }

  if (missingCritical.length > 0) {
    console.error(`[ENV] Fatal: Missing critical env vars: ${missingCritical.join(', ')}`);
    process.exit(1);
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));

  // CORS
  app.enableCors({
    origin: process.env.NODE_ENV === 'production'
      ? ['https://dreamhome11.com']
      : ['*'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Input validation
  const sanitizePipe = app.get(SanitizePipe);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      disableErrorMessages: process.env.NODE_ENV === 'production',
    }),
    sanitizePipe,
  );

  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads/' });

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
}
bootstrap().catch((err) => {
  console.error(err);
});
