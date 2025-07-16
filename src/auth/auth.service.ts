import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
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
    const accessToken = this.jwtService.sign(payload);
    return { accessToken, expiresIn: 3600 };
  }
}
