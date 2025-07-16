import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Token not provided');
    }

    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new UnauthorizedException('JWT configuration error');
    }

    try {      
      const payload = await this.jwtService.verifyAsync(token, {secret: jwtSecret}) as JwtPayload;
      request['user'] = payload; // attach user to request
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
