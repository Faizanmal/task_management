import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import { JwtPayload } from './jwt.strategy';

import { PrismaService } from '../prisma/prisma.service';

import * as bcrypt from 'bcrypt';

import { RegisterDto } from './dto/register.dto';

import { LoginDto } from './dto/login.dto';

import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,

    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, username, password } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          {
            email,
          },
          {
            username,
          },
        ],
      },
    });
    if (existingUser) {
      throw new ConflictException('Email or username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,

        username,

        password: hashedPassword,
      },
    });
    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,

      user.email,

      user.username,
    );
    return {
      accessToken,

      refreshToken,

      user: {
        id: user.id,

        email: user.email,

        username: user.username,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,

      user.email,

      user.username,
    );
    return {
      accessToken,

      refreshToken,

      user: {
        id: user.id,

        email: user.email,

        username: user.username,
      },
    };
  }

  async refresh(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      // Verify refresh token
      const decoded = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret:
          process.env.JWT_REFRESH_SECRET ||
          'refresh-secret-key-change-in-production',
      });
      // Check if token exists in database
      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: {
          token: refreshToken,
        },
      });
      if (!tokenRecord) {
        throw new UnauthorizedException('Refresh token not found');
      }

      if (tokenRecord.revokedAt) {
        throw new UnauthorizedException('Refresh token revoked');
      }

      // Check if token is not expired
      if (new Date() > tokenRecord.expiresAt) {
        // Delete expired token
        await this.prisma.refreshToken.delete({
          where: {
            id: tokenRecord.id,
          },
        });

        throw new UnauthorizedException('Refresh token expired');
      }

      // Get user
      const user = await this.prisma.user.findUnique({
        where: {
          id: decoded.sub,
        },
      });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      await this.prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { revokedAt: new Date() },
      });

      const { accessToken, refreshToken: newRefreshToken } =
        await this.generateTokens(user.id, user.email, user.username);

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        token: refreshToken,
      },
    });
  }

  private async generateTokens(
    userId: string,
    email: string,
    username: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    // Generate access token (short-lived)
    const accessToken = this.jwtService.sign(
      {
        sub: userId,
        email,
        username,
      },
      {
        secret:
          process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        expiresIn: '15m',
      },
    );

    // Generate refresh token (long-lived)
    const refreshToken = this.jwtService.sign(
      {
        sub: userId,
        email,
        username,
      },
      {
        secret:
          process.env.JWT_REFRESH_SECRET ||
          'refresh-secret-key-change-in-production',
        expiresIn: '7d',
      },
    );

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        expiresAt,
        userId,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
