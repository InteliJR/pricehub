### `src/raw-materials/raw-materials.controller.ts`

```typescript
// src/raw-materials/raw-materials.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { RawMaterialsService } from './raw-materials.service';
import { CreateRawMaterialDto } from './dto/create-raw-material.dto';
import { UpdateRawMaterialDto } from './dto/update-raw-material.dto';
import { QueryRawMaterialDto } from './dto/query-raw-material.dto';
import { ExportRawMaterialDto } from './dto/export-raw-material.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('raw-materials')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RawMaterialsController {
  constructor(private readonly rawMaterialsService: RawMaterialsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createRawMaterialDto: CreateRawMaterialDto,
    @Request() req,
  ) {
    return this.rawMaterialsService.create(createRawMaterialDto, req.user.id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  findAll(@Query() query: QueryRawMaterialDto) {
    return this.rawMaterialsService.findAll(query);
  }

  @Get('recent-changes')
  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  getRecentChanges(@Query('limit') limit?: number) {
    return this.rawMaterialsService.getRecentChanges(limit);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  findOne(@Param('id') id: string) {
    return this.rawMaterialsService.findOne(id);
  }

  @Get(':id/change-logs')
  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  getChangeLogs(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.rawMaterialsService.getChangeLogs(id, page, limit);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  update(
    @Param('id') id: string,
    @Body() updateRawMaterialDto: UpdateRawMaterialDto,
    @Request() req,
  ) {
    return this.rawMaterialsService.update(id, updateRawMaterialDto, req.user.id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.rawMaterialsService.remove(id);
  }

  @Post('export')
  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  @HttpCode(HttpStatus.OK)
  async export(
    @Body() exportDto: ExportRawMaterialDto,
    @Res() res: Response,
  ) {
    const csv = await this.rawMaterialsService.export(exportDto);
    
    const filename = `materias-primas-${new Date().toISOString().split('T')[0]}.csv`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }
}
```

---

### `src/raw-materials/raw-materials.module.ts`

```typescript
// src/raw-materials/raw-materials.module.ts

import { Module } from '@nestjs/common';
import { RawMaterialsService } from './raw-materials.service';
import { RawMaterialsController } from './raw-materials.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ExportModule } from '../export/export.module';

@Module({
  imports: [PrismaModule, ExportModule],
  controllers: [RawMaterialsController],
  providers: [RawMaterialsService],
  exports: [RawMaterialsService],
})
export class RawMaterialsModule {}
```

---

### `src/raw-materials/raw-materials.service.ts`

