import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateServiceDto } from './dto/create-service.dto'

const publicServiceSelect = {
  id: true,
  businessId: true,
  name: true,
  slug: true,
  description: true,
  durationMinutes: true,
  price: true,
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
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async createService(createServiceDto: CreateServiceDto) {
    const business = await this.prisma.business.findUnique({
      where: { id: createServiceDto.businessId },
      select: { id: true },
    })

    if (!business) {
      throw new NotFoundException('El negocio no existe')
    }

    const existingService = await this.prisma.service.findUnique({
      where: {
        businessId_slug: {
          businessId: createServiceDto.businessId,
          slug: createServiceDto.slug,
        },
      },
      select: { id: true },
    })

    if (existingService) {
      throw new ConflictException('El slug del servicio ya esta registrado en este negocio')
    }

    try {
      return await this.prisma.service.create({
        data: createServiceDto,
        select: publicServiceSelect,
      })
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('El slug del servicio ya esta registrado en este negocio')
      }

      throw error
    }
  }

  async getServices() {
    return this.prisma.service.findMany({
      select: publicServiceSelect,
      orderBy: { createdAt: 'desc' },
    })
  }
}
