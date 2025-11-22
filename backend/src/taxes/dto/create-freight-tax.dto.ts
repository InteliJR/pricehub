import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsUUID,
  MaxLength,
  MinLength,
  IsArray,
} from 'class-validator';

export class CreateFreightTaxDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome do imposto é obrigatório' })
  @MinLength(2, { message: 'Nome deve ter no mínimo 2 caracteres' })
  @MaxLength(40, { message: 'Nome deve ter no máximo 40 caracteres' })
  name: string;

  @IsNumber({}, { message: 'Taxa deve ser um número' })
  @Min(0.01, { message: 'Taxa deve ser maior que 0%' })
  @Max(100, { message: 'Taxa deve ser no máximo 100%' })
  rate: number;

  @IsArray({ message: 'Deve fornecer uma lista de fretes' })
  @IsUUID('4', { each: true, message: 'ID de frete inválido' })
  freightIds: string[];
}