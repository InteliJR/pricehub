import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';

export interface TaxApi {
	id: string;
	name: string;
}

export interface TaxesListResponse {
	data: TaxApi[];
	meta?: any;
}

export async function fetchTaxes(params?: { page?: number; limit?: number; search?: string }) {
	const res = await apiClient.get('/taxes', { params });
	// suporta tanto {data:[]} quanto array direto
	return Array.isArray(res.data) ? { data: res.data as TaxApi[] } : (res.data as TaxesListResponse);
}

export function useTaxesQuery(params?: { page?: number; limit?: number; search?: string }) {
	return useQuery({ queryKey: ['taxes', params], queryFn: () => fetchTaxes(params) });
}

