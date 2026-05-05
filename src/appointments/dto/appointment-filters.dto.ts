import { AppointmentStatus } from '@prisma/client'
import { Type } from 'class-transformer'
import { IsDateString, IsEnum, IsInt, IsOptional, Min } from 'class-validator'

export class AppointmentFiltersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  businessId?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  serviceId?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  clientId?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  staffId?: number

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus

  @IsOptional()
  @IsDateString()
  dateFrom?: string

  @IsOptional()
  @IsDateString()
  dateTo?: string
}
