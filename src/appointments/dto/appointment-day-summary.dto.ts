import { Type } from 'class-transformer'
import { IsInt, IsOptional, Matches, Min } from 'class-validator'

export class AppointmentDaySummaryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  businessId: number

  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date debe tener formato YYYY-MM-DD',
  })
  date: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  staffId?: number
}
