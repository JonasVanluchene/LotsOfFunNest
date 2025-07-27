import { Body, Controller, HttpCode, Post, UseGuards, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { TokenPairDto } from './dto/token-pair.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ApiTags, ApiCreatedResponse, ApiOkResponse, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth-guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiCreatedResponse({ 
    type: TokenPairDto, 
    description: 'User successfully registered and returns JWT tokens.' 
  })
  register(@Body() dto: RegisterDto): Promise<TokenPairDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiOkResponse({ 
    type: TokenPairDto, 
    description: 'User logged in and receives JWT tokens.' 
  })
  login(@Body() dto: LoginDto): Promise<TokenPairDto> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiOkResponse({ 
    type: TokenPairDto, 
    description: 'New JWT tokens generated successfully.' 
  })
  async refreshTokens(@Body() dto: RefreshTokenDto): Promise<TokenPairDto> {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Delete('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(204)
  @ApiOperation({ summary: 'Logout and revoke refresh tokens' })
  @ApiOkResponse({ description: 'User logged out successfully.' })
  async logout(@CurrentUser() user: JwtPayload): Promise<void> {
    await this.authService.logout(user.sub);
  }
}
