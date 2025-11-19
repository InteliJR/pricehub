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
import { Prisma } from '@prisma/client';

@Injectable()
export class RawMaterialsService {
  constructor(
    private readonly prisma: PrismaService,
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

    // CORREÇÃO AQUI: chamada direta ao método privado desta classe
    return this.generateCsv(formattedData);
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

  private generateCsv(data: any[]): string {
    if (!data || data.length === 0) {
      return '';
    }

    // 1. Cabeçalhos
    const headers = Object.keys(data[0]);
    const headerRow = headers.join(',');

    // 2. Linhas de dados
    const rows = data.map((row) => {
      return headers
        .map((fieldName) => {
          const value = row[fieldName];
          // Escapar aspas duplas e garantir que string seja retornada
          const stringValue = value === null || value === undefined ? '' : String(value);
          // Envolve em aspas para lidar com vírgulas dentro do conteúdo
          return `"${stringValue.replace(/"/g, '""')}"`;
        })
        .join(',');
    });

    return [headerRow, ...rows].join('\n');
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