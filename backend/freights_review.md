### `src/freights/freights.controller.ts`

```typescript
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
  Res, // <-- Importado para manipulação da resposta nativa
  HttpStatus, // <-- Importado para retornar o status 200 OK
} from '@nestjs/common';
import type { Response } from 'express'; // <-- Usar 'import type' para evitar o erro TS1272
import { FreightsService } from './freights.service';
import { CreateFreightDto } from './dto/create-freight.dto';
import { UpdateFreightDto } from './dto/update-freight.dto';
import { QueryFreightDto } from './dto/query-freight.dto';
import { ExportFreightDto } from './dto/export-freight.dto'; // <-- Importação do DTO de exportação
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('freights')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.LOGISTICA)
export class FreightsController {
  constructor(private readonly freightsService: FreightsService) {}

  /**
   * Cria um novo frete (com impostos opcionais)
   * Apenas ADMIN e LOGISTICA podem criar
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA)
  create(@Body() createFreightDto: CreateFreightDto) {
    return this.freightsService.create(createFreightDto);
  }

  // --- ROTA ADICIONADA: POST /freights/export (para download de CSV) ---
  /**
   * Exporta fretes em formato CSV com filtros e ordenação
   * Apenas ADMIN e LOGISTICA podem exportar
   */
  @Post('export') // Define o endpoint POST para /freights/export
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA)
  async export(
    @Body() exportDto: ExportFreightDto, // Parâmetros de filtro e exportação
    @Res() res: Response, // Usa a resposta nativa do Express para forçar o download
  ) {
    const csvData = await this.freightsService.exportToCSV(exportDto);

    // Configura os cabeçalhos para o download do arquivo CSV
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="fretes_export_${Date.now()}.csv"`,
    );

    // Envia os dados CSV
    res.status(HttpStatus.OK).send(csvData);
  }
  // -----------------------------------------------------------------------

  /**
   * Lista todos os fretes com paginação e filtros
   * Query params: ?page=1&limit=10&search=nome&currency=BRL&sortBy=name&sortOrder=asc
   * ADMIN e LOGISTICA podem visualizar
   */
  @Get()
  findAll(@Query() query: QueryFreightDto) {
    return this.freightsService.findAll(query);
  }

  /**
   * Busca um frete específico por ID
   * ADMIN e LOGISTICA podem visualizar
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.freightsService.findOne(id);
  }

  /**
   * Atualiza um frete existente
   * Apenas ADMIN e LOGISTICA podem atualizar
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA)
  update(@Param('id') id: string, @Body() updateFreightDto: UpdateFreightDto) {
    return this.freightsService.update(id, updateFreightDto);
  }

  /**
   * Remove um frete
   * Apenas ADMIN pode deletar
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.freightsService.remove(id);
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
import { Currency } from '@prisma/client';

@Injectable()
export class FreightsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo registro de frete com impostos opcionais
   */
  async create(createFreightDto: CreateFreightDto) {
    try {
      const freight = await this.prisma.freight.create({
        data: {
          name: createFreightDto.name,
          description: createFreightDto.description,
          paymentTerm: createFreightDto.paymentTerm,
          unitPrice: createFreightDto.unitPrice,
          currency: createFreightDto.currency || Currency.BRL,
          additionalCosts: createFreightDto.additionalCosts || 0,
          // Cria os impostos junto (nested create)
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
          freightTaxes: true,
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
   * Retorna todos os fretes com paginação, filtros e ordenação
   */
  async findAll(query: QueryFreightDto) {
    try {
      // Valores padrão
      const page = query.page || 1;
      const limit = query.limit || 10;
      const sortBy = query.sortBy || 'createdAt';
      const sortOrder = query.sortOrder || 'desc';
      const { search, currency } = query;

      // Configurar filtros
      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (currency) {
        where.currency = currency;
      }

      // Calcular skip para paginação
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

      // Calcular total de páginas
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
          freightTaxes: true,
          rawMaterials: {
            select: {
              id: true,
              code: true,
              name: true,
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
   * Atualiza um frete existente (com suporte a criar/atualizar impostos)
   */
  async update(id: string, updateFreightDto: UpdateFreightDto) {
    try {
      // Verifica se existe
      await this.findOne(id);

      // Extrai freightTaxes para tratar separadamente
      const { freightTaxes, ...freightData } = updateFreightDto;

      // Inicia transação para garantir consistência
      const updatedFreight = await this.prisma.$transaction(async (prisma) => {
        // 1. Atualiza os dados do frete (SEM freightTaxes)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const freight = await prisma.freight.update({
          where: { id },
          data: freightData,
        });

        // 2. Gerencia impostos (se fornecidos)
        if (freightTaxes && freightTaxes.length > 0) {
          // Separa impostos para atualizar e criar
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

        // 3. Retorna o frete atualizado com impostos
        return prisma.freight.findUnique({
          where: { id },
          include: {
            freightTaxes: true,
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
   * Remove um frete (verifica se não está em uso)
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

      // Delete cascade vai remover freightTaxes automaticamente
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

  // ============================================
  // MÉTODOS EXTRAS ÚTEIS
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
   * Busca fretes com prazo de pagamento específico
   */
  async findByPaymentTerm(days: number) {
    return this.prisma.freight.findMany({
      where: {
        paymentTerm: days,
      },
      include: {
        freightTaxes: true,
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
    const [total, byCurrency, avgPrice] = await Promise.all([
      this.prisma.freight.count(),
      this.prisma.freight.groupBy({
        by: ['currency'],
        _count: true,
      }),
      this.prisma.freight.aggregate({
        _avg: {
          unitPrice: true,
          additionalCosts: true,
        },
      }),
    ]);

    return {
      total,
      byCurrency,
      averagePrices: {
        unitPrice: avgPrice._avg.unitPrice,
        additionalCosts: avgPrice._avg.additionalCosts,
      },
    };
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
        ];
      }

      if (filters?.currency) {
        where.currency = filters.currency;
      }

      // Buscar dados com limite
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

      // Montar o CSV
      const headers = [
        'ID',
        'Nome',
        'Descrição',
        'Prazo (dias)',
        'Preço Unitário',
        'Moeda',
        'Custos Adicionais',
        'Impostos',
      ];

      // Linha de cabeçalho
      const csvLines = [headers.join(',')];

      // Linhas de dados
      for (const freight of freights) {
        // Formatar impostos como string: "ICMS (12%), PIS (1.65%)"
        const taxesStr = freight.freightTaxes
          .map((tax) => `${tax.name} (${tax.rate}%)`)
          .join(', ');

        // Escapar campos que possam conter vírgulas ou aspas
        const escapeCsvField = (field: any): string => {
          if (field === null || field === undefined) return '';
          const str = String(field);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        };

        const row = [
          escapeCsvField(freight.id),
          escapeCsvField(freight.name),
          escapeCsvField(freight.description || ''),
          escapeCsvField(freight.paymentTerm),
          escapeCsvField(freight.unitPrice.toFixed(2)),
          escapeCsvField(freight.currency),
          escapeCsvField(freight.additionalCosts.toFixed(2)),
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
}
```

---

### `src/freights/dto/update-freight-tax.dto.ts`

```typescript
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

### `src/freights/dto/export-freight.dto.ts`

```typescript
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
import { Currency } from '@prisma/client';

/**
 * Sub-DTO para os filtros de exportação
 */
export class ExportFiltersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(Currency, { message: 'Moeda inválida. Use BRL, USD ou EUR' })
  currency?: Currency;
}

/**
 * DTO para exportação de fretes
 */
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
  @IsIn(['name', 'unitPrice', 'paymentTerm', 'createdAt', 'updatedAt'], {
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

### `src/freights/dto/update-freight.dto.ts`

```typescript
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
```

---

### `src/freights/dto/create-freight.dto.ts`

```typescript
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsPositive,
  IsNumber,
  IsEnum,
  Min,
  MaxLength,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Currency } from '@prisma/client';
import { Type } from 'class-transformer';

/**
 * DTO para criar impostos do frete junto com o frete
 */
export class CreateFreightTaxDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome do imposto é obrigatório' })
  @MaxLength(100, {
    message: 'O nome do imposto deve ter no máximo 100 caracteres',
  })
  name: string; // ICMS, PIS, COFINS, IPI, etc

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'A taxa deve ter no máximo 2 casas decimais' },
  )
  @Min(0, { message: 'A taxa não pode ser negativa' })
  @Type(() => Number)
  rate: number; // Ex: 7.60 (%)
}

/**
 * DTO para criação de um novo frete
 */
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

  @IsInt({ message: 'O prazo de pagamento deve ser um número inteiro' })
  @IsPositive({ message: 'O prazo de pagamento deve ser positivo' })
  @Type(() => Number)
  paymentTerm: number; // em dias

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'O preço unitário deve ter no máximo 2 casas decimais' },
  )
  @IsPositive({ message: 'O preço unitário deve ser positivo' })
  @Type(() => Number)
  unitPrice: number;

  @IsEnum(Currency, { message: 'Moeda inválida. Use BRL, USD ou EUR' })
  @IsOptional()
  currency?: Currency = Currency.BRL;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Os custos adicionais devem ter no máximo 2 casas decimais' },
  )
  @Min(0, { message: 'Os custos adicionais não podem ser negativos' })
  @IsOptional()
  @Type(() => Number)
  additionalCosts?: number = 0;

  @IsArray({ message: 'Os impostos devem ser um array' })
  @ValidateNested({ each: true })
  @ArrayMinSize(0)
  @Type(() => CreateFreightTaxDto)
  @IsOptional()
  freightTaxes?: CreateFreightTaxDto[];
}
```

---

### `src/freights/dto/query-freight.dto.ts`

```typescript
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
```

---

### `src/freights/entities/freight.entity.ts`

```typescript
import { Currency } from '@prisma/client';

/**
 * Entity que representa um Frete no sistema.
 * Corresponde ao modelo Freight do Prisma schema.
 */
export class Freight {
  id: string;
  name: string;
  description?: string | null;
  paymentTerm: number;
  unitPrice: number;
  currency: Currency;
  additionalCosts: number;
  createdAt: Date;
  updatedAt: Date;

  // Relações (opcionais, aparecem quando usamos include no Prisma)
  // freightTaxes?: FreightTax[];
  // rawMaterials?: RawMaterial[];
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
  // freight?: Freight;
}
```

---

