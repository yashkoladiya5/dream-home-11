import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, Logger } from '@nestjs/common';
import { join } from 'path';
import helmet from 'helmet';
import compression from 'compression';
import * as Sentry from '@sentry/node';
import { AppModule } from './app.module';
import { SanitizePipe } from './common/pipes/sanitize.pipe';
import { SentryExceptionFilter } from './common/filters/sentry-exception.filter';
import { SentryInterceptor } from './common/interceptors/sentry.interceptor';
import { PinoLoggerService } from './common/logger/pino-logger.service';
import { createSwaggerConfig } from './common/config/swagger.config';
import { createValidationPipe } from './common/pipes/validation-pipe.config';
import { createCorsConfig } from './common/config/cors.config';
import { createHelmetConfig } from './common/config/helmet.config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const criticalVars = ['JWT_SECRET', 'DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE'];
  const nonCriticalVars = ['PORT', 'NODE_ENV'];

  const missingCritical = criticalVars.filter(v => !process.env[v]);
  const missingNonCritical = nonCriticalVars.filter(v => !process.env[v]);

  if (missingNonCritical.length > 0) {
    logger.warn(`Missing non-critical env vars: ${missingNonCritical.join(', ')}`);
  }

  if (missingCritical.length > 0) {
    logger.error(`Fatal: Missing critical env vars: ${missingCritical.join(', ')}`);
    process.exit(1);
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(PinoLoggerService));

  const sentryDsn = process.env.SENTRY_DSN;
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: process.env.NODE_ENV || 'development',
      release: `dreamhome11-api@${process.env.npm_package_version || '1.0.0'}`,
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.2'),
      beforeSend(event) {
        if (event.tags?.status_code) {
          const code = parseInt(event.tags.status_code as string, 10);
          if (code >= 400 && code < 500) return null;
        }
        return event;
      },
    });
  }

  app.useGlobalFilters(new SentryExceptionFilter());
  app.useGlobalInterceptors(new SentryInterceptor());

  app.set('trust proxy', 1);

  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
    threshold: 1024,
    level: 6,
  }));

  app.use(helmet(createHelmetConfig()));

  app.enableCors(createCorsConfig());

  const sanitizePipe = app.get(SanitizePipe);

  app.useGlobalPipes(
    createValidationPipe(),
    sanitizePipe,
  );

  app.enableShutdownHooks();

  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads/' });

  if (process.env.NODE_ENV !== 'production') {
    createSwaggerConfig(app);
    logger.log('Swagger docs enabled at /api/docs');
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`Server running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
}

const shutdownTimeout = parseInt(process.env.GRACEFUL_SHUTDOWN_TIMEOUT || '10000', 10);

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  setTimeout(() => {
    console.error('Forced shutdown after SIGTERM timeout');
    process.exit(1);
  }, shutdownTimeout);
});

process.on('SIGINT', () => {
  setTimeout(() => {
    console.error('Forced shutdown after SIGINT timeout');
    process.exit(1);
  }, shutdownTimeout);
});
