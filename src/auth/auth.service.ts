import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
  const hashedPassword = await bcrypt.hash(dto.password, 10);
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
  return this.generateToken(user.id, user.userName);
}

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.generateToken(user.id, user.userName);
  }

  private generateToken(userId: number, userName: string): AuthResponseDto {
    const payload = { sub: userId, userName };
    const expiresInConfig = this.configService.get<string>('JWT_EXPIRES_IN') || '7d';
    const accessToken = this.jwtService.sign(payload);

    const expiresInSeconds = this.convertToSeconds(expiresInConfig);
    return { accessToken, expiresIn: expiresInSeconds.toString() };
  }


private convertToSeconds(duration: string): number {
  const durationRegex = /^(\d+)([smhd])$/; // supports s, m, h, d
  const match = duration.match(durationRegex);

  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
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