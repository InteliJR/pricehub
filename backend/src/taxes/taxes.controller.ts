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
} from '@nestjs/common';
import { TaxesService } from './taxes.service';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('taxes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TaxesController {
  constructor(private readonly taxesService: TaxesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.IMPOSTO)
  create(@Body() createTaxDto: CreateTaxDto) {
    return this.taxesService.create(createTaxDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.IMPOSTO, UserRole.COMERCIAL)
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search?: string,
    @Query('sortBy') sortBy = 'name',
    @Query('sortOrder') sortOrder = 'asc',
  ) {
    return this.taxesService.findAll({
      page: Number(page),
      limit: Number(limit),
      search,
      sortBy,
      sortOrder,
    });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.IMPOSTO, UserRole.COMERCIAL)
  findOne(@Param('id') id: string) {
    return this.taxesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.IMPOSTO)
  update(@Param('id') id: string, @Body() updateTaxDto: UpdateTaxDto) {
    return this.taxesService.update(id, updateTaxDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.IMPOSTO)
  remove(@Param('id') id: string) {
    return this.taxesService.remove(id);
  }

  @Post('export')
  @Roles(UserRole.ADMIN, UserRole.IMPOSTO)
  export(@Body() payload: any) {
    return this.taxesService.export(payload);
  }
}
