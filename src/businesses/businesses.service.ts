import { ConflictException, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateBusinessDto } from './dto/create-business.dto'

const publicBusinessSelect = {
  id: true,
  name: true,
  slug: true,
  contactEmail: true,
  phone: true,
  createdAt: true,
} as const

@Injectable()
export class BusinessesService {
  constructor(private prisma: PrismaService) {}

  async createBusiness(createBusinessDto: CreateBusinessDto) {
    const existingBusiness = await this.prisma.business.findUnique({
      where: { slug: createBusinessDto.slug },
      select: { id: true },
    })

    if (existingBusiness) {
      throw new ConflictException('El slug del negocio ya esta registrado')
    }

    try {
      return await this.prisma.business.create({
        data: createBusinessDto,
        select: publicBusinessSelect,
      })
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('El slug del negocio ya esta registrado')
      }

      throw error
    }
  }

  async getBusinesses() {
    return this.prisma.business.findMany({
      select: publicBusinessSelect,
      orderBy: { createdAt: 'desc' },
    })
  }
}