```typescript
// src/raw-materials/raw-materials.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRawMaterialDto } from './dto/create-raw-material.dto';
import { UpdateRawMaterialDto } from './dto/update-raw-material.dto';
import { QueryRawMaterialDto } from './dto/query-raw-material.dto';
import { ExportRawMaterialDto } from './dto/export-raw-material.dto';
import { ExportService } from '../export/export.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class RawMaterialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly exportService: ExportService,
  ) {}

  async create(createRawMaterialDto: CreateRawMaterialDto, userId: string) {
    // Verifica se o código já existe
    const existingCode = await this.prisma.rawMaterial.findUnique({
      where: { code: createRawMaterialDto.code.toUpperCase() },
    });

    if (existingCode) {
      throw new ConflictException(
        'Já existe uma matéria-prima com este código',
      );
    }

    // Verifica se o frete existe
    const freight = await this.prisma.freight.findUnique({
      where: { id: createRawMaterialDto.freightId },
    });

    if (!freight) {
      throw new BadRequestException('Frete não encontrado');
    }

    // Cria a matéria-prima com os impostos
    const rawMaterial = await this.prisma.rawMaterial.create({
      data: {
        code: createRawMaterialDto.code.toUpperCase(),
        name: createRawMaterialDto.name,
        description: createRawMaterialDto.description,
        measurementUnit: createRawMaterialDto.measurementUnit,
        inputGroup: createRawMaterialDto.inputGroup,
        paymentTerm: createRawMaterialDto.paymentTerm,
        acquisitionPrice: createRawMaterialDto.acquisitionPrice,
        currency: createRawMaterialDto.currency,
        priceConvertedBrl: createRawMaterialDto.priceConvertedBrl,
        additionalCost: createRawMaterialDto.additionalCost,
        freightId: createRawMaterialDto.freightId,
        rawMaterialTaxes: {
          create: createRawMaterialDto.rawMaterialTaxes.map((tax) => ({
            name: tax.name,
            rate: tax.rate,
            recoverable: tax.recoverable,
          })),
        },
      },
      include: {
        freight: {
          select: {
            id: true,
            name: true,
            unitPrice: true,
            currency: true,
          },
        },
        rawMaterialTaxes: true,
      },
    });

    // Registra a criação no log
    await this.createChangeLog(
      rawMaterial.id,
      'created',
      null,
      'Matéria-prima criada',
      userId,
    );

    return rawMaterial;
  }

  async findAll(query: QueryRawMaterialDto) {
    const { page = 1, limit = 10, search, measurementUnit, inputGroup, sortBy = 'name', sortOrder = 'asc' } = query;

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: Prisma.RawMaterialWhereInput = {
      AND: [
        search
          ? {
              OR: [
                { code: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { inputGroup: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
        measurementUnit ? { measurementUnit } : {},
        inputGroup ? { inputGroup: { contains: inputGroup, mode: 'insensitive' } } : {},
      ],
    };

    // Ordenação
    const orderBy: Prisma.RawMaterialOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [data, total] = await Promise.all([
      this.prisma.rawMaterial.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          freight: {
            select: {
              id: true,
              name: true,
              unitPrice: true,
              currency: true,
            },
          },
          rawMaterialTaxes: true,
        },
      }),
      this.prisma.rawMaterial.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const rawMaterial = await this.prisma.rawMaterial.findUnique({
      where: { id },
      include: {
        freight: {
          select: {
            id: true,
            name: true,
            unitPrice: true,
            currency: true,
          },
        },
        rawMaterialTaxes: true,
      },
    });

    if (!rawMaterial) {
      throw new NotFoundException('Matéria-prima não encontrada');
    }

    return rawMaterial;
  }

  async update(id: string, updateRawMaterialDto: UpdateRawMaterialDto, userId: string) {
    // Verifica se existe
    const existing = await this.findOne(id);

    // Verifica código duplicado
    if (updateRawMaterialDto.code) {
      const codeExists = await this.prisma.rawMaterial.findFirst({
        where: {
          code: updateRawMaterialDto.code.toUpperCase(),
          NOT: { id },
        },
      });

      if (codeExists) {
        throw new ConflictException('Já existe uma matéria-prima com este código');
      }
    }

    // Verifica frete se foi alterado
    if (updateRawMaterialDto.freightId) {
      const freight = await this.prisma.freight.findUnique({
        where: { id: updateRawMaterialDto.freightId },
      });

      if (!freight) {
        throw new BadRequestException('Frete não encontrado');
      }
    }

    // Registra mudanças
    await this.logChanges(existing, updateRawMaterialDto, userId);

    // Atualiza a matéria-prima
    const updated = await this.prisma.rawMaterial.update({
      where: { id },
      data: {
        ...(updateRawMaterialDto.code && { code: updateRawMaterialDto.code.toUpperCase() }),
        ...(updateRawMaterialDto.name && { name: updateRawMaterialDto.name }),
        ...(updateRawMaterialDto.description !== undefined && { description: updateRawMaterialDto.description }),
        ...(updateRawMaterialDto.measurementUnit && { measurementUnit: updateRawMaterialDto.measurementUnit }),
        ...(updateRawMaterialDto.inputGroup !== undefined && { inputGroup: updateRawMaterialDto.inputGroup }),
        ...(updateRawMaterialDto.paymentTerm !== undefined && { paymentTerm: updateRawMaterialDto.paymentTerm }),
        ...(updateRawMaterialDto.acquisitionPrice !== undefined && { acquisitionPrice: updateRawMaterialDto.acquisitionPrice }),
        ...(updateRawMaterialDto.currency && { currency: updateRawMaterialDto.currency }),
        ...(updateRawMaterialDto.priceConvertedBrl !== undefined && { priceConvertedBrl: updateRawMaterialDto.priceConvertedBrl }),
        ...(updateRawMaterialDto.additionalCost !== undefined && { additionalCost: updateRawMaterialDto.additionalCost }),
        ...(updateRawMaterialDto.freightId && { freightId: updateRawMaterialDto.freightId }),
      },
      include: {
        freight: {
          select: {
            id: true,
            name: true,
            unitPrice: true,
            currency: true,
          },
        },
        rawMaterialTaxes: true,
      },
    });

    // Atualiza impostos se fornecidos
    if (updateRawMaterialDto.rawMaterialTaxes) {
      // Remove impostos antigos
      await this.prisma.rawMaterialTax.deleteMany({
        where: { rawMaterialId: id },
      });

      // Cria novos impostos
      await this.prisma.rawMaterialTax.createMany({
        data: updateRawMaterialDto.rawMaterialTaxes.map((tax) => ({
          rawMaterialId: id,
          name: tax.name,
          rate: tax.rate,
          recoverable: tax.recoverable,
        })),
      });

      // Recarrega com os novos impostos
      return this.findOne(id);
    }

    return updated;
  }

  async remove(id: string) {
    // Verifica se existe
    await this.findOne(id);

    // Verifica se está sendo usado em algum produto
    const productsUsing = await this.prisma.productRawMaterial.count({
      where: { rawMaterialId: id },
    });

    if (productsUsing > 0) {
      throw new ConflictException(
        'Esta matéria-prima está associada a produtos e não pode ser excluída',
      );
    }

    // Deleta (os impostos e logs são deletados em cascata)
    await this.prisma.rawMaterial.delete({
      where: { id },
    });

    return { message: 'Matéria-prima excluída com sucesso' };
  }

  async getChangeLogs(id: string, page: number = 1, limit: number = 20) {
    // Verifica se a matéria-prima existe
    await this.findOne(id);

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.rawMaterialChangeLog.findMany({
        where: { rawMaterialId: id },
        skip,
        take: limit,
        orderBy: { changedAt: 'desc' },
      }),
      this.prisma.rawMaterialChangeLog.count({
        where: { rawMaterialId: id },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasMore,
      },
    };
  }

  async getRecentChanges(limit: number = 10) {
    return this.prisma.rawMaterialChangeLog.findMany({
      take: limit,
      orderBy: { changedAt: 'desc' },
    });
  }

  async export(exportDto: ExportRawMaterialDto) {
    const { limit = 500, sortBy = 'name', sortOrder = 'asc', filters } = exportDto;

    // Construir filtros
    const where: Prisma.RawMaterialWhereInput = {
      AND: [
        filters?.search
          ? {
              OR: [
                { code: { contains: filters.search, mode: 'insensitive' } },
                { name: { contains: filters.search, mode: 'insensitive' } },
                { inputGroup: { contains: filters.search, mode: 'insensitive' } },
              ],
            }
          : {},
        filters?.measurementUnit ? { measurementUnit: filters.measurementUnit } : {},
        filters?.inputGroup ? { inputGroup: { contains: filters.inputGroup, mode: 'insensitive' } } : {},
      ],
    };

    const orderBy: Prisma.RawMaterialOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const data = await this.prisma.rawMaterial.findMany({
      where,
      take: limit,
      orderBy,
      include: {
        freight: true,
        rawMaterialTaxes: true,
      },
    });

    // Formatar dados para CSV
    const formattedData = data.map((item) => ({
      Código: item.code,
      Nome: item.name,
      Descrição: item.description || '',
      'Unidade de Medida': item.measurementUnit,
      'Grupo de Insumo': item.inputGroup || '',
      'Prazo de Pagamento': `${item.paymentTerm} dias`,
      'Preço de Aquisição': item.acquisitionPrice.toString(),
      Moeda: item.currency,
      'Preço em BRL': item.priceConvertedBrl.toString(),
      'Custo Adicional': item.additionalCost.toString(),
      Frete: item.freight?.name || '',
      'Preço do Frete': item.freight?.unitPrice.toString() || '',
      Impostos: item.rawMaterialTaxes
        .map((tax) => `${tax.name} (${tax.rate}%)${tax.recoverable ? ' - Recuperável' : ''}`)
        .join('; '),
    }));

    return this.exportService.generateCsv(formattedData);
  }

  // Métodos auxiliares
  private async createChangeLog(
    rawMaterialId: string,
    field: string,
    oldValue: string | null,
    newValue: string | null,
    userId: string,
  ) {
    await this.prisma.rawMaterialChangeLog.create({
      data: {
        rawMaterialId,
        field,
        oldValue,
        newValue,
        changedBy: userId,
      },
    });
  }

  private async logChanges(
    existing: any,
    updates: UpdateRawMaterialDto,
    userId: string,
  ) {
    const fieldsToLog = [
      'code',
      'name',
      'description',
      'measurementUnit',
      'inputGroup',
      'paymentTerm',
      'acquisitionPrice',
      'currency',
      'priceConvertedBrl',
      'additionalCost',
      'freightId',
    ];

    for (const field of fieldsToLog) {
      if (updates[field] !== undefined && updates[field] !== existing[field]) {
        await this.createChangeLog(
          existing.id,
          field,
          String(existing[field] || ''),
          String(updates[field] || ''),
          userId,
        );
      }
    }
  }
}
```

