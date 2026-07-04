import {
  Injectable,
  OnApplicationShutdown,
  Logger,
  Inject,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../redis/redis.constants';
import { PinoLoggerService } from '../logger/pino-logger.service';

@Injectable()
export class ShutdownHook implements OnApplicationShutdown {
  private readonly logger = new Logger(ShutdownHook.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
    private readonly dataSource: DataSource,
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly pinoLogger: PinoLoggerService,
  ) {}

  async onApplicationShutdown(signal: string) {
    const timeout = parseInt(
      process.env.GRACEFUL_SHUTDOWN_TIMEOUT || '10000',
      10,
    );
    this.logger.log(
      `Shutdown initiated (signal: ${signal}, timeout: ${timeout}ms)`,
    );

    const tasks: Promise<void>[] = [];

    const withTimeout = <T>(promise: Promise<T> | any, name: string): Promise<void> =>
      Promise.race([
        Promise.resolve(promise)
          .then(() => this.logger.log(`${name} closed`))
          .catch((err) => {
            this.logger.error(`${name} error`, err);
          }),
        new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error(`${name} timeout`)), timeout),
        ),
      ]).catch((err) => this.logger.warn(err.message));

    tasks.push(withTimeout(this.redisClient.quit(), 'Redis'));

    if (this.dataSource.isInitialized) {
      tasks.push(withTimeout(this.dataSource.destroy(), 'TypeORM'));
    }

    const httpServer = this.httpAdapterHost?.httpAdapter?.getHttpServer();
    if (httpServer) {
      tasks.push(
        new Promise<void>((resolve) => {
          httpServer.close((err: Error | undefined) => {
            if (err) this.logger.error('HTTP server close error', err);
            else this.logger.log('HTTP server closed');
            resolve();
          });
          setTimeout(() => {
            this.logger.warn('HTTP server shutdown timeout');
            resolve();
          }, timeout);
        }),
      );
    }

    await Promise.all(tasks);
    this.logger.log('Shutdown complete');
  }
}
