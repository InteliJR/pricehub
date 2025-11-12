import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para atualizar ou criar impostos no PATCH do frete
 * - Se tem 'id': atualiza o imposto existente
 * - Se NÃO tem 'id': cria um novo imposto
 */
export class UpdateFreightTaxDto {
  @IsUUID('4', { message: 'O ID deve ser um UUID válido' })
  @IsOptional()
  id?: string; // Se presente, atualiza; se ausente, cria novo

  @IsString()
  @IsNotEmpty({ message: 'O nome do imposto é obrigatório' })
  @MaxLength(100, { message: 'O nome do imposto deve ter no máximo 100 caracteres' })
  name: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'A taxa deve ter no máximo 2 casas decimais' },
  )
  @Min(0, { message: 'A taxa não pode ser negativa' })
  @Type(() => Number)
  rate: number;
}