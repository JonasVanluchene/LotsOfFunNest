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