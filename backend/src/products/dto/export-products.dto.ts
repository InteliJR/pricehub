import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsIn,
  IsBoolean,
  IsObject,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

class ExportFiltersDto {
  @IsString()
  @IsOptional()
  search?: string;
}

export class ExportProductsDto {
  @IsInt({ message: 'Limite deve ser um número inteiro' })
  @Min(1, { message: 'Limite deve ser no mínimo 1' })
  @Max(1000, { message: 'Limite deve ser no máximo 1000' })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 100;

  @IsIn(['code', 'name', 'createdAt', 'updatedAt'], {
    message: 'Campo de ordenação inválido',
  })
  @IsOptional()
  sortBy?: string = 'code';

  @IsIn(['asc', 'desc'], { message: 'Ordem inválida. Use asc ou desc' })
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'asc';

  @IsBoolean({ message: 'includeRawMaterials deve ser booleano' })
  @IsOptional()
  @Type(() => Boolean)
  includeRawMaterials?: boolean = false;

  @IsObject()
  @IsOptional()
  @Type(() => ExportFiltersDto)
  filters?: ExportFiltersDto;
}
