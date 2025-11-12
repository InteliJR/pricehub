import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsPositive,
  IsNumber,
  IsEnum,
  Min,
  MaxLength,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Currency } from '@prisma/client';
import { Type } from 'class-transformer';

/**
 * DTO para criar impostos do frete junto com o frete
 */
export class CreateFreightTaxDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome do imposto é obrigatório' })
  @MaxLength(100, { message: 'O nome do imposto deve ter no máximo 100 caracteres' })
  name: string; // ICMS, PIS, COFINS, IPI, etc

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'A taxa deve ter no máximo 2 casas decimais' },
  )
  @Min(0, { message: 'A taxa não pode ser negativa' })
  @Type(() => Number)
  rate: number; // Ex: 7.60 (%)
}

/**
 * DTO para criação de um novo frete
 */
export class CreateFreightDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome do frete é obrigatório' })
  @MaxLength(255, { message: 'O nome deve ter no máximo 255 caracteres' })
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000, { message: 'A descrição deve ter no máximo 5000 caracteres' })
  description?: string;

  @IsInt({ message: 'O prazo de pagamento deve ser um número inteiro' })
  @IsPositive({ message: 'O prazo de pagamento deve ser positivo' })
  @Type(() => Number)
  paymentTerm: number; // em dias

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'O preço unitário deve ter no máximo 2 casas decimais' },
  )
  @IsPositive({ message: 'O preço unitário deve ser positivo' })
  @Type(() => Number)
  unitPrice: number;

  @IsEnum(Currency, { message: 'Moeda inválida. Use BRL, USD ou EUR' })
  @IsOptional()
  currency?: Currency = Currency.BRL;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Os custos adicionais devem ter no máximo 2 casas decimais' },
  )
  @Min(0, { message: 'Os custos adicionais não podem ser negativos' })
  @IsOptional()
  @Type(() => Number)
  additionalCosts?: number = 0;

  @IsArray({ message: 'Os impostos devem ser um array' })
  @ValidateNested({ each: true })
  @ArrayMinSize(0)
  @Type(() => CreateFreightTaxDto)
  @IsOptional()
  freightTaxes?: CreateFreightTaxDto[];
}