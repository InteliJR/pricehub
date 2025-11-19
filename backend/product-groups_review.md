### `src/product-groups/product-groups.controller.ts`

```typescript
// src/product-groups/product-groups.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Res,
  HttpStatus,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { ProductGroupsService } from './product-groups.service';
import { CreateProductGroupDto } from './dto/create-product-group.dto';
import { UpdateProductGroupDto } from './dto/update-product-group.dto';
import { QueryProductGroupDto } from './dto/query-product-group.dto';
import { ExportProductGroupDto } from './dto/export-product-group.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('product-groups')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductGroupsController {
  constructor(
    private readonly productGroupsService: ProductGroupsService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  create(@Body() createProductGroupDto: CreateProductGroupDto) {
    return this.productGroupsService.create(createProductGroupDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  findAll(@Query() query: QueryProductGroupDto) {
    return this.productGroupsService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  findOne(@Param('id') id: string) {
    return this.productGroupsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  update(
    @Param('id') id: string,
    @Body() updateProductGroupDto: UpdateProductGroupDto,
  ) {
    return this.productGroupsService.update(id, updateProductGroupDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.productGroupsService.remove(id);
  }

  @Post('export')
  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  async export(
    @Body() exportDto: ExportProductGroupDto,
    @Res() res: Response,
  ) {
    const data = await this.productGroupsService.findAllForExport(exportDto);

    // Criar CSV simples
    const headers = [
      'Nome',
      'Descrição',
      'Qtd. Produtos',
      'Vol. % (Quantidade)',
      'Vol. % (Valor)',
      'Preço Médio',
    ];

    const rows = data.map((item) => [
      item.name,
      item.description || '',
      item.productsCount,
      `${item.volumePercentageByQuantity}%`,
      `${item.volumePercentageByValue}%`,
      `R$ ${item.averagePrice.toFixed(2)}`,
    ]);

    // Gerar CSV
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(','),
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=grupos-produtos-${Date.now()}.csv`,
    );

    return res.status(HttpStatus.OK).send('\uFEFF' + csvContent);
  }
}
```

---

### `src/product-groups/product-groups.module.ts`

```typescript
// src/product-groups/product-groups.module.ts

