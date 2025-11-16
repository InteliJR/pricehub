import { IsString, IsOptional, IsNotEmpty, ValidateNested, ArrayMinSize, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTaxItemDto {
	@IsString()
	@IsNotEmpty()
	name: string;

	@IsOptional()
	@IsNumber()
	rate?: number;

	@IsOptional()
	@IsBoolean()
	recoverable?: boolean;
}

export class CreateTaxDto {
	@IsString()
	@IsNotEmpty()
	name: string;

	@IsOptional()
	@IsString()
	description?: string;

	@ValidateNested({ each: true })
	@Type(() => CreateTaxItemDto)
	@ArrayMinSize(1)
	items: CreateTaxItemDto[];
}
