import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';

export interface FixedCostApi {
  id: string;
  description: string;
  code?: string | null;
  personnelExpenses: string; // Decimal
  generalExpenses: string;
  proLabore: string;
  depreciation: string;
  totalCost: string;
  considerationPercentage: string;
  salesVolume: string;
  overheadPerUnit: string;
  calculationDate: string;
  createdAt: string;
  updatedAt: string;
  _count?: { products: number };
}

export interface FixedCostsListResponse {
  data: FixedCostApi[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export function fetchFixedCosts(params: { page?: number; limit?: number; search?: string }) {
  return apiClient.get<FixedCostsListResponse>('/fixed-costs', { params }).then(r => r.data);
}

export function useFixedCostsQuery(params: { page: number; limit: number; search?: string }) {
  return useQuery({
    queryKey: ['fixed-costs', params],
    queryFn: () => fetchFixedCosts(params),
  });
}
