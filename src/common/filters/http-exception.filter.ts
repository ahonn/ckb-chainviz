/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorResponse } from '../schemas/error.schemas';

interface ExceptionResponseObject {
  message?: string;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    let errorCode = 'UNKNOWN_ERROR';
    let errorMessage = exception.message;

    switch (status) {
      case HttpStatus.NOT_FOUND:
        errorCode = 'NOT_FOUND';
        break;
      case HttpStatus.BAD_REQUEST:
        errorCode = 'INVALID_PARAMETER';
        break;
      case HttpStatus.TOO_MANY_REQUESTS:
        errorCode = 'RATE_LIMIT_EXCEEDED';
        break;
      case HttpStatus.INTERNAL_SERVER_ERROR:
        errorCode = 'INTERNAL_SERVER_ERROR';
        break;
    }

    const exceptionResponse = exception.getResponse();
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as ExceptionResponseObject;
      if (responseObj.message) {
        errorMessage = responseObj.message;
      }
    }

    const errorResponse: ErrorResponse = {
      error: {
        code: errorCode,
        message: errorMessage,
      },
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(errorResponse);
  }
}
