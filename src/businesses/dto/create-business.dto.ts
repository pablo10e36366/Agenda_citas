import { IsEmail, IsOptional, IsString, Matches, MaxLength } from 'class-validator'

export class CreateBusinessDto {
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
  @IsEmail()
  contactEmail?: string

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string
}
