import { HttpException, HttpStatus } from '@nestjs/common';

export class UserAlreadyExistsException extends HttpException {
  constructor(email: string) {
    super(
      {
        message: 'User already exists',
        error: 'DUPLICATE_USER',
        details: `A user with email '${email}' already exists`,
        statusCode: HttpStatus.CONFLICT,
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class InvalidCredentialsException extends HttpException {
  constructor() {
    super(
      {
        message: 'Invalid credentials',
        error: 'AUTHENTICATION_FAILED', 
        details: 'The provided email or password is incorrect',
        statusCode: HttpStatus.UNAUTHORIZED,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class DatabaseConstraintException extends HttpException {
  constructor(constraint: string, value: string) {
    super(
      {
        message: 'Database constraint violation',
        error: 'CONSTRAINT_VIOLATION',
        details: `Duplicate value '${value}' for constraint '${constraint}'`,
        statusCode: HttpStatus.CONFLICT,
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class TokenExpiredException extends HttpException {
  constructor() {
    super(
      {
        message: 'Token has expired',
        error: 'TOKEN_EXPIRED',
        details: 'The provided authentication token has expired',
        statusCode: HttpStatus.UNAUTHORIZED,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class InvalidTokenException extends HttpException {
  constructor() {
    super(
      {
        message: 'Invalid token',
        error: 'INVALID_TOKEN',
        details: 'The provided authentication token is invalid',
        statusCode: HttpStatus.UNAUTHORIZED,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class ResourceNotFoundException extends HttpException {
  constructor(resource: string, identifier?: string) {
    const details = identifier 
      ? `${resource} with identifier '${identifier}' was not found`
      : `The requested ${resource} was not found`;
      
    super(
      {
        message: `${resource} not found`,
        error: 'RESOURCE_NOT_FOUND',
        details,
        statusCode: HttpStatus.NOT_FOUND,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class ValidationException extends HttpException {
  constructor(field: string, value: any, reason: string) {
    super(
      {
        message: 'Validation failed',
        error: 'VALIDATION_ERROR',
        details: `Field '${field}' with value '${value}' failed validation: ${reason}`,
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class AccessDeniedException extends HttpException {
  constructor(resource?: string) {
    const details = resource 
      ? `Access denied to ${resource}`
      : 'You do not have permission to access this resource';
      
    super(
      {
        message: 'Access denied',
        error: 'ACCESS_DENIED',
        details,
        statusCode: HttpStatus.FORBIDDEN,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}