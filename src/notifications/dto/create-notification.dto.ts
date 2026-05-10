import { NotificationChannel, NotificationType } from '@prisma/client'
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

export class CreateNotificationDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  businessId: number

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

  @IsEnum(NotificationType)
  type: NotificationType

  @IsEnum(NotificationChannel)
  channel: NotificationChannel

  @IsOptional()
  @IsString()
  @MaxLength(255)
  recipient?: string

  @IsString()
  @MaxLength(2000)
  message: string

  @IsOptional()
  @IsDateString()
  scheduledFor?: string
}
