// src/components/features/rawMaterials/RawMaterialModal.tsx

import React from 'react';
import type { RawMaterial } from '@/types';

// 1. Importa o "esqueleto" genérico
import { Modal } from '@/components/common/Modal'; 
// 2. Importa o novo formulário
import { RawMaterialForm } from './RawMaterialForm';
// 3. Importa o botão
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { useTaxesQuery } from '@/api/taxes';
import { useFreightsQuery } from '@/api/freights';
import { useRawMaterialQuery } from '@/api/rawMaterials';

interface RawMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  material?: RawMaterial;
  onSubmit: (formData: FormData) => Promise<void> | void;
  submitting?: boolean;
}

export function RawMaterialModal({
  isOpen,
  onClose,
  mode,
  material,
  onSubmit,
  submitting = false,
}: RawMaterialModalProps) {
  const { data: taxesData } = useTaxesQuery({ page: 1, limit: 100 });
  const { data: freightsData } = useFreightsQuery({ page: 1, limit: 100 });
  const { data: materialApi, isLoading: isLoadingMaterial } = useRawMaterialQuery(
    mode === 'edit' ? material?.id ?? null : null,
  );
  const taxes = taxesData?.data ?? [];
  const freights = freightsData?.data ?? [];
  
  const title = mode === 'create' ? 'Adicionar Matéria-prima' : 'Editar Matéria-prima';
  const buttonText = mode === 'create' ? 'Adicionar' : 'Salvar alterações';

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit(formData);
  };

  const modalFooter = (
    <SecondaryButton
      variant="primary"
      type="submit"
      form="raw-material-form"
      disabled={submitting || (mode === 'edit' && isLoadingMaterial)}
    >
      {submitting ? 'Salvando...' : buttonText}
    </SecondaryButton>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={modalFooter}>
      <form id="raw-material-form" onSubmit={handleSubmit} className="space-y-4">
        {mode === 'edit' && isLoadingMaterial ? (
          <div className="p-2 text-sm text-gray-600">Carregando dados...</div>
        ) : (
          <RawMaterialForm
            material={material}
            taxes={taxes}
            freights={freights}
            defaults={
              materialApi
                ? {
                    measurementUnit: materialApi.measurementUnit,
                    inputGroup: materialApi.inputGroup,
                    paymentTerm: materialApi.paymentTerm,
                    price: parseFloat(materialApi.acquisitionPrice),
                    currency: (materialApi.currency as 'BRL' | 'USD' | 'EUR'),
                    additionalCosts: parseFloat(materialApi.additionalCost),
                    taxId: materialApi.taxId,
                    freightId: materialApi.freightId,
                  }
                : undefined
            }
          />
        )}
      </form>
    </Modal>
  );
}