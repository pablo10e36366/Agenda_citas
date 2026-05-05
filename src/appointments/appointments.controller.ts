import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common'
import { Roles } from '../auth/decorators/roles.decorator'
import { UserRole } from '../auth/roles/role.enum'
import { AppointmentsService } from './appointments.service'
import { AppointmentDaySummaryDto } from './dto/appointment-day-summary.dto'
import { AppointmentFiltersDto } from './dto/appointment-filters.dto'
import { CreateAppointmentDto } from './dto/create-appointment.dto'
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto'
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto'

@Controller('appointments')
@Roles(UserRole.ADMIN, UserRole.STAFF)
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Post()
  createAppointment(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.createAppointment(createAppointmentDto)
  }

  @Get('summary/day')
  getDaySummary(@Query() query: AppointmentDaySummaryDto) {
    return this.appointmentsService.getDaySummary(query)
  }

  @Get()
  getAppointments(@Query() filters: AppointmentFiltersDto) {
    return this.appointmentsService.getAppointments(filters)
  }

  @Patch(':id/reschedule')
  rescheduleAppointment(
    @Param('id', ParseIntPipe) appointmentId: number,
    @Body() rescheduleAppointmentDto: RescheduleAppointmentDto,
  ) {
    return this.appointmentsService.rescheduleAppointment(
      appointmentId,
      rescheduleAppointmentDto,
    )
  }

  @Patch(':id/status')
  updateAppointmentStatus(
    @Param('id', ParseIntPipe) appointmentId: number,
    @Body() updateAppointmentStatusDto: UpdateAppointmentStatusDto,
  ) {
    return this.appointmentsService.updateAppointmentStatus(
      appointmentId,
      updateAppointmentStatusDto,
    )
  }
}
