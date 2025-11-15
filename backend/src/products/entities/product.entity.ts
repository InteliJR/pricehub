export class Product {
  id: string;
  code: string;
  name: string;
  description: string | null;
  creatorId: string;
  fixedCostId: string | null;
  priceWithoutTaxesAndFreight: number;
  priceWithTaxesAndFreight: number;
  createdAt: Date;
  updatedAt: Date;

  // Relações
  creator?: {
    id: string;
    name: string;
    email: string;
    role?: string;
  };

  fixedCost?: {
    id: string;
    description: string;
    code: string;
    personnelExpenses?: number;
    generalExpenses?: number;
    proLabore?: number;
    depreciation?: number;
    totalCost?: number;
    considerationPercentage?: number;
    salesVolume?: number;
    overheadPerUnit: number;
  };

  productRawMaterials?: Array<{
    productId: string;
    rawMaterialId: string;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
    rawMaterial: {
      id: string;
      code: string;
      name: string;
      measurementUnit: string;
      acquisitionPrice: number;
      currency: string;
      priceConvertedBrl?: number;
      additionalCost?: number;
      tax?: any;
      freight?: any;
    };
  }>;

  calculations?: {
    rawMaterials?: Array<{
      rawMaterialCode: string;
      rawMaterialName: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
      taxes: Record<string, number>;
      freight: {
        unitPrice: number;
        quantity: number;
        subtotal: number;
        taxes: Record<string, number>;
      };
      totalWithoutTaxesAndFreight: number;
      totalWithTaxesAndFreight: number;
    }>;
    summary?: {
      rawMaterialsSubtotal: number;
      taxesTotal: number;
      freightTotal: number;
      additionalCostsTotal: number;
      priceWithoutTaxesAndFreight: number;
      priceWithTaxesAndFreight: number;
      fixedCostOverhead: number;
      finalPriceWithOverhead: number;
    };
  };
}
