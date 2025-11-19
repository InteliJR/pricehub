// src/api/products.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

// ========================================
// Tipagens de Requisição e Resposta
// ========================================

export interface ProductApi {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  fixedCostId?: string | null;
  productGroupId?: string | null;
  priceWithoutTaxesAndFreight?: string | number | null;
  priceWithTaxesAndFreight?: string | number | null;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  fixedCost?: {
    id: string;
    description: string;
    code?: string;
    overheadPerUnit: string | number;
  } | null;
  productGroup?: {
    id: string;
    name: string;
    description?: string;
  } | null;
  productRawMaterials?: Array<{
    rawMaterialId: string;
    quantity: string | number;
    rawMaterial?: {
      id: string;
      code: string;
      name: string;
      measurementUnit: string;
      acquisitionPrice: number;
      priceConvertedBrl: number;
      currency: string;
    };
  }>;
}

export interface ProductsListResponse {
  data: ProductApi[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface RawMaterialInputPayload {
  rawMaterialId: string;
  quantity: number;
}

export interface CreateProductPayload {
  code: string;
  name: string;
  description?: string;
  fixedCostId?: string;
  productGroupId?: string;
  rawMaterials: RawMaterialInputPayload[];
}

export type UpdateProductPayload = Partial<CreateProductPayload>;

export interface ExportProductsPayload {
  format: 'csv';
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: {
    search?: string;
    productGroupId?: string;
  };
}

export interface FindAllProductsQuery {
  page?: number;
  limit?: number;
  search?: string;
  productGroupId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ========================================
// Funções de API
// ========================================

export function fetchProducts(params: FindAllProductsQuery) {
  return apiClient
    .get<ProductsListResponse>('/products', { params })
    .then((r) => r.data);
}

export function fetchProduct(
  id: string,
  params?: {
    includeFixedCost?: boolean;
    includeCalculations?: boolean;
    includeRawMaterials?: boolean;
  }
) {
  return apiClient
    .get<ProductApi>(`/products/${id}`, { params })
    .then((r) => r.data);
}

export function createProduct(payload: CreateProductPayload) {
  return apiClient.post<ProductApi>('/products', payload).then((r) => r.data);
}

export function updateProduct(id: string, payload: UpdateProductPayload) {
  return apiClient
    .patch<ProductApi>(`/products/${id}`, payload)
    .then((r) => r.data);
}

export function deleteProduct(id: string) {
  return apiClient
    .delete<{ message: string; id: string }>(`/products/${id}`)
    .then((r) => r.data);
}

export async function exportProducts(
  payload: ExportProductsPayload
): Promise<Blob> {
  const { data } = await apiClient.post('/products/export', payload, {
    responseType: 'blob',
  });
  return data;
}

// ========================================
// Hooks do React Query
// ========================================

export function useProductsQuery(params: FindAllProductsQuery) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => fetchProducts(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useProductQuery(id?: string | null) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () =>
      fetchProduct(id as string, {
        includeFixedCost: true,
        includeRawMaterials: true,
      }),
    enabled: !!id,
  });
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; payload: UpdateProductPayload }) =>
      updateProduct(args.id, args.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useExportProductsMutation() {
  return useMutation({
    mutationFn: exportProducts,
  });
}

// ========================================
// Helpers de Conversão (Opcional)
// ========================================

export function mapApiToUi(api: ProductApi) {
  const price =
    typeof api.priceWithTaxesAndFreight === 'number'
      ? api.priceWithTaxesAndFreight
      : typeof api.priceWithTaxesAndFreight === 'string'
      ? parseFloat(api.priceWithTaxesAndFreight)
      : typeof api.priceWithoutTaxesAndFreight === 'number'
      ? api.priceWithoutTaxesAndFreight
      : typeof api.priceWithoutTaxesAndFreight === 'string'
      ? parseFloat(api.priceWithoutTaxesAndFreight)
      : 0;

  const overhead =
    typeof api.fixedCost?.overheadPerUnit === 'number'
      ? api.fixedCost.overheadPerUnit
      : typeof api.fixedCost?.overheadPerUnit === 'string'
      ? parseFloat(api.fixedCost.overheadPerUnit)
      : 0;

  return {
    id: api.id,
    code: `#${api.code}`,
    description: api.name || api.description || '',
    group: api.productGroup?.name || '-',
    price,
    currency: 'Real' as const,
    overhead,
  };
}