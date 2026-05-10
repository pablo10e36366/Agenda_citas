import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateClientDto } from './dto/create-client.dto'

const publicClientSelect = {
  id: true,
  businessId: true,
  name: true,
  email: true,
  phone: true,
  notes: true,
  isActive: true,
  createdAt: true,
  business: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
} as const

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async createClient(createClientDto: CreateClientDto) {
    const business = await this.prisma.business.findUnique({
      where: { id: createClientDto.businessId },
      select: { id: true },
    })

    if (!business) {
      throw new NotFoundException('El negocio no existe')
    }

    if (createClientDto.email) {
      const existingClientByEmail = await this.prisma.client.findUnique({
        where: {
          businessId_email: {
            businessId: createClientDto.businessId,
            email: createClientDto.email,
          },
        },
        select: { id: true },
      })

      if (existingClientByEmail) {
        throw new ConflictException(
          'El email del cliente ya esta registrado en este negocio',
        )
      }
    }

    if (createClientDto.phone) {
      const existingClientByPhone = await this.prisma.client.findUnique({
        where: {
          businessId_phone: {
            businessId: createClientDto.businessId,
            phone: createClientDto.phone,
          },
        },
        select: { id: true },
      })

      if (existingClientByPhone) {
        throw new ConflictException(
          'El telefono del cliente ya esta registrado en este negocio',
        )
      }
    }

    try {
      return await this.prisma.client.create({
        data: createClientDto,
        select: publicClientSelect,
      })
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'El cliente ya tiene un dato unico repetido en este negocio',
        )
      }

      throw error
    }
  }

  async getClients() {
    return this.prisma.client.findMany({
      select: publicClientSelect,
      orderBy: { createdAt: 'desc' },
    })
  }
}
