import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator'

export class CreateStaffDto {
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
  @MaxLength(80)
  roleTitle?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  serviceIds?: number[]
}