import { Module } from '@nestjs/common';
import { ProductGroupsService } from './product-groups.service';
import { ProductGroupsController } from './product-groups.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProductGroupsController],
  providers: [ProductGroupsService],
  exports: [ProductGroupsService],
})
export class ProductGroupsModule {}
```

---

### `src/product-groups/product-groups.service.ts`

```typescript
// src/product-groups/product-groups.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductGroupDto } from './dto/create-product-group.dto';
import { UpdateProductGroupDto } from './dto/update-product-group.dto';
import { QueryProductGroupDto } from './dto/query-product-group.dto';
import { ProductGroupEntity } from './entities/product-group.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductGroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createProductGroupDto: CreateProductGroupDto,
  ): Promise<ProductGroupEntity> {
    try {
      const productGroup = await this.prisma.productGroup.create({
        data: createProductGroupDto,
        include: {
          products: {
            select: {
              priceWithTaxesAndFreight: true,
            },
          },
        },
      });

      return this.mapToEntity(productGroup);
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Já existe um grupo com este nome');
      }
      throw error;
    }
  }

  async findAll(query: QueryProductGroupDto) {
    const { page = 1, limit = 10, search, sortBy = 'name', sortOrder = 'asc' } = query;
    const skip = (page - 1) * limit;

    // Filtro de busca
    const where: Prisma.ProductGroupWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    // Buscar grupos com produtos
    const [productGroups, total] = await Promise.all([
      this.prisma.productGroup.findMany({
        where,
        include: {
          products: {
            select: {
              priceWithTaxesAndFreight: true,
            },
          },
        },
        skip,
        take: limit,
      }),
      this.prisma.productGroup.count({ where }),
    ]);

    // Buscar totais globais para cálculo de percentuais
    const globalStats = await this.getGlobalStats();

    // Mapear para entidades com cálculos
    let data = productGroups.map((group) =>
      this.mapToEntityWithStats(group, globalStats),
    );

    // Ordenação
    data = this.sortProductGroups(data, sortBy, sortOrder);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<ProductGroupEntity> {
    const productGroup = await this.prisma.productGroup.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            priceWithTaxesAndFreight: true,
          },
        },
      },
    });

    if (!productGroup) {
      throw new NotFoundException('Grupo de produtos não encontrado');
    }

    const globalStats = await this.getGlobalStats();
    return this.mapToEntityWithStats(productGroup, globalStats);
  }

  async update(
    id: string,
    updateProductGroupDto: UpdateProductGroupDto,
  ): Promise<ProductGroupEntity> {
    try {
      const productGroup = await this.prisma.productGroup.update({
        where: { id },
        data: updateProductGroupDto,
        include: {
          products: {
            select: {
              priceWithTaxesAndFreight: true,
            },
          },
        },
      });

      const globalStats = await this.getGlobalStats();
      return this.mapToEntityWithStats(productGroup, globalStats);
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new NotFoundException('Grupo de produtos não encontrado');
      }
      if (error?.code === 'P2002') {
        throw new ConflictException('Já existe um grupo com este nome');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.productGroup.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new NotFoundException('Grupo de produtos não encontrado');
      }
      throw error;
    }
  }

  async findAllForExport(query: any) {
    const { search, sortBy = 'name', sortOrder = 'asc', limit } = query;

    const where: Prisma.ProductGroupWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const productGroups = await this.prisma.productGroup.findMany({
      where,
      include: {
        products: {
          select: {
            priceWithTaxesAndFreight: true,
          },
        },
      },
      take: limit,
    });

    const globalStats = await this.getGlobalStats();
    let data = productGroups.map((group) =>
      this.mapToEntityWithStats(group, globalStats),
    );

    return this.sortProductGroups(data, sortBy, sortOrder);
  }

  // ===== MÉTODOS AUXILIARES =====

  private async getGlobalStats() {
    const allProducts = await this.prisma.product.findMany({
      select: {
        priceWithTaxesAndFreight: true,
      },
    });

    const totalQuantity = allProducts.length;
    const totalValue = allProducts.reduce(
      (sum, p) => sum + (p.priceWithTaxesAndFreight?.toNumber() || 0),
      0,
    );

    return { totalQuantity, totalValue };
  }

  private mapToEntity(group: any): ProductGroupEntity {
    return {
      id: group.id,
      name: group.name,
      description: group.description,
      productsCount: group.products?.length || 0,
      volumePercentageByQuantity: 0,
      volumePercentageByValue: 0,
      averagePrice: 0,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  }

  private mapToEntityWithStats(
    group: any,
    globalStats: { totalQuantity: number; totalValue: number },
  ): ProductGroupEntity {
    const productsCount = group.products?.length || 0;
    const groupValue = group.products.reduce(
      (sum, p) => sum + (p.priceWithTaxesAndFreight?.toNumber() || 0),
      0,
    );

    const volumePercentageByQuantity =
      globalStats.totalQuantity > 0
        ? (productsCount / globalStats.totalQuantity) * 100
        : 0;

    const volumePercentageByValue =
      globalStats.totalValue > 0
        ? (groupValue / globalStats.totalValue) * 100
        : 0;

    const averagePrice = productsCount > 0 ? groupValue / productsCount : 0;

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      productsCount,
      volumePercentageByQuantity: Number(volumePercentageByQuantity.toFixed(2)),
      volumePercentageByValue: Number(volumePercentageByValue.toFixed(2)),
      averagePrice: Number(averagePrice.toFixed(2)),
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  }

  private sortProductGroups(
    data: ProductGroupEntity[],
    sortBy: string,
    sortOrder: 'asc' | 'desc',
  ): ProductGroupEntity[] {
    return data.sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (sortBy) {
        case 'name':
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case 'volumePercentageByQuantity':
          valueA = a.volumePercentageByQuantity;
          valueB = b.volumePercentageByQuantity;
          break;
        case 'volumePercentageByValue':
          valueA = a.volumePercentageByValue;
          valueB = b.volumePercentageByValue;
          break;
        case 'averagePrice':
          valueA = a.averagePrice;
          valueB = b.averagePrice;
          break;
        default:
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      } else {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      }
    });
  }
}
```

---

### `src/product-groups/dto/create-product-group.dto.ts`

```typescript
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
```

---

### `src/product-groups/dto/export-product-group.dto.ts`

```typescript
// src/product-groups/dto/export-product-group.dto.ts

import { IsOptional, IsString, IsIn, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ExportProductGroupDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['name', 'volumePercentageByQuantity', 'volumePercentageByValue', 'averagePrice'])
  sortBy?: string = 'name';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
```

---

### `src/product-groups/dto/query-product-group.dto.ts`

```typescript
// src/product-groups/dto/query-product-group.dto.ts

import { IsOptional, IsString, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryProductGroupDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['name', 'volumePercentageByQuantity', 'volumePercentageByValue', 'averagePrice'])
  sortBy?: string = 'name';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';
}
```

---

### `src/product-groups/dto/update-product-group.dto.ts`

```typescript
// src/product-groups/dto/update-product-group.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { CreateProductGroupDto } from './create-product-group.dto';

export class UpdateProductGroupDto extends PartialType(CreateProductGroupDto) {}
```

---

### `src/product-groups/entities/product-group.entity.ts`

```typescript
// src/product-groups/entities/product-group.entity.ts

export class ProductGroupEntity {
  id: string;
  name: string;
  description?: string;
  productsCount: number;
  volumePercentageByQuantity: number;
  volumePercentageByValue: number;
  averagePrice: number;
  createdAt: Date;
  updatedAt: Date;
}
```

---

