import { ConflictException, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service'
import { CreateUserDto } from './dto/create-user.dto'

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} as const

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
      select: { id: true },
    })

    if (existingUser) {
      throw new ConflictException('El email ya esta registrado')
    }

    const { password, ...userData } = createUserDto
    const hashedPassword = await bcrypt.hash(password, 10)

    try {
      return await this.prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
        },
        select: publicUserSelect,
      })
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('El email ya esta registrado')
      }

      throw error
    }
  }

  async getUsers() {
    return this.prisma.user.findMany({
      select: publicUserSelect,
    })
  }
}
