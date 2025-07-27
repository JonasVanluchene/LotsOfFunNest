import { Injectable, UnauthorizedException, Logger, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ConfigService } from '@nestjs/config';
import { TokenService } from './token.service';
import { 
  UserAlreadyExistsException, 
  InvalidCredentialsException,
  DatabaseConstraintException 
} from '../common/exceptions/custom-exceptions';
import { TokenPair } from '../common/interfaces/token.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService,
    private tokenService: TokenService,
  ) {}

  async register(dto: RegisterDto): Promise<TokenPair> {
    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser) {
        this.logger.warn(`Registration attempt with existing email: ${dto.email}`);
        throw new UserAlreadyExistsException(dto.email);
      }

      // Check for username conflicts
      const existingUsername = await this.prisma.user.findFirst({
        where: { userName: dto.userName },
      });

      if (existingUsername) {
        this.logger.warn(`Registration attempt with existing username: ${dto.userName}`);
        throw new ConflictException('Username already exists');
      }

      const hashedPassword = await bcrypt.hash(dto.password, 12); // Increased rounds for better security
      
      const user = await this.prisma.user.create({
        data: {
          userName: dto.userName,
          email: dto.email,
          passwordHash: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
          phone: dto.phone,
          street: dto.street,
          number: dto.number,
          unitNumber: dto.unitNumber,
          postalCode: dto.postalCode,
          city: dto.city,
          newsletter: dto.newsletter ?? false,
        },
      });

      this.logger.log(`User registered successfully: ${user.email}`);
      return this.tokenService.generateTokenPair(user.id, user.userName);
      
    } catch (error) {
      if (error instanceof UserAlreadyExistsException || error instanceof ConflictException) {
        throw error;
      }

      // Handle Prisma constraint violations
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0] || 'field';
        this.logger.error(`Database constraint violation on ${field} during registration`);
        throw new DatabaseConstraintException(field, field === 'email' ? dto.email : dto.userName);
      }

      this.logger.error(`Registration failed: ${error.message}`, error.stack);
      throw new ConflictException('Registration failed due to a conflict');
    }
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (!user) {
        this.logger.warn(`Login attempt with non-existent email: ${dto.email}`);
        throw new InvalidCredentialsException();
      }

      const valid = await bcrypt.compare(dto.password, user.passwordHash);
      if (!valid) {
        this.logger.warn(`Invalid password attempt for email: ${dto.email}`);
        throw new InvalidCredentialsException();
      }

      this.logger.log(`User logged in successfully: ${user.email}`);
      return this.tokenService.generateTokenPair(user.id, user.userName);
      
    } catch (error) {
      if (error instanceof InvalidCredentialsException) {
        throw error;
      }

      this.logger.error(`Login failed: ${error.message}`, error.stack);
      throw new InvalidCredentialsException();
    }
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    return this.tokenService.refreshTokens(refreshToken);
  }

  async logout(userId: number, tokenId?: string): Promise<void> {
    if (tokenId) {
      await this.tokenService.revokeRefreshToken(tokenId);
    } else {
      await this.tokenService.revokeAllUserTokens(userId);
    }
    this.logger.log(`User logged out: ${userId}`);
  }

  // Keep the old method for backward compatibility if needed
  private generateToken(userId: number, userName: string): AuthResponseDto {
    const payload = { 
      sub: userId, 
      userName,
      iat: Math.floor(Date.now() / 1000),
    };
    
    const expiresInConfig = this.configService.get<string>('JWT_EXPIRES_IN', '7d');
    const accessToken = this.jwtService.sign(payload, {
      issuer: 'lots-of-fun-app',
      audience: 'lots-of-fun-users',
    });

    const expiresInSeconds = this.convertToSeconds(expiresInConfig);
    return { 
      accessToken, 
      expiresIn: expiresInSeconds.toString(),
    };
  }

  private convertToSeconds(duration: string): number {
    const durationRegex = /^(\d+)([smhd])$/; // supports s, m, h, d
    const match = duration.match(durationRegex);

    if (!match) {
      this.logger.warn(`Invalid duration format: ${duration}, using default 7d`);
      return 7 * 24 * 60 * 60; // 7 days default
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 60 * 60,
      d: 60 * 60 * 24,
    };

    return value * multipliers[unit];
  }
}