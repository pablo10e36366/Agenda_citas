import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator'

export class CreateServiceDto {
  @IsInt()
  @Min(1)
  businessId: number

  @IsString()
  @MaxLength(120)
  name: string

  @IsString()
  @MaxLength(80)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'El slug solo puede contener letras minusculas, numeros y guiones',
  })
  slug: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string

  @IsInt()
  @Min(5)
  durationMinutes: number

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio debe ser un numero valido con maximo 2 decimales' },
  )
  @Min(0)
  price: number

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
