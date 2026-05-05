import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { Roles } from '../auth/decorators/roles.decorator'
import { UserRole } from '../auth/roles/role.enum'
import { CreateAppointmentReminderDto } from './dto/create-appointment-reminder.dto'
import { CreateNotificationDto } from './dto/create-notification.dto'
import { NotificationFiltersDto } from './dto/notification-filters.dto'
import { NotificationsService } from './notifications.service'

@Controller('notifications')
@Roles(UserRole.ADMIN, UserRole.STAFF)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Post()
  createNotification(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.createNotification(createNotificationDto)
  }

  @Post('appointment-reminder')
  createAppointmentReminder(
    @Body() createReminderDto: CreateAppointmentReminderDto,
  ) {
    return this.notificationsService.createAppointmentReminder(createReminderDto)
  }

  @Get()
  getNotifications(@Query() filters: NotificationFiltersDto) {
    return this.notificationsService.getNotifications(filters)
  }
}
