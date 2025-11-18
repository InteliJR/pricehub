### `src/freights/freights.controller.ts`

```typescript
// src/freights/freights.controller.ts

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
  Res,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { FreightsService } from './freights.service';
import { CreateFreightDto } from './dto/create-freight.dto';
import { UpdateFreightDto } from './dto/update-freight.dto';
import { QueryFreightDto } from './dto/query-freight.dto';
import { ExportFreightDto } from './dto/export-freight.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
@Controller('freights')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FreightsController {
  constructor(private readonly freightsService: FreightsService) {}

  /**
   * POST /freights
   * Cria um novo frete com impostos opcionais
   * Acesso: ADMIN, LOGISTICA
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA)
  create(@Body() createFreightDto: CreateFreightDto) {
    return this.freightsService.create(createFreightDto);
  }

  /**
   * POST /freights/export
   * Exporta fretes em formato CSV
   * Acesso: ADMIN, LOGISTICA
   */
  @Post('export')
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA)
  async export(
    @Body() exportDto: ExportFreightDto,
    @Res() res: Response,
  ) {
    const csvData = await this.freightsService.exportToCSV(exportDto);

    // Gera nome do arquivo com timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `fretes_${timestamp}.csv`;

    // Configura headers para download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Pragma', 'no-cache');

    // Adiciona BOM UTF-8 para compatibilidade com Excel
    const BOM = '\uFEFF';
    res.status(HttpStatus.OK).send(BOM + csvData);
  }

  /**
   * GET /freights
   * Lista todos os fretes com paginação e filtros
   * Acesso: ADMIN, LOGISTICA
   * 
   * Query params:
   * - page: número da página (padrão: 1)
   * - limit: itens por página (padrão: 10, máx: 100)
   * - search: busca em name, description, originCity, destinationCity, cargoType
   * - currency: filtra por moeda (BRL, USD, EUR)
   * - operationType: filtra por tipo (INTERNAL, EXTERNAL)
   * - originUf: filtra por UF de origem
   * - destinationUf: filtra por UF de destino
   * - sortBy: campo de ordenação
   * - sortOrder: asc ou desc
   */
  @Get()
  @Throttle({
    default: {
      limit: 50,
      ttl: 60,
    },
  })
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA)
  findAll(@Query() query: QueryFreightDto) {
    return this.freightsService.findAll(query);
  }

  /**
   * GET /freights/statistics
   * Retorna estatísticas dos fretes
   * Acesso: ADMIN, LOGISTICA
   */
  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA)
  getStatistics() {
    return this.freightsService.getStatistics();
  }

  /**
   * GET /freights/:id
   * Busca um frete específico por ID
   * Acesso: ADMIN, LOGISTICA
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA)
  findOne(@Param('id') id: string) {
    return this.freightsService.findOne(id);
  }

  /**
   * PATCH /freights/:id
   * Atualiza um frete existente
   * Acesso: ADMIN, LOGISTICA
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA)
  update(@Param('id') id: string, @Body() updateFreightDto: UpdateFreightDto) {
    return this.freightsService.update(id, updateFreightDto);
  }

  /**
   * DELETE /freights/:id
   * Remove um frete (verifica dependências)
   * Acesso: ADMIN
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.freightsService.remove(id);
  }

  /**
   * DELETE /freights/:freightId/taxes/:taxId
   * Remove um imposto específico de um frete
   * Acesso: ADMIN, LOGISTICA
   */
  @Delete(':freightId/taxes/:taxId')
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA)
  deleteFreightTax(
    @Param('freightId') freightId: string,
    @Param('taxId') taxId: string,
  ) {
    return this.freightsService.deleteFreightTax(freightId, taxId);
  }
}
```

---

### `src/freights/freights.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { FreightsService } from './freights.service';
import { FreightsController } from './freights.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FreightsController],
  providers: [FreightsService],
  exports: [FreightsService], // Exporta para outros módulos usarem se necessário
})
export class FreightsModule {}
```

---

### `src/freights/freights.service.ts`

```typescript
// src/freights/freights.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFreightDto } from './dto/create-freight.dto';
import { UpdateFreightDto } from './dto/update-freight.dto';
import { QueryFreightDto } from './dto/query-freight.dto';
import { ExportFreightDto } from './dto/export-freight.dto';
import { Currency, FreightOperationType } from '@prisma/client';

