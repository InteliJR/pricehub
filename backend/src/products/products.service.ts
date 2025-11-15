import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CalculatePriceDto } from './dto/calculate-price.dto';
import { ExportProductsDto } from './dto/export-products.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto, userId: string) {
    try {
      // 1. Verificar se o código já existe
      const existingProduct = await this.prisma.product.findUnique({
        where: { code: createProductDto.code },
      });

      if (existingProduct) {
        throw new ConflictException('Já existe um produto com este código');
      }

      // 2. Verificar se todas as matérias-primas existem
      const rawMaterialIds = createProductDto.rawMaterials.map(
        (rm) => rm.rawMaterialId,
      );
      const rawMaterials = await this.prisma.rawMaterial.findMany({
        where: { id: { in: rawMaterialIds } },
      });

      if (rawMaterials.length !== rawMaterialIds.length) {
        throw new BadRequestException(
          'Uma ou mais matérias-primas não encontradas',
        );
      }

      // 3. Verificar se o fixedCost existe (se fornecido)
      if (createProductDto.fixedCostId) {
        const fixedCost = await this.prisma.fixedCost.findUnique({
          where: { id: createProductDto.fixedCostId },
        });

        if (!fixedCost) {
          throw new NotFoundException('Custo fixo não encontrado');
        }
      }

      // 4. Calcular preços automaticamente
      const calculations = await this.calculateProductPrice({
        rawMaterials: createProductDto.rawMaterials,
        fixedCostId: createProductDto.fixedCostId,
      });

      // 5. Criar produto com preços calculados
      const product = await this.prisma.product.create({
        data: {
          code: createProductDto.code,
          name: createProductDto.name,
          description: createProductDto.description,
          creatorId: userId,
          fixedCostId: createProductDto.fixedCostId,
          priceWithoutTaxesAndFreight:
            calculations.calculations.priceWithoutTaxesAndFreight,
          priceWithTaxesAndFreight:
            calculations.calculations.priceWithTaxesAndFreight,
          productRawMaterials: {
            create: createProductDto.rawMaterials.map((rm) => ({
              rawMaterialId: rm.rawMaterialId,
              quantity: rm.quantity,
            })),
          },
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          fixedCost: {
            select: {
              id: true,
              description: true,
              overheadPerUnit: true,
            },
          },
          productRawMaterials: {
            include: {
              rawMaterial: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  measurementUnit: true,
                  acquisitionPrice: true,
                  currency: true,
                },
              },
            },
          },
        },
      });

      return {
        ...product,
        calculations: calculations.calculations,
        breakdown: calculations.breakdown,
      };
    } catch (error: any) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      const message = error?.message || 'Erro desconhecido';
      throw new BadRequestException(`Erro ao criar produto: ${message}`);
    }
  }

  async findAll(query?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    includeRawMaterials?: boolean;
    includeFixedCost?: boolean;
    includeCalculations?: boolean;
  }) {
    try {
      const page = query?.page || 1;
      const limit = query?.limit || 10;
      const skip = (page - 1) * limit;
      const sortBy = query?.sortBy || 'code';
      const sortOrder = query?.sortOrder || 'asc';

      const where = query?.search
        ? {
            OR: [
              {
                code: { contains: query.search, mode: 'insensitive' as const },
              },
              {
                name: { contains: query.search, mode: 'insensitive' as const },
              },
            ],
          }
        : {};

      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            fixedCost: query?.includeFixedCost
              ? {
                  select: {
                    id: true,
                    description: true,
                    overheadPerUnit: true,
                  },
                }
              : false,
            productRawMaterials: query?.includeRawMaterials
              ? {
                  include: {
                    rawMaterial: {
                      select: {
                        id: true,
                        code: true,
                        name: true,
                        measurementUnit: true,
                        acquisitionPrice: true,
                      },
                    },
                  },
                }
              : false,
            _count: {
              select: {
                productRawMaterials: true,
              },
            },
          },
        }),
        this.prisma.product.count({ where }),
      ]);

      return {
        data: products,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      const message = error?.message || 'Erro desconhecido';
      throw new BadRequestException(`Erro ao buscar produtos: ${message}`);
    }
  }

  async findOne(
    id: string,
    query?: {
      includeRawMaterials?: boolean;
      includeFixedCost?: boolean;
      includeCalculations?: boolean;
      includeDetailedTaxes?: boolean;
    },
  ) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          fixedCost: query?.includeFixedCost
            ? {
                select: {
                  id: true,
                  description: true,
                  code: true,
                  personnelExpenses: true,
                  generalExpenses: true,
                  proLabore: true,
                  depreciation: true,
                  totalCost: true,
                  considerationPercentage: true,
                  salesVolume: true,
                  overheadPerUnit: true,
                },
              }
            : false,
          productRawMaterials: query?.includeRawMaterials
            ? {
                include: {
                  rawMaterial: query?.includeDetailedTaxes
                    ? {
                        include: {
                          tax: {
                            include: {
                              taxItems: true,
                            },
                          },
                          freight: {
                            include: {
                              freightTaxes: true,
                            },
                          },
                        },
                      }
                    : {
                        select: {
                          id: true,
                          code: true,
                          name: true,
                          measurementUnit: true,
                          acquisitionPrice: true,
                          currency: true,
                          priceConvertedBrl: true,
                          additionalCost: true,
                        },
                      },
                },
              }
            : false,
        },
      });

      if (!product) {
        throw new NotFoundException('Produto não encontrado');
      }

      // Recalcular preços se solicitado via query param
      if (query?.includeCalculations && product.productRawMaterials) {
        const calculations = await this.calculateProductPrice({
          rawMaterials: product.productRawMaterials.map((prm) => ({
            rawMaterialId: prm.rawMaterialId,
            quantity: Number(prm.quantity),
          })),
          fixedCostId: product.fixedCostId ? product.fixedCostId : undefined,
        });

        return {
          ...product,
          calculations: {
            rawMaterials: calculations.breakdown,
            summary: calculations.calculations,
          },
        };
      }

      return product;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const message = error?.message || 'Erro desconhecido';
      throw new BadRequestException(`Erro ao buscar produto: ${message}`);
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
        include: {
          productRawMaterials: true,
        },
      });

      if (!product) {
        throw new NotFoundException('Produto não encontrado');
      }

      // Verificar fixedCost se fornecido
      if (updateProductDto.fixedCostId !== undefined) {
        if (updateProductDto.fixedCostId) {
          const fixedCost = await this.prisma.fixedCost.findUnique({
            where: { id: updateProductDto.fixedCostId },
          });

          if (!fixedCost) {
            throw new NotFoundException('Custo fixo não encontrado');
          }
        }
      }

      // Verificar matérias-primas se fornecidas
      if (updateProductDto.rawMaterials) {
        const rawMaterialIds = updateProductDto.rawMaterials.map(
          (rm) => rm.rawMaterialId,
        );
        const rawMaterials = await this.prisma.rawMaterial.findMany({
          where: { id: { in: rawMaterialIds } },
        });

        if (rawMaterials.length !== rawMaterialIds.length) {
          throw new BadRequestException(
            'Uma ou mais matérias-primas não encontradas',
          );
        }
      }

      // Recalcular preços se matérias-primas ou custo fixo foram alterados
      let newPrices = {};
      if (
        updateProductDto.rawMaterials ||
        updateProductDto.fixedCostId !== undefined
      ) {
        const currentRawMaterials =
          updateProductDto.rawMaterials ||
          product.productRawMaterials.map((prm) => ({
            rawMaterialId: prm.rawMaterialId,
            quantity: Number(prm.quantity),
          }));

        const newFixedCostId =
          updateProductDto.fixedCostId !== undefined
            ? updateProductDto.fixedCostId
            : product.fixedCostId;

        const calculations = await this.calculateProductPrice({
          rawMaterials: currentRawMaterials,
          fixedCostId: newFixedCostId ? newFixedCostId : undefined,
        });

        newPrices = {
          priceWithoutTaxesAndFreight:
            calculations.calculations.priceWithoutTaxesAndFreight,
          priceWithTaxesAndFreight:
            calculations.calculations.priceWithTaxesAndFreight,
        };
      }

      // Atualizar produto
      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: {
          name: updateProductDto.name,
          description: updateProductDto.description,
          code: updateProductDto.code,
          fixedCostId: updateProductDto.fixedCostId,
          ...newPrices,
          ...(updateProductDto.rawMaterials && {
            productRawMaterials: {
              deleteMany: {},
              create: updateProductDto.rawMaterials.map((rm) => ({
                rawMaterialId: rm.rawMaterialId,
                quantity: rm.quantity,
              })),
            },
          }),
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          fixedCost: {
            select: {
              id: true,
              description: true,
              overheadPerUnit: true,
            },
          },
          productRawMaterials: {
            include: {
              rawMaterial: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  measurementUnit: true,
                },
              },
            },
          },
        },
      });

      return updatedProduct;
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      if (error?.code === 'P2002') {
        throw new ConflictException('Já existe um produto com este código');
      }
      const message = error?.message || 'Erro desconhecido';
      throw new BadRequestException(`Erro ao atualizar produto: ${message}`);
    }
  }

  async remove(id: string) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        throw new NotFoundException('Produto não encontrado');
      }

      await this.prisma.product.delete({
        where: { id },
      });

      return {
        message: `Produto "${product.name}" deletado com sucesso`,
        id,
      };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const message = error?.message || 'Erro desconhecido';
      throw new BadRequestException(`Erro ao remover produto: ${message}`);
    }
  }

  /**
   * ============================================
   * MOTOR DE CÁLCULO DE PREÇOS
   * ============================================
   *
   * Este método calcula o preço final do produto baseado em:
   * 1. Matérias-primas (quantidade × preço unitário)
   * 2. Impostos sobre matérias-primas (apenas não recuperáveis)
   * 3. Frete (com impostos sobre frete)
   * 4. Custos adicionais
   * 5. Overhead do custo fixo (se houver)
   *
   * PONTOS DE CUSTOMIZAÇÃO:
   * - Linha 560: Cálculo de impostos (filtro de recuperáveis)
   * - Linha 570: Cálculo de frete (fórmula simplificada)
   * - Linha 585: Custos adicionais (proporcional à quantidade)
   * - Linha 618: Aplicação de overhead
   */
  async calculateProductPrice(calculatePriceDto: CalculatePriceDto) {
    try {
      const { rawMaterials, fixedCostId } = calculatePriceDto;

      // Buscar dados completos das matérias-primas com impostos e fretes
      const rawMaterialsData = await this.prisma.rawMaterial.findMany({
        where: {
          id: { in: rawMaterials.map((rm) => rm.rawMaterialId) },
        },
        include: {
          tax: {
            include: {
              taxItems: true,
            },
          },
          freight: {
            include: {
              freightTaxes: true,
            },
          },
        },
      });

      if (rawMaterialsData.length !== rawMaterials.length) {
        throw new BadRequestException(
          'Uma ou mais matérias-primas não encontradas',
        );
      }

      // Buscar custo fixo se fornecido
      let fixedCost: any = null;
      if (fixedCostId) {
        fixedCost = await this.prisma.fixedCost.findUnique({
          where: { id: fixedCostId },
        });

        if (!fixedCost) {
          throw new NotFoundException('Custo fixo não encontrado');
        }
      }

      // Acumuladores para totalização
      const rawMaterialsBreakdown: any[] = [];
      let totalRawMaterials = 0;
      let totalTaxes = 0;
      let totalFreight = 0;
      let totalAdditionalCosts = 0;

      // Processar cada matéria-prima
      for (const rmInput of rawMaterials) {
        const rmData = rawMaterialsData.find(
          (rm) => rm.id === rmInput.rawMaterialId,
        );
        if (!rmData) continue;

        // ==========================================
        // 1. CÁLCULO DO SUBTOTAL DA MATÉRIA-PRIMA
        // ==========================================
        // Usa priceConvertedBrl (preço já em BRL) ou acquisitionPrice
        // Fórmula: quantidade × preço unitário
        const quantity = rmInput.quantity;
        const unitPrice = Number(
          rmData.priceConvertedBrl || rmData.acquisitionPrice,
        );
        const subtotal = unitPrice * quantity;

        // ==========================================
        // 2. CÁLCULO DE IMPOSTOS
        // ==========================================
        // Apenas impostos NÃO RECUPERÁVEIS são somados ao custo
        // Impostos recuperáveis (recoverable: true) não entram no cálculo
        // Fórmula: (subtotal × taxa) / 100
        const taxes: Record<string, number> = {};
        let taxesTotal = 0;

        if (rmData.tax?.taxItems) {
          for (const taxItem of rmData.tax.taxItems) {
            if (!taxItem.recoverable) {
              const taxValue = (subtotal * Number(taxItem.rate)) / 100;
              taxes[taxItem.name] = Number(taxValue.toFixed(2));
              taxesTotal += taxValue;
            }
          }
        }

        // ==========================================
        // 3. CÁLCULO DE FRETE
        // ==========================================
        // SIMPLIFICAÇÃO: preço unitário × quantidade
        // Na prática, pode ser: peso total, volume, distância, faixas, etc.
        const freightSubtotal =
          Number(rmData.freight?.unitPrice || 0) * quantity;

        // Impostos sobre o frete (ex: ICMS)
        const freightTaxes: Record<string, number> = {};
        let freightTaxesTotal = 0;

        if (rmData.freight?.freightTaxes) {
          for (const freightTax of rmData.freight.freightTaxes) {
            const taxValue = (freightSubtotal * Number(freightTax.rate)) / 100;
            freightTaxes[freightTax.name] = Number(taxValue.toFixed(2));
            freightTaxesTotal += taxValue;
          }
        }

        const freightTotal = freightSubtotal + freightTaxesTotal;

        // ==========================================
        // 4. CUSTOS ADICIONAIS
        // ==========================================
        // Custos extras proporcionais à quantidade
        // Exemplos: embalagem, manuseio, armazenagem
        const additionalCost = Number(rmData.additionalCost || 0) * quantity;

        // Acumular totais
        totalRawMaterials += subtotal;
        totalTaxes += taxesTotal;
        totalFreight += freightTotal;
        totalAdditionalCosts += additionalCost;

        // Adicionar ao breakdown (detalhamento por matéria-prima)
        rawMaterialsBreakdown.push({
          rawMaterialCode: rmData.code,
          rawMaterialName: rmData.name,
          quantity,
          unitPrice: Number(unitPrice.toFixed(2)),
          subtotal: Number(subtotal.toFixed(2)),
          taxes: {
            ...taxes,
            total: Number(taxesTotal.toFixed(2)),
          },
          freight: {
            unitPrice: Number(rmData.freight?.unitPrice || 0),
            quantity,
            subtotal: Number(freightSubtotal.toFixed(2)),
            taxes: freightTaxes,
          },
          totalWithoutTaxesAndFreight: Number(subtotal.toFixed(2)),
          totalWithTaxesAndFreight: Number(
            (subtotal + taxesTotal + freightTotal).toFixed(2),
          ),
        });
      }

      // ==========================================
      // 5. TOTALIZAÇÃO FINAL
      // ==========================================

      // Preço sem impostos e frete (apenas matérias-primas + custos adicionais)
      const priceWithoutTaxesAndFreight =
        totalRawMaterials + totalAdditionalCosts;

      // Preço com impostos e frete incluídos
      const priceWithTaxesAndFreight =
        priceWithoutTaxesAndFreight + totalTaxes + totalFreight;

      // ==========================================
      // 6. OVERHEAD (CUSTO FIXO)
      // ==========================================
      // Overhead por unidade já calculado no Fixed Cost
      // Pode ser customizado para: proporcional ao preço, progressivo, etc.
      const fixedCostOverhead = fixedCost
        ? Number(fixedCost.overheadPerUnit)
        : 0;

      // Preço final incluindo overhead
      const finalPriceWithOverhead =
        priceWithTaxesAndFreight + fixedCostOverhead;

      return {
        calculations: {
          rawMaterialsSubtotal: Number(totalRawMaterials.toFixed(2)),
          taxesTotal: Number(totalTaxes.toFixed(2)),
          freightTotal: Number(totalFreight.toFixed(2)),
          additionalCostsTotal: Number(totalAdditionalCosts.toFixed(2)),
          priceWithoutTaxesAndFreight: Number(
            priceWithoutTaxesAndFreight.toFixed(2),
          ),
          priceWithTaxesAndFreight: Number(priceWithTaxesAndFreight.toFixed(2)),
          fixedCostOverhead: Number(fixedCostOverhead.toFixed(2)),
          finalPriceWithOverhead: Number(finalPriceWithOverhead.toFixed(2)),
        },
        breakdown: rawMaterialsBreakdown,
      };
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      const message = error?.message || 'Erro desconhecido';
      throw new BadRequestException(`Erro ao calcular preço: ${message}`);
    }
  }

  async exportProducts(exportDto: ExportProductsDto) {
    try {
      const sortBy = exportDto.sortBy || 'code';
      const sortOrder = exportDto.sortOrder || 'asc';

      const products = await this.prisma.product.findMany({
        take: exportDto.limit,
        orderBy: { [sortBy]: sortOrder },
        where: exportDto.filters?.search
          ? {
              OR: [
                {
                  code: {
                    contains: exportDto.filters.search,
                    mode: 'insensitive',
                  },
                },
                {
                  name: {
                    contains: exportDto.filters.search,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : undefined,
        include: {
          creator: {
            select: {
              name: true,
            },
          },
          fixedCost: {
            select: {
              description: true,
            },
          },
          productRawMaterials: exportDto.includeRawMaterials
            ? {
                include: {
                  rawMaterial: {
                    select: {
                      name: true,
                      measurementUnit: true,
                    },
                  },
                },
              }
            : false,
        },
      });

      const headers = [
        'Código',
        'Nome',
        'Descrição',
        'Preço sem Impostos',
        'Preço com Impostos',
        'Criador',
        'Custo Fixo',
        'Matérias-Primas',
        'Data Criação',
      ];

      const rows = products.map((product) => {
        const rawMaterialsStr =
          exportDto.includeRawMaterials && product.productRawMaterials
            ? product.productRawMaterials
                .map(
                  (prm: any) =>
                    `${prm.rawMaterial.name} (${prm.quantity} ${prm.rawMaterial.measurementUnit})`,
                )
                .join('; ')
            : '';

        return [
          product.code,
          product.name,
          product.description || '',
          product.priceWithoutTaxesAndFreight?.toFixed(2) || '0.00',
          product.priceWithTaxesAndFreight?.toFixed(2) || '0.00',
          product.creator?.name || '',
          product.fixedCost?.description || '',
          rawMaterialsStr,
          new Date(product.createdAt).toISOString().split('T')[0],
        ];
      });

      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(','))
        .join('\n');

      return csv;
    } catch (error: any) {
      const message = error?.message || 'Erro desconhecido';
      throw new BadRequestException(`Erro ao exportar produtos: ${message}`);
    }
  }
}
