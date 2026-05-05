import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { AppointmentStatus, Prisma } from '@prisma/client'
import { NotificationsService } from '../notifications/notifications.service'
import { PrismaService } from '../prisma/prisma.service'
import { AppointmentDaySummaryDto } from './dto/appointment-day-summary.dto'
import { AppointmentFiltersDto } from './dto/appointment-filters.dto'
import { CreateAppointmentDto } from './dto/create-appointment.dto'
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto'
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto'

const publicAppointmentSelect = {
  id: true,
  businessId: true,
  serviceId: true,
  clientId: true,
  staffId: true,
  serviceNameSnapshot: true,
  durationMinutesSnapshot: true,
  priceSnapshot: true,
  startsAt: true,
  endsAt: true,
  status: true,
  notes: true,
  createdAt: true,
  business: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  service: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  client: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  },
  staff: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      roleTitle: true,
    },
  },
} as const

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async createAppointment(createAppointmentDto: CreateAppointmentDto) {
    const startsAt = new Date(createAppointmentDto.startsAt)

    this.ensureValidDate(startsAt)

    const business = await this.prisma.business.findUnique({
      where: { id: createAppointmentDto.businessId },
      select: { id: true },
    })

    if (!business) {
      throw new NotFoundException('El negocio no existe')
    }

    const service = await this.prisma.service.findUnique({
      where: { id: createAppointmentDto.serviceId },
      select: {
        id: true,
        businessId: true,
        name: true,
        durationMinutes: true,
        price: true,
        isActive: true,
      },
    })

    if (!service || service.businessId !== createAppointmentDto.businessId) {
      throw new NotFoundException('El servicio no existe en este negocio')
    }

    if (!service.isActive) {
      throw new ConflictException('El servicio no esta activo')
    }

    const client = await this.prisma.client.findUnique({
      where: { id: createAppointmentDto.clientId },
      select: {
        id: true,
        businessId: true,
        isActive: true,
      },
    })

    if (!client || client.businessId !== createAppointmentDto.businessId) {
      throw new NotFoundException('El cliente no existe en este negocio')
    }

    if (!client.isActive) {
      throw new ConflictException('El cliente no esta activo')
    }

    const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60000)

    await this.ensureClientAvailability(createAppointmentDto.clientId, startsAt, endsAt)
    await this.ensureStaffAvailability({
      appointmentIdToIgnore: undefined,
      businessId: createAppointmentDto.businessId,
      serviceId: createAppointmentDto.serviceId,
      staffId: createAppointmentDto.staffId,
      startsAt,
      endsAt,
    })

    const appointment = await this.prisma.appointment.create({
      data: {
        businessId: createAppointmentDto.businessId,
        serviceId: createAppointmentDto.serviceId,
        clientId: createAppointmentDto.clientId,
        staffId: createAppointmentDto.staffId,
        serviceNameSnapshot: service.name,
        durationMinutesSnapshot: service.durationMinutes,
        priceSnapshot: service.price,
        startsAt,
        endsAt,
        notes: createAppointmentDto.notes,
      },
      select: publicAppointmentSelect,
    })

    await this.notificationsService.createInternalNotification({
      businessId: appointment.businessId,
      appointmentId: appointment.id,
      clientId: appointment.clientId,
      type: 'APPOINTMENT_CREATED',
      message: `Cita creada para ${appointment.startsAt.toISOString()}`,
    })

    return appointment
  }

  async rescheduleAppointment(
    appointmentId: number,
    rescheduleAppointmentDto: RescheduleAppointmentDto,
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        businessId: true,
        serviceId: true,
        clientId: true,
        staffId: true,
        durationMinutesSnapshot: true,
        status: true,
      },
    })

    if (!appointment) {
      throw new NotFoundException('La cita no existe')
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new ConflictException('No puedes reprogramar una cita cancelada')
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new ConflictException('No puedes reprogramar una cita completada')
    }

    const startsAt = new Date(rescheduleAppointmentDto.startsAt)
    this.ensureValidDate(startsAt)

    const endsAt = new Date(
      startsAt.getTime() + appointment.durationMinutesSnapshot * 60000,
    )

    await this.ensureClientAvailability(
      appointment.clientId,
      startsAt,
      endsAt,
      appointment.id,
    )

    const finalStaffId =
      rescheduleAppointmentDto.staffId !== undefined
        ? rescheduleAppointmentDto.staffId
        : appointment.staffId ?? undefined

    await this.ensureStaffAvailability({
      appointmentIdToIgnore: appointment.id,
      businessId: appointment.businessId,
      serviceId: appointment.serviceId,
      staffId: finalStaffId,
      startsAt,
      endsAt,
    })

    const updatedAppointment = await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        staffId: finalStaffId,
        startsAt,
        endsAt,
      },
      select: publicAppointmentSelect,
    })

    await this.notificationsService.createInternalNotification({
      businessId: updatedAppointment.businessId,
      appointmentId: updatedAppointment.id,
      clientId: updatedAppointment.clientId,
      type: 'APPOINTMENT_RESCHEDULED',
      message: `Cita reprogramada para ${updatedAppointment.startsAt.toISOString()}`,
    })

    return updatedAppointment
  }

  async getAppointments(filters: AppointmentFiltersDto) {
    const where: Prisma.AppointmentWhereInput = {
      businessId: filters.businessId,
      serviceId: filters.serviceId,
      clientId: filters.clientId,
      staffId: filters.staffId,
      status: filters.status,
    }

    if (filters.dateFrom || filters.dateTo) {
      where.startsAt = {}

      if (filters.dateFrom) {
        where.startsAt.gte = new Date(filters.dateFrom)
      }

      if (filters.dateTo) {
        where.startsAt.lte = new Date(filters.dateTo)
      }
    }

    return this.prisma.appointment.findMany({
      where,
      select: publicAppointmentSelect,
      orderBy: { startsAt: 'asc' },
    })
  }

  async getDaySummary(query: AppointmentDaySummaryDto) {
    const business = await this.prisma.business.findUnique({
      where: { id: query.businessId },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    })

    if (!business) {
      throw new NotFoundException('El negocio no existe')
    }

    if (query.staffId) {
      const staff = await this.prisma.staff.findUnique({
        where: { id: query.staffId },
        select: {
          id: true,
          businessId: true,
        },
      })

      if (!staff || staff.businessId !== query.businessId) {
        throw new NotFoundException('El staff no existe en este negocio')
      }
    }

    const { startOfDay, endOfDay } = this.getUtcDayRange(query.date)

    const appointments = await this.prisma.appointment.findMany({
      where: {
        businessId: query.businessId,
        staffId: query.staffId,
        startsAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: publicAppointmentSelect,
      orderBy: { startsAt: 'asc' },
    })

    const totals = {
      total: appointments.length,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
    }

    let projectedRevenue = 0
    let completedRevenue = 0

    for (const appointment of appointments) {
      if (appointment.status === AppointmentStatus.PENDING) {
        totals.pending += 1
      }

      if (appointment.status === AppointmentStatus.CONFIRMED) {
        totals.confirmed += 1
      }

      if (appointment.status === AppointmentStatus.COMPLETED) {
        totals.completed += 1
      }

      if (appointment.status === AppointmentStatus.CANCELLED) {
        totals.cancelled += 1
      }

      const appointmentPrice = Number(appointment.priceSnapshot)

      if (appointment.status !== AppointmentStatus.CANCELLED) {
        projectedRevenue += appointmentPrice
      }

      if (appointment.status === AppointmentStatus.COMPLETED) {
        completedRevenue += appointmentPrice
      }
    }

    return {
      business,
      date: query.date,
      staffId: query.staffId ?? null,
      totals,
      revenue: {
        projected: Number(projectedRevenue.toFixed(2)),
        completed: Number(completedRevenue.toFixed(2)),
      },
      appointments,
    }
  }

  async updateAppointmentStatus(
    appointmentId: number,
    updateAppointmentStatusDto: UpdateAppointmentStatusDto,
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        status: true,
      },
    })

    if (!appointment) {
      throw new NotFoundException('La cita no existe')
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new ConflictException('No puedes cambiar el estado de una cita cancelada')
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new ConflictException('No puedes cambiar el estado de una cita completada')
    }

    const updatedAppointment = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: updateAppointmentStatusDto.status,
      },
      select: publicAppointmentSelect,
    })

    await this.notificationsService.createInternalNotification({
      businessId: updatedAppointment.businessId,
      appointmentId: updatedAppointment.id,
      clientId: updatedAppointment.clientId,
      type: 'APPOINTMENT_STATUS_CHANGED',
      message: `Estado de cita actualizado a ${updatedAppointment.status}`,
    })

    return updatedAppointment
  }

  private toTimeString(date: Date) {
    const hours = String(date.getUTCHours()).padStart(2, '0')
    const minutes = String(date.getUTCMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }

  private ensureValidDate(date: Date) {
    if (Number.isNaN(date.getTime())) {
      throw new ConflictException('La fecha de inicio no es valida')
    }
  }

  private getUtcDayRange(date: string) {
    const startOfDay = new Date(`${date}T00:00:00.000Z`)
    const endOfDay = new Date(`${date}T23:59:59.999Z`)

    this.ensureValidDate(startOfDay)
    this.ensureValidDate(endOfDay)

    return { startOfDay, endOfDay }
  }

  private async ensureClientAvailability(
    clientId: number,
    startsAt: Date,
    endsAt: Date,
    appointmentIdToIgnore?: number,
  ) {
    const overlappingAppointment = await this.prisma.appointment.findFirst({
      where: {
        clientId,
        status: {
          in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
        },
        startsAt: {
          lt: endsAt,
        },
        endsAt: {
          gt: startsAt,
        },
        ...(appointmentIdToIgnore
          ? {
              id: {
                not: appointmentIdToIgnore,
              },
            }
          : {}),
      },
      select: { id: true },
    })

    if (overlappingAppointment) {
      throw new ConflictException('El cliente ya tiene una cita en ese horario')
    }
  }

  private async ensureStaffAvailability(params: {
    appointmentIdToIgnore?: number
    businessId: number
    serviceId: number
    staffId?: number
    startsAt: Date
    endsAt: Date
  }) {
    if (!params.staffId) {
      return
    }

    const staff = await this.prisma.staff.findUnique({
      where: { id: params.staffId },
      select: {
        id: true,
        businessId: true,
        isActive: true,
        staffServices: {
          where: {
            serviceId: params.serviceId,
          },
          select: { serviceId: true },
        },
      },
    })

    if (!staff || staff.businessId !== params.businessId) {
      throw new NotFoundException('El staff no existe en este negocio')
    }

    if (!staff.isActive) {
      throw new ConflictException('El staff no esta activo')
    }

    if (staff.staffServices.length === 0) {
      throw new ConflictException('El staff no puede atender este servicio')
    }

    const dayOfWeek = params.startsAt.getUTCDay()
    const startTime = this.toTimeString(params.startsAt)
    const endTime = this.toTimeString(params.endsAt)

    const availability = await this.prisma.staffAvailability.findFirst({
      where: {
        staffId: params.staffId,
        dayOfWeek,
        isActive: true,
        startTime: {
          lte: startTime,
        },
        endTime: {
          gte: endTime,
        },
      },
      select: { id: true },
    })

    if (!availability) {
      throw new ConflictException('El staff no tiene disponibilidad para ese horario')
    }

    const overlappingStaffAppointment = await this.prisma.appointment.findFirst({
      where: {
        staffId: params.staffId,
        status: {
          in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
        },
        startsAt: {
          lt: params.endsAt,
        },
        endsAt: {
          gt: params.startsAt,
        },
        ...(params.appointmentIdToIgnore
          ? {
              id: {
                not: params.appointmentIdToIgnore,
              },
            }
          : {}),
      },
      select: { id: true },
    })

    if (overlappingStaffAppointment) {
      throw new ConflictException('El staff ya tiene una cita en ese horario')
    }
  }
}
