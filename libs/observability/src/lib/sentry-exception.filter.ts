import {
  Catch,
  ArgumentsHost,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import * as Sentry from '@sentry/node';

/**
 * SentryExceptionFilter — يلتقط الـ exceptions غير المُتوقَّعة فقط
 * (يتجاهل HttpException المتوقَّعة مثل NotFound / Unauthorized).
 *
 * يجب تسجيله كـ APP_FILTER في الـ root module.
 */
@Catch()
export class SentryExceptionFilter
  extends BaseExceptionFilter
  implements ExceptionFilter
{
  private readonly logger = new Logger(SentryExceptionFilter.name);

  constructor(httpAdapterHost: HttpAdapterHost) {
    super(httpAdapterHost.httpAdapter);
  }

  override catch(exception: unknown, host: ArgumentsHost): void {
    const isHttpContext = host.getType<string>() === 'http';

    // لا ترسل HTTP exceptions ذات الصلة بالعميل (4xx) إلى Sentry — هذه ليست أخطاء سيرفر.
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (status < 500) {
        if (isHttpContext) {
          super.catch(exception, host);
          return;
        }
        throw exception;
      }
    }

    Sentry.captureException(exception);
    this.logger.error(
      `Unhandled exception captured by Sentry: ${exception}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    if (isHttpContext) {
      super.catch(exception, host);
      return;
    }

    // ارمي مجدداً لكي يعالجها Nest الافتراضي.
    throw exception;
  }
}
