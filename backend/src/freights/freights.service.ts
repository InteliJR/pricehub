// src/freights/freights.service.ts

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
import { Currency, FreightOperationType } from '@prisma/client';

@Injectable()
export class FreightsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo frete com impostos opcionais
   */
  async create(createFreightDto: CreateFreightDto) {
    try {
      const freight = await this.prisma.freight.create({
        data: {
          name: createFreightDto.name,
          description: createFreightDto.description,
          unitPrice: createFreightDto.unitPrice,
          currency: createFreightDto.currency,
          originUf: createFreightDto.originUf.toUpperCase(),
          originCity: createFreightDto.originCity,
          destinationUf: createFreightDto.destinationUf.toUpperCase(),
          destinationCity: createFreightDto.destinationCity,
          cargoType: createFreightDto.cargoType,
          operationType: createFreightDto.operationType,
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
          freightTaxes: {
            select: {
              id: true,
              name: true,
              rate: true,
              createdAt: true,
              updatedAt: true,
            },
          },
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
   * Lista fretes com paginação, filtros e ordenação
   */
  async findAll(query: QueryFreightDto) {
    try {
      const page = query.page || 1;
      const limit = query.limit || 10;
      const sortBy = query.sortBy || 'createdAt';
      const sortOrder = query.sortOrder || 'desc';
      const { search, currency, operationType, originUf, destinationUf } = query;

      // Configurar filtros
      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { originCity: { contains: search, mode: 'insensitive' } },
          { destinationCity: { contains: search, mode: 'insensitive' } },
          { cargoType: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (currency) {
        where.currency = currency;
      }

      if (operationType) {
        where.operationType = operationType;
      }

      if (originUf) {
        where.originUf = {
          contains: originUf.toUpperCase(),
          mode: 'insensitive',
        };
      }

      if (destinationUf) {
        where.destinationUf = {
          contains: destinationUf.toUpperCase(),
          mode: 'insensitive',
        };
      }

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
          freightTaxes: {
            select: {
              id: true,
              name: true,
              rate: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          rawMaterials: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          _count: {
            select: {
              rawMaterials: true,
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
   * Atualiza um frete existente
   */
  async update(id: string, updateFreightDto: UpdateFreightDto) {
    try {
      // Verifica se existe
      await this.findOne(id);

      const { freightTaxes, ...freightData } = updateFreightDto;

      // Normaliza UFs para maiúsculas se fornecidos
      if (freightData.originUf) {
        freightData.originUf = freightData.originUf.toUpperCase();
      }
      if (freightData.destinationUf) {
        freightData.destinationUf = freightData.destinationUf.toUpperCase();
      }

      // Transação para garantir consistência
      const updatedFreight = await this.prisma.$transaction(async (prisma) => {
        // 1. Atualiza dados do frete
        await prisma.freight.update({
          where: { id },
          data: freightData,
        });

        // 2. Gerencia impostos (se fornecidos)
        if (freightTaxes && freightTaxes.length > 0) {
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

        // 3. Retorna o frete atualizado
        return prisma.freight.findUnique({
          where: { id },
          include: {
            freightTaxes: {
              select: {
                id: true,
                name: true,
                rate: true,
                createdAt: true,
                updatedAt: true,
              },
            },
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
   * Remove um frete (verifica dependências)
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

      // Delete cascade remove freightTaxes automaticamente
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
          { originCity: { contains: filters.search, mode: 'insensitive' } },
          { destinationCity: { contains: filters.search, mode: 'insensitive' } },
          { cargoType: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      if (filters?.currency) {
        where.currency = filters.currency;
      }

      if (filters?.operationType) {
        where.operationType = filters.operationType;
      }

      if (filters?.originUf) {
        where.originUf = {
          contains: filters.originUf.toUpperCase(),
          mode: 'insensitive',
        };
      }

      if (filters?.destinationUf) {
        where.destinationUf = {
          contains: filters.destinationUf.toUpperCase(),
          mode: 'insensitive',
        };
      }

      // Buscar dados
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

      // Montar CSV
      const headers = [
        'ID',
        'Nome',
        'Descrição',
        'Preço Unitário',
        'Moeda',
        'UF Origem',
        'Cidade Origem',
        'UF Destino',
        'Cidade Destino',
        'Tipo de Carga',
        'Tipo de Operação',
        'Impostos',
      ];

      const csvLines = [headers.join(',')];

      // Função para escapar campos CSV
      const escapeCsvField = (field: any): string => {
        if (field === null || field === undefined) return '';
        const str = String(field);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      // Adicionar linhas de dados
      for (const freight of freights) {
        const taxesStr = freight.freightTaxes
          .map((tax) => `${tax.name} (${tax.rate}%)`)
          .join('; ');

        const row = [
          escapeCsvField(freight.id),
          escapeCsvField(freight.name),
          escapeCsvField(freight.description || ''),
          escapeCsvField(freight.unitPrice.toFixed(2)),
          escapeCsvField(freight.currency),
          escapeCsvField(freight.originUf),
          escapeCsvField(freight.originCity),
          escapeCsvField(freight.destinationUf),
          escapeCsvField(freight.destinationCity),
          escapeCsvField(freight.cargoType),
          escapeCsvField(freight.operationType),
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

  // ============================================
  // MÉTODOS AUXILIARES
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
   * Busca fretes por tipo de operação
   */
  async findByOperationType(operationType: FreightOperationType) {
    return this.prisma.freight.findMany({
      where: { operationType },
      include: {
        freightTaxes: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Busca fretes por rota (UF origem e destino)
   */
  async findByRoute(originUf: string, destinationUf: string) {
    return this.prisma.freight.findMany({
      where: {
        originUf: originUf.toUpperCase(),
        destinationUf: destinationUf.toUpperCase(),
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
    const [total, byCurrency, byOperationType, avgPrice] = await Promise.all([
      this.prisma.freight.count(),
      this.prisma.freight.groupBy({
        by: ['currency'],
        _count: true,
      }),
      this.prisma.freight.groupBy({
        by: ['operationType'],
        _count: true,
      }),
      this.prisma.freight.aggregate({
        _avg: {
          unitPrice: true,
        },
        _min: {
          unitPrice: true,
        },
        _max: {
          unitPrice: true,
        },
      }),
    ]);

    return {
      total,
      byCurrency,
      byOperationType,
      prices: {
        average: avgPrice._avg.unitPrice,
        min: avgPrice._min.unitPrice,
        max: avgPrice._max.unitPrice,
      },
    };
  }

  /**
   * Deleta um imposto específico de um frete
   */
  async deleteFreightTax(freightId: string, taxId: string) {
    try {
      // Verifica se o frete existe
      await this.findOne(freightId);

      // Verifica se o imposto pertence ao frete
      const tax = await this.prisma.freightTax.findFirst({
        where: {
          id: taxId,
          freightId: freightId,
        },
      });

      if (!tax) {
        throw new NotFoundException(
          'Imposto não encontrado ou não pertence a este frete',
        );
      }

      await this.prisma.freightTax.delete({
        where: { id: taxId },
      });

      return {
        message: 'Imposto removido com sucesso',
        taxId,
      };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const message = error?.message || 'Erro desconhecido';
      throw new BadRequestException(`Erro ao remover imposto: ${message}`);
    }
  }
}