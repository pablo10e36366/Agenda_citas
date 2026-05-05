import { NotificationChannel } from '@prisma/client'
import { Type } from 'class-transformer'
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator'

export class CreateAppointmentReminderDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  appointmentId: number

  @IsEnum(NotificationChannel)
  channel: NotificationChannel

  @IsDateString()
  scheduledFor: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string
}
