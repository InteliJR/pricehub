// src/taxes/taxes.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFreightTaxDto } from './dto/create-freight-tax.dto';
import { UpdateFreightTaxDto } from './dto/update-freight-tax.dto';
import { CreateRawMaterialTaxDto } from './dto/create-raw-material-tax.dto';
import { UpdateRawMaterialTaxDto } from './dto/update-raw-material-tax.dto';
import { QueryTaxesDto } from './dto/query-taxes.dto';
import { ExportTaxesDto } from './dto/export-taxes.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TaxesService {
  constructor(private readonly prisma: PrismaService) {}

  // ========================================
  // FREIGHT TAXES
  // ========================================

  async findAllFreightTaxes(query: QueryTaxesDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy || 'name';
    const sortOrder = query.sortOrder || 'asc';

    // Construir filtro de busca
    const where: Prisma.FreightTaxWhereInput = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        {
          freight: {
            name: { contains: query.search, mode: 'insensitive' },
          },
        },
      ];
    }

    // Executar consulta com paginação
    const [data, total] = await Promise.all([
      this.prisma.freightTax.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          freight: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.freightTax.count({ where }),
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

  async findOneFreightTax(id: string) {
    const tax = await this.prisma.freightTax.findUnique({
      where: { id },
      include: {
        freight: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!tax) {
      throw new NotFoundException('Imposto de frete não encontrado');
    }

    return tax;
  }

  async createFreightTax(dto: CreateFreightTaxDto) {
    // Verificar se o frete existe
    const freight = await this.prisma.freight.findUnique({
      where: { id: dto.freightId },
    });

    if (!freight) {
      throw new BadRequestException('Frete não encontrado');
    }

    // Criar o imposto
    const tax = await this.prisma.freightTax.create({
      data: {
        name: dto.name,
        rate: new Prisma.Decimal(dto.rate),
        freightId: dto.freightId,
      },
      include: {
        freight: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return tax;
  }

  async updateFreightTax(id: string, dto: UpdateFreightTaxDto) {
    // Verificar se existe
    await this.findOneFreightTax(id);

    // Se está tentando mudar o frete, verificar se existe
    if (dto.freightId) {
      const freight = await this.prisma.freight.findUnique({
        where: { id: dto.freightId },
      });

      if (!freight) {
        throw new BadRequestException('Frete não encontrado');
      }
    }

    // Atualizar
    const updateData: Prisma.FreightTaxUpdateInput = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name;
    }

    if (dto.rate !== undefined) {
      updateData.rate = new Prisma.Decimal(dto.rate);
    }

    if (dto.freightId !== undefined) {
      updateData.freight = { connect: { id: dto.freightId } };
    }

    const tax = await this.prisma.freightTax.update({
      where: { id },
      data: updateData,
      include: {
        freight: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return tax;
  }

  async removeFreightTax(id: string) {
    // Verificar se existe
    await this.findOneFreightTax(id);

    // Deletar
    await this.prisma.freightTax.delete({
      where: { id },
    });

    return { message: 'Imposto de frete excluído com sucesso' };
  }

  async exportFreightTaxes(dto: ExportTaxesDto) {
    const limit = dto.limit || 500;
    const sortBy = dto.sortBy || 'name';
    const sortOrder = dto.sortOrder || 'asc';

    // Construir filtro
    const where: Prisma.FreightTaxWhereInput = {};

    if (dto.filters?.search) {
      where.OR = [
        { name: { contains: dto.filters.search, mode: 'insensitive' } },
        {
          freight: {
            name: { contains: dto.filters.search, mode: 'insensitive' },
          },
        },
      ];
    }

    // Buscar dados
    const taxes = await this.prisma.freightTax.findMany({
      where,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        freight: {
          select: {
            name: true,
          },
        },
      },
    });

    // Gerar CSV
    const header = 'Nome,Taxa (%),Frete,Data de Criação';
    const rows = taxes.map((tax) => {
      const name = this.escapeCsv(tax.name);
      const rate = Number(tax.rate).toFixed(2);
      const freightName = this.escapeCsv(tax.freight?.name || 'N/A');
      const createdAt = new Date(tax.createdAt).toLocaleDateString('pt-BR');

      return `${name},${rate},${freightName},${createdAt}`;
    });

    return [header, ...rows].join('\n');
  }

  // ========================================
  // RAW MATERIAL TAXES
  // ========================================

  async findAllRawMaterialTaxes(query: QueryTaxesDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy || 'name';
    const sortOrder = query.sortOrder || 'asc';

    // Construir filtro de busca
    const where: Prisma.RawMaterialTaxWhereInput = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        {
          rawMaterial: {
            name: { contains: query.search, mode: 'insensitive' },
          },
        },
        {
          rawMaterial: {
            code: { contains: query.search, mode: 'insensitive' },
          },
        },
      ];
    }

    // Executar consulta com paginação
    const [data, total] = await Promise.all([
      this.prisma.rawMaterialTax.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          rawMaterial: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      }),
      this.prisma.rawMaterialTax.count({ where }),
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

  async findOneRawMaterialTax(id: string) {
    const tax = await this.prisma.rawMaterialTax.findUnique({
      where: { id },
      include: {
        rawMaterial: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!tax) {
      throw new NotFoundException('Imposto de matéria-prima não encontrado');
    }

    return tax;
  }

  async createRawMaterialTax(dto: CreateRawMaterialTaxDto) {
    // Verificar se a matéria-prima existe
    const rawMaterial = await this.prisma.rawMaterial.findUnique({
      where: { id: dto.rawMaterialId },
    });

    if (!rawMaterial) {
      throw new BadRequestException('Matéria-prima não encontrada');
    }

    // Criar o imposto
    const tax = await this.prisma.rawMaterialTax.create({
      data: {
        name: dto.name,
        rate: new Prisma.Decimal(dto.rate),
        recoverable: dto.recoverable,
        rawMaterialId: dto.rawMaterialId,
      },
      include: {
        rawMaterial: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return tax;
  }

  async updateRawMaterialTax(id: string, dto: UpdateRawMaterialTaxDto) {
    // Verificar se existe
    await this.findOneRawMaterialTax(id);

    // Se está tentando mudar a matéria-prima, verificar se existe
    if (dto.rawMaterialId) {
      const rawMaterial = await this.prisma.rawMaterial.findUnique({
        where: { id: dto.rawMaterialId },
      });

      if (!rawMaterial) {
        throw new BadRequestException('Matéria-prima não encontrada');
      }
    }

    // Atualizar
    const updateData: Prisma.RawMaterialTaxUpdateInput = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name;
    }

    if (dto.rate !== undefined) {
      updateData.rate = new Prisma.Decimal(dto.rate);
    }

    if (dto.recoverable !== undefined) {
      updateData.recoverable = dto.recoverable;
    }

    if (dto.rawMaterialId !== undefined) {
      updateData.rawMaterial = { connect: { id: dto.rawMaterialId } };
    }

    const tax = await this.prisma.rawMaterialTax.update({
      where: { id },
      data: updateData,
      include: {
        rawMaterial: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return tax;
  }

  async removeRawMaterialTax(id: string) {
    // Verificar se existe
    await this.findOneRawMaterialTax(id);

    // Deletar
    await this.prisma.rawMaterialTax.delete({
      where: { id },
    });

    return { message: 'Imposto de matéria-prima excluído com sucesso' };
  }

  async exportRawMaterialTaxes(dto: ExportTaxesDto) {
    const limit = dto.limit || 500;
    const sortBy = dto.sortBy || 'name';
    const sortOrder = dto.sortOrder || 'asc';

    // Construir filtro
    const where: Prisma.RawMaterialTaxWhereInput = {};

    if (dto.filters?.search) {
      where.OR = [
        { name: { contains: dto.filters.search, mode: 'insensitive' } },
        {
          rawMaterial: {
            name: { contains: dto.filters.search, mode: 'insensitive' },
          },
        },
        {
          rawMaterial: {
            code: { contains: dto.filters.search, mode: 'insensitive' },
          },
        },
      ];
    }

    // Buscar dados
    const taxes = await this.prisma.rawMaterialTax.findMany({
      where,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        rawMaterial: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    // Gerar CSV
    const header = 'Nome,Taxa (%),Recuperável,Matéria-Prima,Código,Data de Criação';
    const rows = taxes.map((tax) => {
      const name = this.escapeCsv(tax.name);
      const rate = Number(tax.rate).toFixed(2);
      const recoverable = tax.recoverable ? 'Sim' : 'Não';
      const rawMaterialName = this.escapeCsv(tax.rawMaterial?.name || 'N/A');
      const code = this.escapeCsv(tax.rawMaterial?.code || '-');
      const createdAt = new Date(tax.createdAt).toLocaleDateString('pt-BR');

      return `${name},${rate},${recoverable},${rawMaterialName},${code},${createdAt}`;
    });

    return [header, ...rows].join('\n');
  }

  // ========================================
  // HELPERS
  // ========================================

  private escapeCsv(value: string): string {
    if (!value) return '';
    
    // Se contém vírgula, aspas ou quebra de linha, envolver em aspas
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      // Escapar aspas duplicando-as
      const escaped = value.replace(/"/g, '""');
      return `"${escaped}"`;
    }
    
    return value;
  }
}