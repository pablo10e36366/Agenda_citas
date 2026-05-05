import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator'

export class CreateClientDto {
  @IsInt()
  @Min(1)
  businessId: number

  @IsString()
  @MaxLength(120)
  name: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
