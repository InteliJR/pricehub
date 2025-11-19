// src/product-groups/entities/product-group.entity.ts

export class ProductGroupEntity {
  id: string;
  name: string;
  description?: string;
  productsCount: number;
  volumePercentageByQuantity: number;
  volumePercentageByValue: number;
  averagePrice: number;
  totalValue: number;
  createdAt: Date;
  updatedAt: Date;
}