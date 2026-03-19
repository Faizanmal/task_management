import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { randomUUID } from 'node:crypto';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<{
      method: string;
      url: string;
      headers: Record<string, string | undefined>;
    }>();

    const startedAt = Date.now();
    const requestId = request.headers['x-request-id'] ?? randomUUID();

    return next.handle().pipe(
      tap(() => {
        const response = httpContext.getResponse<{ statusCode: number }>();
        this.logger.log(
          `[${requestId}] ${request.method} ${request.url} ${response.statusCode} ${Date.now() - startedAt}ms`,
        );
      }),
    );
  }
}
