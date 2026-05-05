import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateStaffDto } from './dto/create-staff.dto'

const publicStaffSelect = {
  id: true,
  businessId: true,
  name: true,
  email: true,
  phone: true,
  roleTitle: true,
  isActive: true,
  createdAt: true,
  business: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  staffServices: {
    select: {
      service: {
        select: {
          id: true,
          name: true,
          slug: true,
          durationMinutes: true,
          price: true,
          isActive: true,
        },
      },
    },
  },
} as const

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async createStaff(createStaffDto: CreateStaffDto) {
    const business = await this.prisma.business.findUnique({
      where: { id: createStaffDto.businessId },
      select: { id: true },
    })

    if (!business) {
      throw new NotFoundException('El negocio no existe')
    }

    if (createStaffDto.email) {
      const existingStaffByEmail = await this.prisma.staff.findUnique({
        where: {
          businessId_email: {
            businessId: createStaffDto.businessId,
            email: createStaffDto.email,
          },
        },
        select: { id: true },
      })

      if (existingStaffByEmail) {
        throw new ConflictException('El email del staff ya esta registrado en este negocio')
      }
    }

    if (createStaffDto.phone) {
      const existingStaffByPhone = await this.prisma.staff.findUnique({
        where: {
          businessId_phone: {
            businessId: createStaffDto.businessId,
            phone: createStaffDto.phone,
          },
        },
        select: { id: true },
      })

      if (existingStaffByPhone) {
        throw new ConflictException('El telefono del staff ya esta registrado en este negocio')
      }
    }

    const serviceIds = [...new Set(createStaffDto.serviceIds ?? [])]

    if (serviceIds.length > 0) {
      const services = await this.prisma.service.findMany({
        where: {
          id: { in: serviceIds },
          businessId: createStaffDto.businessId,
        },
        select: { id: true },
      })

      if (services.length !== serviceIds.length) {
        throw new NotFoundException('Uno o mas servicios no existen en este negocio')
      }
    }

    const { serviceIds: _serviceIds, ...staffData } = createStaffDto

    try {
      return await this.prisma.staff.create({
        data: {
          ...staffData,
          staffServices:
            serviceIds.length > 0
              ? {
                  create: serviceIds.map((serviceId) => ({
                    serviceId,
                  })),
                }
              : undefined,
        },
        select: publicStaffSelect,
      })
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('El staff ya tiene un dato unico repetido en este negocio')
      }

      throw error
    }
  }

  async getStaff() {
    return this.prisma.staff.findMany({
      select: publicStaffSelect,
      orderBy: { createdAt: 'desc' },
    })
  }
}
