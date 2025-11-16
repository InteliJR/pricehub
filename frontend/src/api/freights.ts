import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';

export interface FreightApi {
	id: string;
	name: string;
}

export interface FreightsListResponse {
	data: FreightApi[];
	meta?: any;
}

export async function fetchFreights(params?: { page?: number; limit?: number; search?: string }) {
	const res = await apiClient.get('/freights', { params });
	return Array.isArray(res.data)
		? ({ data: res.data as FreightApi[] } as FreightsListResponse)
		: (res.data as FreightsListResponse);
}

export function useFreightsQuery(params?: { page?: number; limit?: number; search?: string }) {
	return useQuery({ queryKey: ['freights', params], queryFn: () => fetchFreights(params) });
}