@Injectable()
export class FreightsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo frete com impostos opcionais
   */
  async create(createFreightDto: CreateFreightDto) {
    try {
      const freight = await this.prisma.freight.create({
        data: {
          name: createFreightDto.name,
          description: createFreightDto.description,
          unitPrice: createFreightDto.unitPrice,
          currency: createFreightDto.currency,
          originUf: createFreightDto.originUf.toUpperCase(),
          originCity: createFreightDto.originCity,
          destinationUf: createFreightDto.destinationUf.toUpperCase(),
          destinationCity: createFreightDto.destinationCity,
          cargoType: createFreightDto.cargoType,
          operationType: createFreightDto.operationType,
          freightTaxes: createFreightDto.freightTaxes?.length
            ? {
                create: createFreightDto.freightTaxes.map((tax) => ({
                  name: tax.name,
                  rate: tax.rate,
                })),
              }
            : undefined,
        },
        include: {
          freightTaxes: {
            select: {
              id: true,
              name: true,
              rate: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });

      return freight;
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException(
          'Já existe um frete com esse nome ou dados únicos',
        );
      }
      const message = error?.message || 'Erro desconhecido';
      throw new BadRequestException(`Erro ao criar frete: ${message}`);
    }
  }

  /**
   * Lista fretes com paginação, filtros e ordenação
   */
  async findAll(query: QueryFreightDto) {
    try {
      const page = query.page || 1;
      const limit = query.limit || 10;
      const sortBy = query.sortBy || 'createdAt';
      const sortOrder = query.sortOrder || 'desc';
      const { search, currency, operationType, originUf, destinationUf } = query;

      // Configurar filtros
      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { originCity: { contains: search, mode: 'insensitive' } },
          { destinationCity: { contains: search, mode: 'insensitive' } },
          { cargoType: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (currency) {
        where.currency = currency;
      }

      if (operationType) {
        where.operationType = operationType;
      }

      if (originUf) {
        where.originUf = {
          contains: originUf.toUpperCase(),
          mode: 'insensitive',
        };
      }

      if (destinationUf) {
        where.destinationUf = {
          contains: destinationUf.toUpperCase(),
          mode: 'insensitive',
        };
      }

      const skip = (page - 1) * limit;

      // Buscar dados e total em paralelo
      const [data, total] = await Promise.all([
        this.prisma.freight.findMany({
          where,
          include: {
            freightTaxes: {
              select: {
                id: true,
                name: true,
                rate: true,
              },
            },
            _count: {
              select: {
                rawMaterials: true,
              },
            },
          },
          orderBy: {
            [sortBy]: sortOrder,
          },
          skip,
          take: limit,
        }),
        this.prisma.freight.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error: any) {
      const message = error?.message || 'Erro desconhecido';
      throw new BadRequestException(`Erro ao buscar fretes: ${message}`);
    }
  }

  /**
   * Busca um frete específico por ID
   */
  async findOne(id: string) {
    try {
      const freight = await this.prisma.freight.findUnique({
        where: { id },
        include: {
          freightTaxes: {
            select: {
              id: true,
              name: true,
              rate: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          rawMaterials: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          _count: {
            select: {
              rawMaterials: true,
            },
          },
        },
      });

      if (!freight) {
        throw new NotFoundException(`Frete com ID "${id}" não encontrado`);
      }

      return freight;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const message = error?.message || 'Erro desconhecido';
      throw new BadRequestException(`Erro ao buscar frete: ${message}`);
    }
  }

  /**
   * Atualiza um frete existente
   */
  async update(id: string, updateFreightDto: UpdateFreightDto) {
    try {
      // Verifica se existe
      await this.findOne(id);

      const { freightTaxes, ...freightData } = updateFreightDto;

      // Normaliza UFs para maiúsculas se fornecidos
      if (freightData.originUf) {
        freightData.originUf = freightData.originUf.toUpperCase();
      }
      if (freightData.destinationUf) {
        freightData.destinationUf = freightData.destinationUf.toUpperCase();
      }

      // Transação para garantir consistência
      const updatedFreight = await this.prisma.$transaction(async (prisma) => {
        // 1. Atualiza dados do frete
        await prisma.freight.update({
          where: { id },
          data: freightData,
        });

        // 2. Gerencia impostos (se fornecidos)
        if (freightTaxes && freightTaxes.length > 0) {
          const toUpdate = freightTaxes.filter((tax) => tax.id);
          const toCreate = freightTaxes.filter((tax) => !tax.id);

          // Atualiza impostos existentes
          for (const tax of toUpdate) {
            await prisma.freightTax.update({
              where: { id: tax.id },
              data: {
                name: tax.name,
                rate: tax.rate,
              },
            });
          }

          // Cria novos impostos
          if (toCreate.length > 0) {
            await prisma.freightTax.createMany({
              data: toCreate.map((tax) => ({
                freightId: id,
                name: tax.name,
                rate: tax.rate,
              })),
            });
          }
        }

        // 3. Retorna o frete atualizado
        return prisma.freight.findUnique({
          where: { id },
          include: {
            freightTaxes: {
              select: {
                id: true,
                name: true,
                rate: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        });
      });

      return updatedFreight;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error?.code === 'P2002') {
        throw new ConflictException(
          'Já existe um frete com esses dados únicos',
        );
      }
      if (error?.code === 'P2025') {
        throw new NotFoundException(
          'Um ou mais impostos não foram encontrados',
        );
      }
      const message = error?.message || 'Erro desconhecido';
      throw new BadRequestException(`Erro ao atualizar frete: ${message}`);
    }
  }

  /**
   * Remove um frete (verifica dependências)
   */
  async remove(id: string) {
    try {
      const freight = await this.findOne(id);

      // Verifica se há matérias-primas usando este frete
      const rawMaterialsCount = await this.prisma.rawMaterial.count({
        where: { freightId: id },
      });

      if (rawMaterialsCount > 0) {
        throw new BadRequestException(
          `Não é possível remover este frete. Existem ${rawMaterialsCount} matéria(s)-prima(s) associada(s).`,
        );
      }

      // Delete cascade remove freightTaxes automaticamente
      await this.prisma.freight.delete({
        where: { id },
      });

      return {
        message: `Frete "${freight.name}" removido com sucesso`,
        id,
      };
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      const message = error?.message || 'Erro desconhecido';
      throw new BadRequestException(`Erro ao remover frete: ${message}`);
    }
  }

  /**
   * Exporta fretes em formato CSV
   */
  async exportToCSV(exportDto: ExportFreightDto): Promise<string> {
    try {
      const { limit, sortBy, sortOrder, filters } = exportDto;

      // Configurar filtros
      const where: any = {};

      if (filters?.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { originCity: { contains: filters.search, mode: 'insensitive' } },
          { destinationCity: { contains: filters.search, mode: 'insensitive' } },
          { cargoType: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      if (filters?.currency) {
        where.currency = filters.currency;
      }

      if (filters?.operationType) {
        where.operationType = filters.operationType;
      }

      if (filters?.originUf) {
        where.originUf = {
          contains: filters.originUf.toUpperCase(),
          mode: 'insensitive',
        };
      }

      if (filters?.destinationUf) {
        where.destinationUf = {
          contains: filters.destinationUf.toUpperCase(),
          mode: 'insensitive',
        };
      }

      // Buscar dados
      const freights = await this.prisma.freight.findMany({
        where,
        include: {
          freightTaxes: {
            select: {
              name: true,
              rate: true,
            },
          },
        },
        orderBy: {
          [sortBy || 'name']: sortOrder || 'asc',
        },
        take: limit || 1000,
      });

      // Montar CSV
      const headers = [
        'ID',
        'Nome',
        'Descrição',
        'Preço Unitário',
        'Moeda',
        'UF Origem',
        'Cidade Origem',
        'UF Destino',
        'Cidade Destino',
        'Tipo de Carga',
        'Tipo de Operação',
        'Impostos',
      ];

      const csvLines = [headers.join(',')];

      // Função para escapar campos CSV
      const escapeCsvField = (field: any): string => {
        if (field === null || field === undefined) return '';
        const str = String(field);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      // Adicionar linhas de dados
      for (const freight of freights) {
        const taxesStr = freight.freightTaxes
          .map((tax) => `${tax.name} (${tax.rate}%)`)
          .join('; ');

        const row = [
          escapeCsvField(freight.id),
          escapeCsvField(freight.name),
          escapeCsvField(freight.description || ''),
          escapeCsvField(freight.unitPrice.toFixed(2)),
          escapeCsvField(freight.currency),
          escapeCsvField(freight.originUf),
          escapeCsvField(freight.originCity),
          escapeCsvField(freight.destinationUf),
          escapeCsvField(freight.destinationCity),
          escapeCsvField(freight.cargoType),
          escapeCsvField(freight.operationType),
          escapeCsvField(taxesStr),
        ];

        csvLines.push(row.join(','));
      }

      return csvLines.join('\n');
    } catch (error: any) {
      const message = error?.message || 'Erro desconhecido';
      throw new BadRequestException(`Erro ao exportar fretes: ${message}`);
    }
  }

  // ============================================
  // MÉTODOS AUXILIARES
  // ============================================

  /**
   * Busca fretes por moeda
   */
  async findByCurrency(currency: Currency) {
    return this.prisma.freight.findMany({
      where: { currency },
      include: {
        freightTaxes: true,
      },
      orderBy: {
        unitPrice: 'asc',
      },
    });
  }

  /**
   * Busca fretes por tipo de operação
   */
  async findByOperationType(operationType: FreightOperationType) {
    return this.prisma.freight.findMany({
      where: { operationType },
      include: {
        freightTaxes: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Busca fretes por rota (UF origem e destino)
   */
  async findByRoute(originUf: string, destinationUf: string) {
    return this.prisma.freight.findMany({
      where: {
        originUf: originUf.toUpperCase(),
        destinationUf: destinationUf.toUpperCase(),
      },
      include: {
        freightTaxes: true,
      },
      orderBy: {
        unitPrice: 'asc',
      },
    });
  }

  /**
   * Busca fretes dentro de uma faixa de preço
   */
  async findByPriceRange(minPrice: number, maxPrice: number) {
    return this.prisma.freight.findMany({
      where: {
        unitPrice: {
          gte: minPrice,
          lte: maxPrice,
        },
      },
      include: {
        freightTaxes: true,
      },
      orderBy: {
        unitPrice: 'asc',
      },
    });
  }

  /**
   * Busca fretes por nome (busca parcial)
   */
  async searchByName(searchTerm: string) {
    return this.prisma.freight.findMany({
      where: {
        name: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      include: {
        freightTaxes: true,
      },
    });
  }

  /**
   * Retorna estatísticas dos fretes
   */
  async getStatistics() {
    const [total, byCurrency, byOperationType, avgPrice] = await Promise.all([
      this.prisma.freight.count(),
      this.prisma.freight.groupBy({
        by: ['currency'],
        _count: true,
      }),
      this.prisma.freight.groupBy({
        by: ['operationType'],
        _count: true,
      }),
      this.prisma.freight.aggregate({
        _avg: {
          unitPrice: true,
        },
        _min: {
          unitPrice: true,
        },
        _max: {
          unitPrice: true,
        },
      }),
    ]);

    return {
      total,
      byCurrency,
      byOperationType,
      prices: {
        average: avgPrice._avg.unitPrice,
        min: avgPrice._min.unitPrice,
        max: avgPrice._max.unitPrice,
      },
    };
  }

  /**
   * Deleta um imposto específico de um frete
   */
  async deleteFreightTax(freightId: string, taxId: string) {
    try {
      // Verifica se o frete existe
      await this.findOne(freightId);

      // Verifica se o imposto pertence ao frete
      const tax = await this.prisma.freightTax.findFirst({
        where: {
          id: taxId,
          freightId: freightId,
        },
      });

      if (!tax) {
        throw new NotFoundException(
          'Imposto não encontrado ou não pertence a este frete',
        );
      }

      await this.prisma.freightTax.delete({
        where: { id: taxId },
      });

      return {
        message: 'Imposto removido com sucesso',
        taxId,
      };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const message = error?.message || 'Erro desconhecido';
      throw new BadRequestException(`Erro ao remover imposto: ${message}`);
    }
  }
}
```

---

### `src/freights/dto/create-freight-tax.dto.ts`

```typescript
// =============================================
// src/freights/dto/create-freight-tax.dto.ts
// =============================================

import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFreightTaxDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome do imposto é obrigatório' })
  @MaxLength(100, {
    message: 'O nome do imposto deve ter no máximo 100 caracteres',
  })
  name: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'A taxa deve ter no máximo 2 casas decimais' },
  )
  @Min(0, { message: 'A taxa não pode ser negativa' })
  @Type(() => Number)
  rate: number;
}
```

---

### `src/freights/dto/create-freight.dto.ts`

```typescript
// =============================================
// src/freights/dto/create-freight.dto.ts
// =============================================

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsPositive,
  MaxLength,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  Matches,
} from 'class-validator';
import { Currency, FreightOperationType } from '@prisma/client';
import { Type } from 'class-transformer';
import { CreateFreightTaxDto } from './create-freight-tax.dto';

export class CreateFreightDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome do frete é obrigatório' })
  @MaxLength(255, { message: 'O nome deve ter no máximo 255 caracteres' })
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000, {
    message: 'A descrição deve ter no máximo 5000 caracteres',
  })
  description?: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'O preço unitário deve ter no máximo 2 casas decimais' },
  )
  @IsPositive({ message: 'O preço unitário deve ser positivo' })
  @Type(() => Number)
  unitPrice: number;

  @IsEnum(Currency, { message: 'Moeda inválida. Use BRL, USD ou EUR' })
  currency: Currency;

  @IsString()
  @IsNotEmpty({ message: 'O UF de origem é obrigatório' })
  @MaxLength(2, { message: 'O UF deve ter 2 caracteres' })
  @Matches(/^[A-Z]{2}$/, { message: 'O UF deve conter apenas letras maiúsculas' })
  originUf: string;

  @IsString()
  @IsNotEmpty({ message: 'A cidade de origem é obrigatória' })
  @MaxLength(100, { message: 'A cidade deve ter no máximo 100 caracteres' })
  originCity: string;

  @IsString()
  @IsNotEmpty({ message: 'O UF de destino é obrigatório' })
  @MaxLength(2, { message: 'O UF deve ter 2 caracteres' })
  @Matches(/^[A-Z]{2}$/, { message: 'O UF deve conter apenas letras maiúsculas' })
  destinationUf: string;

  @IsString()
  @IsNotEmpty({ message: 'A cidade de destino é obrigatória' })
  @MaxLength(100, { message: 'A cidade deve ter no máximo 100 caracteres' })
  destinationCity: string;

  @IsString()
  @IsNotEmpty({ message: 'O tipo de carga é obrigatório' })
  @MaxLength(100, { message: 'O tipo de carga deve ter no máximo 100 caracteres' })
  cargoType: string;

  @IsEnum(FreightOperationType, {
    message: 'Tipo de operação inválido. Use INTERNAL ou EXTERNAL',
  })
  operationType: FreightOperationType;

  @IsArray({ message: 'Os impostos devem ser um array' })
  @ValidateNested({ each: true })
  @ArrayMinSize(0, { message: 'Deve haver pelo menos 0 impostos' })
  @Type(() => CreateFreightTaxDto)
  @IsOptional()
  freightTaxes?: CreateFreightTaxDto[];
}
```

---

### `src/freights/dto/export-freight.dto.ts`

```typescript
// =============================================
// src/freights/dto/export-freight.dto.ts
// =============================================

import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsIn,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Currency, FreightOperationType } from '@prisma/client';

export class ExportFiltersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(Currency, { message: 'Moeda inválida. Use BRL, USD ou EUR' })
  currency?: Currency;

  @IsOptional()
  @IsEnum(FreightOperationType, {
    message: 'Tipo de operação inválido. Use INTERNAL ou EXTERNAL',
  })
  operationType?: FreightOperationType;

  @IsOptional()
  @IsString()
  originUf?: string;

  @IsOptional()
  @IsString()
  destinationUf?: string;
}

export class ExportFreightDto {
  @IsString()
  @IsIn(['csv'], { message: 'Formato inválido. Use csv' })
  format: string = 'csv';

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O limite deve ser um número inteiro' })
  @Min(1, { message: 'O limite deve ser no mínimo 1' })
  @Max(10000, { message: 'O limite deve ser no máximo 10000' })
  limit?: number = 1000;

  @IsOptional()
  @IsIn([
    'name',
    'unitPrice',
    'originUf',
    'destinationUf',
    'cargoType',
    'operationType',
    'createdAt',
    'updatedAt',
  ], {
    message: 'Campo de ordenação inválido',
  })
  sortBy?: string = 'name';

  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'Ordem inválida. Use asc ou desc' })
  sortOrder?: 'asc' | 'desc' = 'asc';

  @IsOptional()
  @ValidateNested()
  @Type(() => ExportFiltersDto)
  filters?: ExportFiltersDto;
}
```

---

### `src/freights/dto/query-freight.dto.ts`

```typescript
// =============================================
// src/freights/dto/query-freight.dto.ts
// =============================================

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
import { Currency, FreightOperationType } from '@prisma/client';

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
  search?: string;

  @IsOptional()
  @IsEnum(Currency, { message: 'Moeda inválida. Use BRL, USD ou EUR' })
  currency?: Currency;

  @IsOptional()
  @IsEnum(FreightOperationType, {
    message: 'Tipo de operação inválido. Use INTERNAL ou EXTERNAL',
  })
  operationType?: FreightOperationType;

  @IsOptional()
  @IsString()
  originUf?: string;

  @IsOptional()
  @IsString()
  destinationUf?: string;

  @IsOptional()
  @IsIn([
    'name',
    'unitPrice',
    'originUf',
    'destinationUf',
    'cargoType',
    'operationType',
    'createdAt',
    'updatedAt',
  ], {
    message: 'Campo de ordenação inválido',
  })
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'Ordem inválida. Use asc ou desc' })
  sortOrder?: 'asc' | 'desc' = 'desc';
}
```

---

### `src/freights/dto/update-freight-tax.dto.ts`

```typescript
// =============================================
// src/freights/dto/update-freight-tax.dto.ts
// =============================================

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

export class UpdateFreightTaxDto {
  @IsUUID('4', { message: 'O ID deve ser um UUID válido' })
  @IsOptional()
  id?: string;

  @IsString()
  @IsNotEmpty({ message: 'O nome do imposto é obrigatório' })
  @MaxLength(100, {
    message: 'O nome do imposto deve ter no máximo 100 caracteres',
  })
  name: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'A taxa deve ter no máximo 2 casas decimais' },
  )
  @Min(0, { message: 'A taxa não pode ser negativa' })
  @Type(() => Number)
  rate: number;
}
```

---

### `src/freights/dto/update-freight.dto.ts`

```typescript
// =============================================
// src/freights/dto/update-freight.dto.ts
// =============================================

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

