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