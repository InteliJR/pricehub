import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { FreightsService } from './freights.service';
import { CreateFreightDto } from './dto/create-freight.dto';
import { UpdateFreightDto } from './dto/update-freight.dto';
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

  /**
   * Lista todos os fretes
   * ADMIN e LOGISTICA podem visualizar
   */
  @Get()
  findAll() {
    return this.freightsService.findAll();
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