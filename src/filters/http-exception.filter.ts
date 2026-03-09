import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    this.logger.error(
      `HTTP ${status} - ${JSON.stringify(message)}`,
      exception instanceof Error ? exception.stack : '',
    );

    const errorResponse =
      typeof message === 'string'
        ? { statusCode: status, message, timestamp: new Date().toISOString() }
        : {
            statusCode: status,
            ...(typeof message === 'object' ? message : { message }),
            timestamp: new Date().toISOString(),
          };

    response.status(status).json(errorResponse);
  }
}
