import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  IsEnum,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Currency } from '@prisma/client';

export class QueryFreightDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'A página deve ser um número inteiro' })
  @Min(1, { message: 'A página deve ser no mínimo 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O limite deve ser um número inteiro' })
  @Min(1, { message: 'O limite deve ser no mínimo 1' })
  @Max(100, { message: 'O limite deve ser no máximo 100' })
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string; // Busca em name e description

  @IsOptional()
  @IsEnum(Currency, { message: 'Moeda inválida. Use BRL, USD ou EUR' })
  currency?: Currency;

  @IsOptional()
  @IsIn(['name', 'unitPrice', 'paymentTerm', 'createdAt', 'updatedAt'], {
    message: 'Campo de ordenação inválido',
  })
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'Ordem inválida. Use asc ou desc' })
  sortOrder?: 'asc' | 'desc' = 'desc';
}
