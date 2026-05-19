import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, retry, timer } from 'rxjs';

const CONNECTION_ERROR_PATTERNS = [
  'Connection terminated',
  'Connection terminated unexpectedly',
  'timeout exceeded when trying to connect',
  'ECONNRESET',
  'ECONNREFUSED',
];

function isConnectionError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return CONNECTION_ERROR_PATTERNS.some((p) => msg.includes(p));
}

@Injectable()
export class DbRetryInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DbRetryInterceptor.name);

  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      retry({
        count: 4,
        delay: (error: unknown, attempt: number) => {
          if (!isConnectionError(error)) throw error;
          // Exponential backoff: 2s, 4s, 8s, 16s — gives Neon time to cold-start
          const delayMs = Math.min(2000 * Math.pow(2, attempt - 1), 30000);
          this.logger.warn(
            `DB connection error (attempt ${attempt}/4), retrying in ${delayMs}ms: ${(error as Error).message}`,
          );
          return timer(delayMs);
        },
      }),
    );
  }
}
