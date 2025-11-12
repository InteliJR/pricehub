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
import { Currency } from '@prisma/client';

@Injectable()
export class FreightsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo registro de frete com impostos opcionais
   */
  async create(createFreightDto: CreateFreightDto) {
    try {
      const freight = await this.prisma.freight.create({
        data: {
          name: createFreightDto.name,
          description: createFreightDto.description,
          paymentTerm: createFreightDto.paymentTerm,
          unitPrice: createFreightDto.unitPrice,
          currency: createFreightDto.currency || Currency.BRL,
          additionalCosts: createFreightDto.additionalCosts || 0,
          // Cria os impostos junto (nested create)
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
          freightTaxes: true,
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
   * Retorna todos os fretes com paginação, filtros e ordenação
   */
  async findAll(query: QueryFreightDto) {
    try {
      // Valores padrão
      const page = query.page || 1;
      const limit = query.limit || 10;
      const sortBy = query.sortBy || 'createdAt';
      const sortOrder = query.sortOrder || 'desc';
      const { search, currency } = query;

      // Configurar filtros
      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (currency) {
        where.currency = currency;
      }

      // Calcular skip para paginação
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

      // Calcular total de páginas
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
          freightTaxes: true,
          rawMaterials: {
            select: {
              id: true,
              code: true,
              name: true,
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
   * Atualiza um frete existente (com suporte a criar/atualizar impostos)
   */
  async update(id: string, updateFreightDto: UpdateFreightDto) {
    try {
      // Verifica se existe
      await this.findOne(id);

      // Extrai freightTaxes para tratar separadamente
      const { freightTaxes, ...freightData } = updateFreightDto;

      // Inicia transação para garantir consistência
      const updatedFreight = await this.prisma.$transaction(async (prisma) => {
        // 1. Atualiza os dados do frete (SEM freightTaxes)
        const freight = await prisma.freight.update({
          where: { id },
          data: freightData,
        });

        // 2. Gerencia impostos (se fornecidos)
        if (freightTaxes && freightTaxes.length > 0) {
          // Separa impostos para atualizar e criar
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

        // 3. Retorna o frete atualizado com impostos
        return prisma.freight.findUnique({
          where: { id },
          include: {
            freightTaxes: true,
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
   * Remove um frete (verifica se não está em uso)
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

      // Delete cascade vai remover freightTaxes automaticamente
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

  // ============================================
  // MÉTODOS EXTRAS ÚTEIS
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
   * Busca fretes com prazo de pagamento específico
   */
  async findByPaymentTerm(days: number) {
    return this.prisma.freight.findMany({
      where: {
        paymentTerm: days,
      },
      include: {
        freightTaxes: true,
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
    const [total, byCurrency, avgPrice] = await Promise.all([
      this.prisma.freight.count(),
      this.prisma.freight.groupBy({
        by: ['currency'],
        _count: true,
      }),
      this.prisma.freight.aggregate({
        _avg: {
          unitPrice: true,
          additionalCosts: true,
        },
      }),
    ]);

    return {
      total,
      byCurrency,
      averagePrices: {
        unitPrice: avgPrice._avg.unitPrice,
        additionalCosts: avgPrice._avg.additionalCosts,
      },
    };
  }
}