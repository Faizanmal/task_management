import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @Post('register')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async register(
    @Body(ValidationPipe)
    registerDto: RegisterDto,
  ): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }
  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login(
    @Body(ValidationPipe)
    loginDto: LoginDto,
  ): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }
  @Post('refresh')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async refresh(
    @Body(ValidationPipe)
    refreshTokenDto: RefreshTokenDto,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    return this.authService.refresh(refreshTokenDto.refreshToken);
  }
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @Body(ValidationPipe)
    refreshTokenDto: RefreshTokenDto,
  ): Promise<{
    message: string;
  }> {
    await this.authService.logout(refreshTokenDto.refreshToken);
    return {
      message: 'Logged out successfully',
    };
  }
}