---

### `src/raw-materials/dto/create-raw-material.dto.ts`

```typescript
// src/raw-materials/dto/create-raw-material.dto.ts

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsPositive,
  Min,
  Max,
  MaxLength,
  MinLength,
  IsArray,
  ValidateNested,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Currency, MeasurementUnit } from '@prisma/client';

export class RawMaterialTaxDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  @IsNotEmpty({ message: 'Nome do imposto é obrigatório' })
  @MaxLength(40, { message: 'Nome do imposto deve ter no máximo 40 caracteres' })
  name: string;

  @IsNumber()
  @IsPositive({ message: 'Taxa deve ser maior que zero' })
  @Min(0.01, { message: 'Taxa deve ser no mínimo 0.01%' })
  @Max(100, { message: 'Taxa deve ser no máximo 100%' })
  rate: number;

  @IsBoolean()
  recoverable: boolean;
}

export class CreateRawMaterialDto {
  @IsString()
  @IsNotEmpty({ message: 'Código é obrigatório' })
  @MinLength(2, { message: 'Código deve ter no mínimo 2 caracteres' })
  @MaxLength(30, { message: 'Código deve ter no máximo 30 caracteres' })
  code: string;

  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Descrição deve ter no máximo 500 caracteres' })
  description?: string;

  @IsEnum(MeasurementUnit, { message: 'Unidade de medida inválida' })
  measurementUnit: MeasurementUnit;

  @IsOptional()
  @IsString()
  @MaxLength(60, { message: 'Grupo de insumo deve ter no máximo 60 caracteres' })
  inputGroup?: string;

  @IsNumber()
  @Min(0, { message: 'Prazo de pagamento deve ser no mínimo 0' })
  @Max(365, { message: 'Prazo de pagamento deve ser no máximo 365 dias' })
  paymentTerm: number;

  @IsNumber()
  @IsPositive({ message: 'Preço de aquisição deve ser maior que zero' })
  acquisitionPrice: number;

  @IsEnum(Currency, { message: 'Moeda inválida' })
  currency: Currency;

  @IsNumber()
  @Min(0, { message: 'Preço convertido não pode ser negativo' })
  priceConvertedBrl: number;

  @IsNumber()
  @Min(0, { message: 'Custo adicional não pode ser negativo' })
  additionalCost: number;

  @IsUUID('4', { message: 'ID de frete inválido' })
  @IsNotEmpty({ message: 'Frete é obrigatório' })
  freightId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RawMaterialTaxDto)
  rawMaterialTaxes: RawMaterialTaxDto[];
}
```

