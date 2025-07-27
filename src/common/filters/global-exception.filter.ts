import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string;
  error?: string;
  details?: string;
  stack?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    const timestamp = new Date().toISOString();
    const path = request.url;
    const method = request.method;

    let status: number;
    let message: string;
    let error: string;
    let details: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
        error = responseObj.error || exception.name;
        details = responseObj.details;
      } else {
        message = exception.message;
        error = exception.name;
      }
    } else if (exception instanceof Error) {
      // Handle Prisma and other known errors
      if (exception.message.includes('P2002')) {
        status = HttpStatus.CONFLICT;
        message = 'Resource already exists';
        error = 'DUPLICATE_RESOURCE';
        details = 'A resource with the provided data already exists';
      } else if (exception.message.includes('P2025')) {
        status = HttpStatus.NOT_FOUND;
        message = 'Resource not found';
        error = 'RESOURCE_NOT_FOUND';
        details = 'The requested resource could not be found';
      } else {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Internal server error';
        error = 'INTERNAL_ERROR';
        details = 'An unexpected error occurred';
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'UNKNOWN_ERROR';
      details = 'An unknown error occurred';
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp,
      path,
      method,
      message,
      error,
      details,
    };

    // Add stack trace in development mode
    const isDevelopment = this.configService.get<string>('NODE_ENV') !== 'production';
    if (isDevelopment && exception instanceof Error) {
      errorResponse.stack = exception.stack;
    }

    // Log the error with appropriate level
    const logMessage = `${method} ${path} - ${status} - ${message}`;
    
    if (status >= 500) {
      this.logger.error(logMessage, exception instanceof Error ? exception.stack : undefined);
    } else if (status >= 400) {
      this.logger.warn(logMessage);
    } else {
      this.logger.log(logMessage);
    }

    // Log additional context for debugging
    if (isDevelopment) {
      this.logger.debug(`Request body: ${JSON.stringify(request.body)}`);
      this.logger.debug(`Request params: ${JSON.stringify(request.params)}`);
      this.logger.debug(`Request query: ${JSON.stringify(request.query)}`);
    }

    response.status(status).json(errorResponse);
  }
}