export class UpdateFreightDto extends PartialType(
  OmitType(CreateFreightDto, ['freightTaxes'] as const),
) {
  @IsArray({ message: 'Os impostos devem ser um array' })
  @ValidateNested({ each: true })
  @ArrayMinSize(0)
  @Type(() => UpdateFreightTaxDto)
  @IsOptional()
  freightTaxes?: UpdateFreightTaxDto[];
}
```

---

### `src/freights/entities/freight.entity.ts`

```typescript
// src/freights/entities/freight.entity.ts

import { Currency, FreightOperationType } from '@prisma/client';

/**
 * Entity que representa um Frete no sistema.
 * Corresponde ao modelo Freight do Prisma schema atualizado.
 */
export class Freight {
  id: string;
  name: string;
  description?: string | null;
  unitPrice: number;
  currency: Currency;
  originUf: string;
  originCity: string;
  destinationUf: string;
  destinationCity: string;
  cargoType: string;
  operationType: FreightOperationType;
  createdAt: Date;
  updatedAt: Date;

  // Relações (opcionais, aparecem quando usamos include no Prisma)
  freightTaxes?: FreightTax[];
  rawMaterials?: RawMaterial[];
  _count?: {
    rawMaterials: number;
  };
}

/**
 * Entity que representa um Imposto de Frete no sistema.
 * Corresponde ao modelo FreightTax do Prisma schema.
 */
export class FreightTax {
  id: string;
  freightId: string;
  name: string;
  rate: number;
  createdAt: Date;
  updatedAt: Date;

  // Relação
  freight?: Freight;
}

/**
 * Interface simplificada de RawMaterial para relações
 */
interface RawMaterial {
  id: string;
  code: string;
  name: string;
}
```

---

