import { Type } from 'class-transformer'
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator'

export class RescheduleAppointmentDto {
  @IsDateString()
  startsAt: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  staffId?: number
}
