import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TokenService } from './token.service';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../database/database.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        const expiresIn = config.get<string>('JWT_EXPIRES_IN', '15m'); // Shorter for access tokens
        
        if (!secret) {
          throw new Error('JWT_SECRET is required but not configured');
        }
        
        if (secret.length < 32) {
          console.warn('WARNING: JWT_SECRET is shorter than recommended (32+ characters)');
        }

        return {
          secret,
          signOptions: { 
            expiresIn,
            issuer: 'lots-of-fun-app',
            audience: 'lots-of-fun-users',
          },
        };
      },
    }),
  ],
  providers: [AuthService, TokenService],
  controllers: [AuthController],
  exports: [JwtModule, AuthService, TokenService]
})
export class AuthModule {}
