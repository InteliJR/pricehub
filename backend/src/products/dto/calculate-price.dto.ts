import {
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsUUID,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

class RawMaterialCalculationDto {
  @IsUUID('4', { message: 'ID da matéria-prima deve ser um UUID válido' })
  rawMaterialId: string;

  @IsNumber({}, { message: 'Quantidade deve ser um número' })
  @Min(0.001, { message: 'Quantidade deve ser maior que 0' })
  @Type(() => Number)
  quantity: number;
}

export class CalculatePriceDto {
  @IsArray({ message: 'rawMaterials deve ser um array' })
  @ValidateNested({ each: true })
  @ArrayMinSize(1, { message: 'Deve ter no mínimo 1 matéria-prima' })
  @Type(() => RawMaterialCalculationDto)
  rawMaterials: RawMaterialCalculationDto[];

  @IsUUID('4', { message: 'ID do custo fixo deve ser um UUID válido' })
  @IsOptional()
  fixedCostId?: string;
}
