import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator'

export class CreateAppointmentDto {
  @IsInt()
  @Min(1)
  businessId: number

  @IsInt()
  @Min(1)
  serviceId: number

  @IsInt()
  @Min(1)
  clientId: number

  @IsOptional()
  @IsInt()
  @Min(1)
  staffId?: number

  @IsDateString()
  startsAt: string

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string
}
