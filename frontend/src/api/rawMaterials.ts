import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type { RawMaterial } from '@/types';

// Backend model fields
export interface RawMaterialApi {
	id: string;
	code: string;
	name: string;
	description?: string;
	measurementUnit: string;
	inputGroup?: string;
	paymentTerm: number;
	acquisitionPrice: string; // Prisma Decimal returns string via JSON
	currency: string; // BRL, USD
	priceConvertedBrl: string;
	additionalCost: string;
	taxId: string;
	freightId: string;
	createdAt: string;
	updatedAt: string;
}

export interface RawMaterialsListResponse {
	data: RawMaterialApi[];
	meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface CreateRawMaterialPayload {
	code: string;
	name: string;
	description?: string;
	measurementUnit: string;
	inputGroup?: string;
	paymentTerm: number;
	acquisitionPrice: number;
	currency: 'BRL' | 'USD' | 'EUR';
	priceConvertedBrl: number;
	additionalCost: number;
	taxId: string;
	freightId: string;
}

export type UpdateRawMaterialPayload = Partial<CreateRawMaterialPayload>;

// Map API -> UI type
export const mapApiToUi = (api: RawMaterialApi): RawMaterial => ({
	id: api.id,
	code: api.code,
	name: api.name,
	description: api.description || '',
	// UI has deadline (string) not present; derive from paymentTerm days after createdAt
	deadline: new Date(
		new Date(api.createdAt).getTime() + api.paymentTerm * 24 * 60 * 60 * 1000,
	)
		.toISOString()
		.split('T')[0],
	price: parseFloat(api.acquisitionPrice),
	currency: api.currency === 'BRL' ? 'Real' : 'Dólar',
	additionalCosts: parseFloat(api.additionalCost),
});

// Usa apiClient compartilhado (inclui interceptors para auth e refresh)

export function fetchRawMaterials(params: {
	page?: number;
	limit?: number;
	search?: string;
	includeTax?: boolean;
	includeFreight?: boolean;
}) {
	return apiClient
		.get<RawMaterialsListResponse>('/raw-materials', { params })
		.then((r) => r.data);
}

export function createRawMaterial(payload: CreateRawMaterialPayload) {
	return apiClient
		.post<RawMaterialApi>('/raw-materials', payload)
		.then((r) => r.data);
}

export function updateRawMaterial(id: string, payload: UpdateRawMaterialPayload) {
	return apiClient
		.patch<RawMaterialApi>(`/raw-materials/${id}`, payload)
		.then((r) => r.data);
}

export function deleteRawMaterial(id: string) {
	return apiClient.delete<{ message: string }>(`/raw-materials/${id}`).then((r) => r.data);
}

export function fetchRawMaterialById(id: string) {
	return apiClient.get<RawMaterialApi>(`/raw-materials/${id}`).then((r) => r.data);
}

export function useRawMaterialsQuery(params: { page: number; limit: number; search?: string }) {
	return useQuery({
		queryKey: ['raw-materials', params],
		queryFn: () => fetchRawMaterials(params),
	});
}

export function useCreateRawMaterialMutation() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: createRawMaterial,
		onSuccess: () => qc.invalidateQueries({ queryKey: ['raw-materials'] }),
	});
}

export function useUpdateRawMaterialMutation() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (args: { id: string; payload: UpdateRawMaterialPayload }) =>
			updateRawMaterial(args.id, args.payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['raw-materials'] }),
	});
}

export function useDeleteRawMaterialMutation() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteRawMaterial(id),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['raw-materials'] }),
	});
}

export function useRawMaterialQuery(id?: string | null) {
	return useQuery({
		queryKey: ['raw-material', id],
		queryFn: () => fetchRawMaterialById(id as string),
		enabled: !!id,
	});
}

