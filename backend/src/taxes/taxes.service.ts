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
        // Busca se ALGUM frete associado tem esse nome
        {
          freights: {
            some: {
              name: { contains: query.search, mode: 'insensitive' },
            },
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
          freights: {
            // PLURAL
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
        freights: {
          // PLURAL
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
    // Opcional: Verificar se todos os fretes existem antes de criar
    // O Prisma lançaria erro se um ID não existisse, mas validar manualmente dá mensagens melhores.
    if (dto.freightIds && dto.freightIds.length > 0) {
      const count = await this.prisma.freight.count({
        where: { id: { in: dto.freightIds } },
      });
      if (count !== dto.freightIds.length) {
        throw new BadRequestException(
          'Um ou mais IDs de frete não foram encontrados',
        );
      }
    }

    // Criar o imposto
    const tax = await this.prisma.freightTax.create({
      data: {
        name: dto.name,
        rate: new Prisma.Decimal(dto.rate),
        freights: {
          // Conecta a lista de IDs
          connect: dto.freightIds.map((id) => ({ id })),
        },
      },
      include: {
        freights: {
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
    await this.findOneFreightTax(id);

    const updateData: Prisma.FreightTaxUpdateInput = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name;
    }

    if (dto.rate !== undefined) {
      updateData.rate = new Prisma.Decimal(dto.rate);
    }

    if (dto.freightIds !== undefined) {
      // 'set' substitui toda a lista atual pela nova lista
      updateData.freights = {
        set: dto.freightIds.map((fid) => ({ id: fid })),
      };
    }

    const tax = await this.prisma.freightTax.update({
      where: { id },
      data: updateData,
      include: {
        freights: {
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
    await this.findOneFreightTax(id);
    await this.prisma.freightTax.delete({ where: { id } });
    return { message: 'Imposto de frete excluído com sucesso' };
  }

  async exportFreightTaxes(dto: ExportTaxesDto) {
    const limit = dto.limit || 500;
    const sortBy = dto.sortBy || 'name';
    const sortOrder = dto.sortOrder || 'asc';

    const where: Prisma.FreightTaxWhereInput = {};

    if (dto.filters?.search) {
      where.OR = [
        { name: { contains: dto.filters.search, mode: 'insensitive' } },
        {
          freights: {
            some: {
              name: { contains: dto.filters.search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    const taxes = await this.prisma.freightTax.findMany({
      where,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        freights: {
          // PLURAL
          select: { name: true },
        },
      },
    });

    const header = 'Nome,Taxa (%),Fretes Associados,Data de Criação';
    const rows = taxes.map((tax) => {
      const name = this.escapeCsv(tax.name);
      const rate = Number(tax.rate).toFixed(2);

      // Juntar nomes dos fretes
      const freightNames = tax.freights.map((f) => f.name).join('; ');
      const freightNamesEscaped = this.escapeCsv(freightNames || 'N/A');

      const createdAt = new Date(tax.createdAt).toLocaleDateString('pt-BR');

      return `${name},${rate},${freightNamesEscaped},${createdAt}`;
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

    const where: Prisma.RawMaterialTaxWhereInput = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        // Busca em items relacionados
        {
          rawMaterials: {
            some: {
              OR: [
                { name: { contains: query.search, mode: 'insensitive' } },
                { code: { contains: query.search, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.rawMaterialTax.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          rawMaterials: {
            // PLURAL
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
        rawMaterials: {
          // PLURAL
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
    // Validar existência
    if (dto.rawMaterialIds && dto.rawMaterialIds.length > 0) {
      const count = await this.prisma.rawMaterial.count({
        where: { id: { in: dto.rawMaterialIds } },
      });
      if (count !== dto.rawMaterialIds.length) {
        throw new BadRequestException(
          'Uma ou mais matérias-primas não foram encontradas',
        );
      }
    }

    const tax = await this.prisma.rawMaterialTax.create({
      data: {
        name: dto.name,
        rate: new Prisma.Decimal(dto.rate),
        recoverable: dto.recoverable,
        rawMaterials: {
          connect: dto.rawMaterialIds.map((id) => ({ id })),
        },
      },
      include: {
        rawMaterials: {
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
    await this.findOneRawMaterialTax(id);

    const updateData: Prisma.RawMaterialTaxUpdateInput = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.rate !== undefined) updateData.rate = new Prisma.Decimal(dto.rate);
    if (dto.recoverable !== undefined) updateData.recoverable = dto.recoverable;

    if (dto.rawMaterialIds !== undefined) {
      updateData.rawMaterials = {
        set: dto.rawMaterialIds.map((rid) => ({ id: rid })),
      };
    }

    const tax = await this.prisma.rawMaterialTax.update({
      where: { id },
      data: updateData,
      include: {
        rawMaterials: {
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
    await this.findOneRawMaterialTax(id);
    await this.prisma.rawMaterialTax.delete({ where: { id } });
    return { message: 'Imposto de matéria-prima excluído com sucesso' };
  }

  async exportRawMaterialTaxes(dto: ExportTaxesDto) {
    const limit = dto.limit || 500;
    const sortBy = dto.sortBy || 'name';
    const sortOrder = dto.sortOrder || 'asc';

    const where: Prisma.RawMaterialTaxWhereInput = {};

    if (dto.filters?.search) {
      where.OR = [
        { name: { contains: dto.filters.search, mode: 'insensitive' } },
        {
          rawMaterials: {
            some: {
              OR: [
                { name: { contains: dto.filters.search, mode: 'insensitive' } },
                { code: { contains: dto.filters.search, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    const taxes = await this.prisma.rawMaterialTax.findMany({
      where,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        rawMaterials: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    const header =
      'Nome,Taxa (%),Recuperável,Matérias-Primas,Códigos,Data de Criação';
    const rows = taxes.map((tax) => {
      const name = this.escapeCsv(tax.name);
      const rate = Number(tax.rate).toFixed(2);
      const recoverable = tax.recoverable ? 'Sim' : 'Não';

      // Juntar listas
      const rawMaterialNames = tax.rawMaterials.map((r) => r.name).join('; ');
      const codes = tax.rawMaterials.map((r) => r.code).join('; ');

      const rmEscaped = this.escapeCsv(rawMaterialNames || 'N/A');
      const codesEscaped = this.escapeCsv(codes || '-');

      const createdAt = new Date(tax.createdAt).toLocaleDateString('pt-BR');

      return `${name},${rate},${recoverable},${rmEscaped},${codesEscaped},${createdAt}`;
    });

    return [header, ...rows].join('\n');
  }

  private escapeCsv(value: string): string {
    if (!value) return '';
    if (
      value.includes(',') ||
      value.includes('"') ||
      value.includes('\n') ||
      value.includes(';')
    ) {
      const escaped = value.replace(/"/g, '""');
      return `"${escaped}"`;
    }
    return value;
  }
}
