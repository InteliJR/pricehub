import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

// Backend Product shape (simplified from service includes)
export interface ProductApi {
  id: string;
  code: string; // numeric string
  name: string; // using description in UI
  description?: string | null;
  fixedCostId?: string | null;
  priceWithoutTaxesAndFreight?: string | null; // Decimal as string
  priceWithTaxesAndFreight?: string | null; // Decimal as string
  fixedCost?: {
    id: string;
    description: string;
    overheadPerUnit: string; // Decimal string
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsListResponse {
  data: ProductApi[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface RawMaterialInputPayload {
  rawMaterialId: string;
  quantity: number; // numeric quantity
}

export interface CreateProductPayload {
  code: string; // numeric string
  name: string; // product name (UI description field maps here)
  description?: string;
  fixedCostId?: string;
  rawMaterials: RawMaterialInputPayload[]; // minimal for now (empty permissible?)
}

export type UpdateProductPayload = Partial<CreateProductPayload>;

// Map API -> UI Product interface
// UI Product has: id, code, description, group, price, currency, overhead
export function mapApiToUi(api: ProductApi) {
  return {
    id: api.id,
    code: `#${api.code}`,
    description: api.name || api.description || '',
    group: 1, // no group in backend; placeholder
    price: parseFloat(api.priceWithTaxesAndFreight || api.priceWithoutTaxesAndFreight || '0'),
    currency: 'Real' as const, // prices aggregated in BRL
    overhead: api.fixedCost?.overheadPerUnit ? parseFloat(api.fixedCost.overheadPerUnit) : 0,
  };
}

export function fetchProducts(params: {
  page?: number;
  limit?: number;
  search?: string;
  includeFixedCost?: boolean;
  includeCalculations?: boolean;
}) {
  return apiClient
    .get<ProductsListResponse>('/products', { params })
    .then((r) => r.data);
}

export function fetchProduct(id: string, params?: {
  includeFixedCost?: boolean;
  includeCalculations?: boolean;
  includeRawMaterials?: boolean;
}) {
  return apiClient
    .get<ProductApi>(`/products/${id}`, { params })
    .then((r) => r.data);
}

export function createProduct(payload: CreateProductPayload) {
  return apiClient.post<ProductApi>('/products', payload).then((r) => r.data);
}

export function updateProduct(id: string, payload: UpdateProductPayload) {
  return apiClient.patch<ProductApi>(`/products/${id}`, payload).then((r) => r.data);
}

export function deleteProduct(id: string) {
  return apiClient.delete<{ message: string; id: string }>(`/products/${id}`).then((r) => r.data);
}

// Hooks
export function useProductsQuery(params: { page: number; limit: number; search?: string }) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => fetchProducts({ ...params }),
  });
}

export function useProductQuery(id?: string | null) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id as string, { includeFixedCost: true }),
    enabled: !!id,
  });
}

export function useCreateProductMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useUpdateProductMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; payload: UpdateProductPayload }) =>
      updateProduct(args.id, args.payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useDeleteProductMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}
