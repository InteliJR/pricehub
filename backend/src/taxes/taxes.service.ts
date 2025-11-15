import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

interface FindAllParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc' | string;
}

@Injectable()
export class TaxesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTaxDto: CreateTaxDto) {
    const data: Prisma.TaxCreateInput = {
      name: createTaxDto.name,
      description: createTaxDto.description ?? undefined,
      taxItems: {
        create: (createTaxDto.items || []).map((it) => ({
          name: it.name,
          rate: new Prisma.Decimal(it.rate ?? 0),
          recoverable: !!it.recoverable,
        })),
      },
    };

    const tax = await this.prisma.tax.create({
      data,
      include: { taxItems: true },
    });

    return tax;
  }

  async findAll(params: FindAllParams = {}) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const sortBy = params.sortBy || 'name';
    const sortOrder = params.sortOrder === 'desc' ? 'desc' : 'asc';

    const [total, data] = await this.prisma.$transaction([
      this.prisma.tax.count({ where }),
      this.prisma.tax.findMany({
        where,
        include: { taxItems: true },
        orderBy: { [sortBy]: sortOrder as Prisma.SortOrder },
        skip,
        take: limit,
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findOne(id: string) {
    const tax = await this.prisma.tax.findUnique({
      where: { id },
      include: { taxItems: true },
    });
    if (!tax) throw new NotFoundException('Imposto não encontrado');
    return tax;
  }

  async update(id: string, updateTaxDto: UpdateTaxDto) {
    const tax = await this.prisma.tax.findUnique({ where: { id }, include: { taxItems: true } });
    if (!tax) throw new NotFoundException('Imposto não encontrado');

    // Determine item operations
    const incoming = updateTaxDto.items ?? [];
    const existingItems = tax.taxItems ?? [];

    const incomingIds = incoming.filter((i) => !!(i as any).id).map((i) => (i as any).id);

    const toDeleteIds = existingItems.filter((e) => !incomingIds.includes(e.id)).map((e) => e.id);

    // Validate provided IDs belong to this tax
    for (const item of incoming.filter((i) => !!(i as any).id)) {
      const found = existingItems.find((e) => e.id === (item as any).id);
      if (!found) throw new NotFoundException(`Tax item ${ (item as any).id } not found for tax ${id}`);
    }

    const ops: Prisma.PrismaPromise<any>[] = [];

    // Update tax fields
    ops.push(
      this.prisma.tax.update({ where: { id }, data: { name: updateTaxDto.name ?? undefined, description: updateTaxDto.description ?? undefined } }),
    );

    // Deletes
    if (toDeleteIds.length > 0) {
      ops.push(this.prisma.taxItem.deleteMany({ where: { id: { in: toDeleteIds } } }));
    }

    // Updates
    for (const item of incoming.filter((i) => !!(i as any).id)) {
      const it = item as any;
      ops.push(
        this.prisma.taxItem.update({ where: { id: it.id }, data: { name: it.name, rate: new Prisma.Decimal(it.rate ?? 0), recoverable: !!it.recoverable } }),
      );
    }

    // Creates
    for (const item of incoming.filter((i) => !(i as any).id)) {
      const it = item as any;
      ops.push(
        this.prisma.taxItem.create({ data: { taxId: id, name: it.name, rate: new Prisma.Decimal(it.rate ?? 0), recoverable: !!it.recoverable } }),
      );
    }

    await this.prisma.$transaction(ops);

    return this.findOne(id);
  }

  async remove(id: string) {
    // Check association with raw materials
    const count = await this.prisma.rawMaterial.count({ where: { taxId: id } });
    if (count > 0) throw new ConflictException('Imposto está associado a matérias-primas');

    await this.prisma.tax.delete({ where: { id } });
    return { message: 'Imposto deletado com sucesso' };
  }

  async export(payload: any) {
    // Build filters
    const where: any = {};
    if (payload?.filters?.search) {
      where.OR = [
        { name: { contains: payload.filters.search, mode: 'insensitive' } },
        { description: { contains: payload.filters.search, mode: 'insensitive' } },
      ];
    }

    const sortBy = payload?.sortBy || 'name';
    const sortOrder = payload?.sortOrder === 'desc' ? 'desc' : 'asc';
    const limit = payload?.limit ?? 100;

    const rows = await this.prisma.tax.findMany({ where, include: { taxItems: true }, orderBy: { [sortBy]: sortOrder as Prisma.SortOrder }, take: limit });

    // Build CSV
    const header = 'ID,Nome,Descrição,Itens,Data de Criação';
    const lines = rows.map((r) => {
      const items = (r.taxItems || []).map((it) => `${it.name} (${Number(it.rate).toFixed(2)}%)`).join(', ');
      const desc = r.description ? r.description.replace(/\n/g, ' ').replace(/,/g, ' ') : '';
      return `${r.id},${r.name},${desc},"${items}",${r.createdAt.toISOString().split('T')[0]}`;
    });

    return [header, ...lines].join('\n');
  }
}
