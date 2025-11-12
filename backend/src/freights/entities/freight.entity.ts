import { Currency } from '@prisma/client';

/**
 * Entity que representa um Frete no sistema.
 * Corresponde ao modelo Freight do Prisma schema.
 */
export class Freight {
  id: string;
  name: string;
  description?: string | null;
  paymentTerm: number;
  unitPrice: number;
  currency: Currency;
  additionalCosts: number;
  createdAt: Date;
  updatedAt: Date;

  // Relações (opcionais, aparecem quando usamos include no Prisma)
  // freightTaxes?: FreightTax[];
  // rawMaterials?: RawMaterial[];
}

/**
 * Entity que representa um Imposto de Frete no sistema.
 * Corresponde ao modelo FreightTax do Prisma schema.
 */
export class FreightTax {
  id: string;
  freightId: string;
  name: string;
  rate: number;
  createdAt: Date;
  updatedAt: Date;

  // Relação
  // freight?: Freight;
}