---

### `src/raw-materials/dto/export-raw-material.dto.ts`

```typescript
// src/raw-materials/dto/export-raw-material.dto.ts

import {
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MeasurementUnit } from '@prisma/client';

class ExportFiltersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(MeasurementUnit)
  measurementUnit?: MeasurementUnit;

  @IsOptional()
  @IsString()
  inputGroup?: string;
}

export class ExportRawMaterialDto {
  @IsEnum(['csv'])
  format: 'csv';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  limit?: number = 500;

  @IsOptional()
  @IsString()
  sortBy?: string = 'name';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';

  @IsOptional()
  @ValidateNested()
  @Type(() => ExportFiltersDto)
  filters?: ExportFiltersDto;
}
```

---

### `src/raw-materials/dto/query-raw-material.dto.ts`

```typescript
// src/raw-materials/dto/query-raw-material.dto.ts

import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { MeasurementUnit } from '@prisma/client';

export class QueryRawMaterialDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(MeasurementUnit)
  measurementUnit?: MeasurementUnit;

  @IsOptional()
  @IsString()
  inputGroup?: string;

  @IsOptional()
  @IsString()
  sortBy?: string = 'name';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';
}
```

---

### `src/raw-materials/dto/update-raw-material.dto.ts`

```typescript
// src/raw-materials/dto/update-raw-material.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { CreateRawMaterialDto } from './create-raw-material.dto';

export class UpdateRawMaterialDto extends PartialType(CreateRawMaterialDto) {}
```

---

### `src/raw-materials/entities/raw-material.entity.ts`

```typescript
export class RawMaterial {}
```

---

