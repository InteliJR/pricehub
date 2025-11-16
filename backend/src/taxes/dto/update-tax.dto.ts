import { PartialType } from '@nestjs/mapped-types';
import { CreateTaxDto, CreateTaxItemDto } from './create-tax.dto';
import { IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTaxItemDto extends CreateTaxItemDto {
	@IsOptional()
	@IsString()
	id?: string;
}

export class UpdateTaxDto extends PartialType(CreateTaxDto) {
	@Type(() => UpdateTaxItemDto)
	@IsOptional()
	items?: UpdateTaxItemDto[];
}
