import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  Prisma,
} from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateAppointmentReminderDto } from './dto/create-appointment-reminder.dto'
import { CreateNotificationDto } from './dto/create-notification.dto'
import { NotificationFiltersDto } from './dto/notification-filters.dto'

const publicNotificationSelect = {
  id: true,
  businessId: true,
  appointmentId: true,
  clientId: true,
  type: true,
  channel: true,
  recipient: true,
  message: true,
  status: true,
  scheduledFor: true,
  sentAt: true,
  errorMessage: true,
  createdAt: true,
  business: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  appointment: {
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      status: true,
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
} as const

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async createNotification(createNotificationDto: CreateNotificationDto) {
    await this.ensureBusinessExists(createNotificationDto.businessId)

    if (createNotificationDto.appointmentId) {
      await this.ensureAppointmentBelongsToBusiness(
        createNotificationDto.appointmentId,
        createNotificationDto.businessId,
      )
    }

    if (createNotificationDto.clientId) {
      await this.ensureClientBelongsToBusiness(
        createNotificationDto.clientId,
        createNotificationDto.businessId,
      )
    }

    if (
      createNotificationDto.channel !== NotificationChannel.INTERNAL &&
      !createNotificationDto.recipient
    ) {
      throw new ConflictException('recipient es obligatorio para EMAIL o WHATSAPP')
    }

    return this.prisma.notification.create({
      data: {
        businessId: createNotificationDto.businessId,
        appointmentId: createNotificationDto.appointmentId,
        clientId: createNotificationDto.clientId,
        type: createNotificationDto.type,
        channel: createNotificationDto.channel,
        recipient: createNotificationDto.recipient,
        message: createNotificationDto.message,
        scheduledFor: createNotificationDto.scheduledFor
          ? new Date(createNotificationDto.scheduledFor)
          : undefined,
        status:
          createNotificationDto.channel === NotificationChannel.INTERNAL
            ? NotificationStatus.SENT
            : NotificationStatus.PENDING,
        sentAt:
          createNotificationDto.channel === NotificationChannel.INTERNAL
            ? new Date()
            : undefined,
      },
      select: publicNotificationSelect,
    })
  }

  async createAppointmentReminder(
    createReminderDto: CreateAppointmentReminderDto,
  ) {
    if (createReminderDto.channel === NotificationChannel.INTERNAL) {
      throw new ConflictException('El recordatorio debe usar EMAIL o WHATSAPP')
    }

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: createReminderDto.appointmentId },
      select: {
        id: true,
        businessId: true,
        startsAt: true,
        clientId: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        business: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!appointment) {
      throw new NotFoundException('La cita no existe')
    }

    const recipient =
      createReminderDto.channel === NotificationChannel.EMAIL
        ? appointment.client.email
        : appointment.client.phone

    if (!recipient) {
      throw new ConflictException(
        'El cliente no tiene un contacto valido para este canal',
      )
    }

    return this.prisma.notification.create({
      data: {
        businessId: appointment.businessId,
        appointmentId: appointment.id,
        clientId: appointment.clientId,
        type: NotificationType.APPOINTMENT_REMINDER,
        channel: createReminderDto.channel,
        recipient,
        message:
          createReminderDto.message ??
          `Recordatorio de cita en ${appointment.business.name} para ${appointment.startsAt.toISOString()}`,
        scheduledFor: new Date(createReminderDto.scheduledFor),
        status: NotificationStatus.PENDING,
      },
      select: publicNotificationSelect,
    })
  }

  async getNotifications(filters: NotificationFiltersDto) {
    const where: Prisma.NotificationWhereInput = {
      businessId: filters.businessId,
      appointmentId: filters.appointmentId,
      clientId: filters.clientId,
      type: filters.type,
      channel: filters.channel,
      status: filters.status,
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {}

      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom)
      }

      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo)
      }
    }

    return this.prisma.notification.findMany({
      where,
      select: publicNotificationSelect,
      orderBy: { createdAt: 'desc' },
    })
  }

  async createInternalNotification(params: {
    businessId: number
    appointmentId?: number
    clientId?: number
    type: NotificationType
    message: string
  }) {
    return this.prisma.notification.create({
      data: {
        businessId: params.businessId,
        appointmentId: params.appointmentId,
        clientId: params.clientId,
        type: params.type,
        channel: NotificationChannel.INTERNAL,
        message: params.message,
        status: NotificationStatus.SENT,
        sentAt: new Date(),
      },
      select: publicNotificationSelect,
    })
  }

  private async ensureBusinessExists(businessId: number) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true },
    })

    if (!business) {
      throw new NotFoundException('El negocio no existe')
    }
  }

  private async ensureAppointmentBelongsToBusiness(
    appointmentId: number,
    businessId: number,
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { id: true, businessId: true },
    })

    if (!appointment || appointment.businessId !== businessId) {
      throw new NotFoundException('La cita no existe en este negocio')
    }
  }

  private async ensureClientBelongsToBusiness(clientId: number, businessId: number) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, businessId: true },
    })

    if (!client || client.businessId !== businessId) {
      throw new NotFoundException('El cliente no existe en este negocio')
    }
  }
}
