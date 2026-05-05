import { Module } from '@nestjs/common'
import { AppointmentsModule } from './appointments/appointments.module'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AvailabilityModule } from './availability/availability.module'
import { AuthModule } from './auth/auth.module'
import { BusinessesModule } from './businesses/businesses.module'
import { ClientsModule } from './clients/clients.module'
import { NotificationsModule } from './notifications/notifications.module'
import { PrismaModule } from './prisma/prisma.module'
import { ServicesModule } from './services/services.module'
import { StaffModule } from './staff/staff.module'
import { UsersModule } from './users/users.module'

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AppointmentsModule,
    AvailabilityModule,
    AuthModule,
    BusinessesModule,
    ServicesModule,
    StaffModule,
    ClientsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
