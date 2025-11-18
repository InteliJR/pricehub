// =============================================
// src/freights/dto/create-freight-tax.dto.ts
// =============================================

import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFreightTaxDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome do imposto é obrigatório' })
  @MaxLength(100, {
    message: 'O nome do imposto deve ter no máximo 100 caracteres',
  })
  name: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'A taxa deve ter no máximo 2 casas decimais' },
  )
  @Min(0, { message: 'A taxa não pode ser negativa' })
  @Type(() => Number)
  rate: number;
}
