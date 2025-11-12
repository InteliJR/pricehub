import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateFreightDto } from './create-freight.dto';
import {
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateFreightTaxDto } from './update-freight-tax.dto';

/**
 * DTO para atualização de frete.
 * Permite atualizar campos do frete E gerenciar impostos (criar/atualizar).
 */
export class UpdateFreightDto extends (PartialType(
  OmitType(CreateFreightDto, ['freightTaxes'] as const),
) as any) {
  @IsArray({ message: 'Os impostos devem ser um array' })
  @ValidateNested({ each: true })
  @ArrayMinSize(0)
  @Type(() => UpdateFreightTaxDto)
  @IsOptional()
  freightTaxes?: UpdateFreightTaxDto[];
}
