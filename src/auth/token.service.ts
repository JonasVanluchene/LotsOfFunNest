import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { TokenPair, RefreshTokenPayload } from '../common/interfaces/token.interface';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { InvalidTokenException, TokenExpiredException } from '../common/exceptions/custom-exceptions';
import { randomUUID } from 'crypto';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async generateTokenPair(userId: number, userName: string): Promise<TokenPair> {
    const tokenId = randomUUID();
    
    // Access token payload
    const accessPayload: JwtPayload = {
      sub: userId,
      userName,
      iat: Math.floor(Date.now() / 1000),
    };

    // Refresh token payload
    const refreshPayload: RefreshTokenPayload = {
      sub: userId,
      userName,
      tokenId,
      iat: Math.floor(Date.now() / 1000),
    };

    const accessTokenExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '15m');
    const refreshTokenExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');

    // Generate tokens
    const accessToken = this.jwtService.sign(accessPayload, {
      expiresIn: accessTokenExpiresIn,
      issuer: 'lots-of-fun-app',
      audience: 'lots-of-fun-users',
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: refreshTokenExpiresIn,
      issuer: 'lots-of-fun-app',
      audience: 'lots-of-fun-users',
    });

    // Store refresh token in database
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setTime(
      refreshTokenExpiry.getTime() + this.convertToMilliseconds(refreshTokenExpiresIn)
    );

    try {
      await this.prisma.refreshToken.create({
        data: {
          id: tokenId,
          userId,
          token: refreshToken,
          expiresAt: refreshTokenExpiry,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to store refresh token: ${error.message}`);
      throw new Error('Token generation failed');
    }

    const expiresInSeconds = this.convertToSeconds(accessTokenExpiresIn);
    
    return {
      accessToken,
      refreshToken,
      expiresIn: expiresInSeconds.toString(),
    };
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    try {
      // Verify refresh token
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        issuer: 'lots-of-fun-app',
        audience: 'lots-of-fun-users',
      }) as RefreshTokenPayload;

      // Check if refresh token exists in database and is not expired
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { id: payload.tokenId },
        include: { user: true },
      });

      if (!storedToken) {
        this.logger.warn(`Refresh token not found in database: ${payload.tokenId}`);
        throw new InvalidTokenException();
      }

      if (storedToken.expiresAt < new Date()) {
        this.logger.warn(`Expired refresh token used: ${payload.tokenId}`);
        // Clean up expired token
        await this.prisma.refreshToken.delete({
          where: { id: payload.tokenId },
        });
        throw new TokenExpiredException();
      }

      if (storedToken.token !== refreshToken) {
        this.logger.warn(`Invalid refresh token: ${payload.tokenId}`);
        throw new InvalidTokenException();
      }

      // Generate new token pair
      const newTokenPair = await this.generateTokenPair(
        storedToken.userId,
        storedToken.user.userName
      );

      // Delete old refresh token
      await this.prisma.refreshToken.delete({
        where: { id: payload.tokenId },
      });

      this.logger.log(`Tokens refreshed for user: ${storedToken.user.email}`);
      return newTokenPair;

    } catch (error) {
      if (error instanceof InvalidTokenException || error instanceof TokenExpiredException) {
        throw error;
      }

      this.logger.error(`Token refresh failed: ${error.message}`);
      throw new InvalidTokenException();
    }
  }

  async revokeRefreshToken(tokenId: string): Promise<void> {
    try {
      await this.prisma.refreshToken.delete({
        where: { id: tokenId },
      });
      this.logger.log(`Refresh token revoked: ${tokenId}`);
    } catch (error) {
      this.logger.warn(`Failed to revoke refresh token: ${tokenId}`);
    }
  }

  async revokeAllUserTokens(userId: number): Promise<void> {
    try {
      const result = await this.prisma.refreshToken.deleteMany({
        where: { userId },
      });
      this.logger.log(`Revoked ${result.count} refresh tokens for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to revoke all tokens for user ${userId}: ${error.message}`);
    }
  }

  async cleanupExpiredTokens(): Promise<void> {
    try {
      const result = await this.prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });
      this.logger.log(`Cleaned up ${result.count} expired refresh tokens`);
    } catch (error) {
      this.logger.error(`Failed to cleanup expired tokens: ${error.message}`);
    }
  }

  private convertToSeconds(duration: string): number {
    const durationRegex = /^(\d+)([smhd])$/;
    const match = duration.match(durationRegex);

    if (!match) {
      this.logger.warn(`Invalid duration format: ${duration}, using default 15m`);
      return 15 * 60; // 15 minutes default
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

  private convertToMilliseconds(duration: string): number {
    return this.convertToSeconds(duration) * 1000;
  }
}
