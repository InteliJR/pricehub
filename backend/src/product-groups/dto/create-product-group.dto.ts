// src/product-groups/dto/create-product-group.dto.ts

import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateProductGroupDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}