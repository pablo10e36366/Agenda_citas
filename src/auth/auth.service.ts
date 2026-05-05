import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service'
import { LoginDto } from './dto/login.dto'
import { UserRole } from './roles/role.enum'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        createdAt: true,
      },
    })

    if (!user) {
      throw new UnauthorizedException('Credenciales invalidas')
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password)

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales invalidas')
    }

    const { password, ...userWithoutPassword } = user
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
    })

    return {
      message: 'Login exitoso',
      access_token: accessToken,
      user: userWithoutPassword,
    }
  }
}
