// Adicione estas interfaces ao arquivo src/types/index.ts existente

export interface ProductGroup {
  id: string;
  name: string;
  description?: string;
  productsCount: number;
  volumePercentageByQuantity: number;
  volumePercentageByValue: number;
  averagePrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductGroupDTO {
  name: string;
  description?: string;
}

export interface UpdateProductGroupDTO {
  name?: string;
  description?: string;
}