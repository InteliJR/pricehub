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
  Req,
  HttpCode,
  HttpStatus,
  ParseBoolPipe,
  DefaultValuePipe,
  ParseIntPipe,
  Header,
  BadRequestException,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CalculatePriceDto } from './dto/calculate-price.dto';
import { ExportProductsDto } from './dto/export-products.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.COMERCIAL)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  create(@Body() createProductDto: CreateProductDto, @Req() req: any) {
    // Debug: verificar o que está vindo no req.user
    console.log('req.user:', req.user);

    // O JWT pode retornar "sub" ou "userId" dependendo da configuração
    const userId = req.user?.sub || req.user?.userId || req.user?.id;

    if (!userId) {
      throw new BadRequestException('Usuário não identificado no token');
    }

    return this.productsService.create(createProductDto, userId);
  }

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('search') search?: string,
    @Query('sortBy', new DefaultValuePipe('code')) sortBy?: string,
    @Query('sortOrder', new DefaultValuePipe('asc')) sortOrder?: 'asc' | 'desc',
    @Query('includeRawMaterials', new DefaultValuePipe(false), ParseBoolPipe)
    includeRawMaterials?: boolean,
    @Query('includeFixedCost', new DefaultValuePipe(false), ParseBoolPipe)
    includeFixedCost?: boolean,
    @Query('includeCalculations', new DefaultValuePipe(false), ParseBoolPipe)
    includeCalculations?: boolean,
  ) {
    return this.productsService.findAll({
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      includeRawMaterials,
      includeFixedCost,
      includeCalculations,
    });
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('includeRawMaterials', new DefaultValuePipe(false), ParseBoolPipe)
    includeRawMaterials?: boolean,
    @Query('includeFixedCost', new DefaultValuePipe(false), ParseBoolPipe)
    includeFixedCost?: boolean,
    @Query('includeCalculations', new DefaultValuePipe(false), ParseBoolPipe)
    includeCalculations?: boolean,
    @Query('includeDetailedTaxes', new DefaultValuePipe(false), ParseBoolPipe)
    includeDetailedTaxes?: boolean,
  ) {
    return this.productsService.findOne(id, {
      includeRawMaterials,
      includeFixedCost,
      includeCalculations,
      includeDetailedTaxes,
    });
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Post('calculate-price')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  calculatePrice(@Body() calculatePriceDto: CalculatePriceDto) {
    return this.productsService.calculateProductPrice(calculatePriceDto);
  }

  @Post('export')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  @Header('Content-Type', 'text/csv')
  @Header(
    'Content-Disposition',
    `attachment; filename="produtos-${new Date().toISOString().split('T')[0]}.csv"`,
  )
  async exportProducts(@Body() exportDto: ExportProductsDto) {
    return this.productsService.exportProducts(exportDto);
  }
}
