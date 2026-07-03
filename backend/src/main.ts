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

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));

  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [
        'https://dreamhome11.com',
        'https://www.dreamhome11.com',
        'https://admin.dreamhome11.com',
        'https://api.dreamhome11.com',
      ]
    : ['*'];

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id', 'X-Response-Time'],
    credentials: true,
    maxAge: 86400,
  });

  app.use((req, res, next) => {
    const start = Date.now();
    const { method, originalUrl } = req;
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (process.env.NODE_ENV !== 'production' || res.statusCode >= 400) {
        logger.log(`${method} ${originalUrl} ${res.statusCode} ${duration}ms`);
      }
    });
    next();
  });

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
  logger.log(`Server running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
