import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate, OnModuleInit {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private jwtSecret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    this.validateJwtConfiguration();
  }

  private validateJwtConfiguration(): void {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const jwtExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN');

    if (!jwtSecret) {
      this.logger.error('JWT_SECRET is not configured');
      throw new Error('JWT_SECRET must be configured');
    }

    this.jwtSecret = jwtSecret;

    if (this.jwtSecret.length < 32) {
      this.logger.warn('JWT_SECRET is too short. Recommended minimum length is 32 characters');
    }

    if (!jwtExpiresIn) {
      this.logger.warn('JWT_EXPIRES_IN is not configured, using default');
    }

    this.logger.log('JWT configuration validated successfully');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      this.logger.debug('Missing Authorization header');
      throw new UnauthorizedException('Missing Authorization header');
    }

    if (!authHeader.startsWith('Bearer ')) {
      this.logger.debug('Invalid Authorization header format');
      throw new UnauthorizedException('Invalid Authorization header format');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    if (!token) {
      this.logger.debug('Token not provided');
      throw new UnauthorizedException('Token not provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.jwtSecret,
        // Additional security options
        ignoreExpiration: false,
        clockTolerance: 30, // 30 seconds tolerance for clock skew
      }) as JwtPayload;

      // Validate payload structure
      if (!payload.sub || !payload.userName) {
        this.logger.warn('Invalid JWT payload structure');
        throw new UnauthorizedException('Invalid token payload');
      }

      // Additional security: check token age
      if (payload.iat && Date.now() / 1000 - payload.iat > 7 * 24 * 60 * 60) { // 7 days max
        this.logger.warn('Token is too old');
        throw new UnauthorizedException('Token expired');
      }

      request['user'] = payload; // attach user to request
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      this.logger.debug(`Token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
