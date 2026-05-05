import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateAvailabilityDto } from './dto/create-availability.dto'

const publicAvailabilitySelect = {
  id: true,
  staffId: true,
  dayOfWeek: true,
  startTime: true,
  endTime: true,
  isActive: true,
  createdAt: true,
  staff: {
    select: {
      id: true,
      businessId: true,
      name: true,
      roleTitle: true,
      isActive: true,
      business: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  },
} as const

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  async createAvailability(createAvailabilityDto: CreateAvailabilityDto) {
    const staff = await this.prisma.staff.findUnique({
      where: { id: createAvailabilityDto.staffId },
      select: { id: true, isActive: true },
    })

    if (!staff) {
      throw new NotFoundException('El staff no existe')
    }

    if (!staff.isActive) {
      throw new ConflictException('El staff no esta activo')
    }

    const startMinutes = this.toMinutes(createAvailabilityDto.startTime)
    const endMinutes = this.toMinutes(createAvailabilityDto.endTime)

    if (endMinutes <= startMinutes) {
      throw new ConflictException('La hora de fin debe ser mayor a la hora de inicio')
    }

    const sameDayAvailabilities = await this.prisma.staffAvailability.findMany({
      where: {
        staffId: createAvailabilityDto.staffId,
        dayOfWeek: createAvailabilityDto.dayOfWeek,
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
      },
    })

    const overlaps = sameDayAvailabilities.some((availability) => {
      const existingStart = this.toMinutes(availability.startTime)
      const existingEnd = this.toMinutes(availability.endTime)

      return startMinutes < existingEnd && endMinutes > existingStart
    })

    if (overlaps) {
      throw new ConflictException('Ya existe un bloque de horario traslapado para este staff')
    }

    return this.prisma.staffAvailability.create({
      data: createAvailabilityDto,
      select: publicAvailabilitySelect,
    })
  }

  async getAvailabilities() {
    return this.prisma.staffAvailability.findMany({
      select: publicAvailabilitySelect,
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    })
  }

  private toMinutes(time: string) {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }
}
