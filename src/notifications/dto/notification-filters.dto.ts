import {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
} from '@prisma/client'
import { Type } from 'class-transformer'
import { IsDateString, IsEnum, IsInt, IsOptional, Min } from 'class-validator'

export class NotificationFiltersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  businessId?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  appointmentId?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  clientId?: number

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType

  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel

  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus

  @IsOptional()
  @IsDateString()
  dateFrom?: string

  @IsOptional()
  @IsDateString()
  dateTo?: string
}
