import { useState } from 'react';
import type { RawMaterial } from '@/types';
import {
  useRawMaterialsQuery,
  useCreateRawMaterialMutation,
  useUpdateRawMaterialMutation,
  useDeleteRawMaterialMutation,
  mapApiToUi,
} from '@/api/rawMaterials';
import type {
  CreateRawMaterialPayload,
  UpdateRawMaterialPayload,
} from '@/api/rawMaterials';
import { toast } from 'react-hot-toast';

import { PageHeader } from '@/components/features/rawMaterials/PageHeader';
import { ActionBar } from '@/components/features/rawMaterials/ActionBar';
import { RawMaterialTable } from '@/components/features/rawMaterials/RawMaterialTable';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { RawMaterialModal } from '@/components/features/rawMaterials/RawMaterialModal';

export default function RawMaterials() {
  const [page] = useState(1);
  const [limit] = useState(10);
  const { data, isLoading, isError } = useRawMaterialsQuery({ page, limit });
  const createMutation = useCreateRawMaterialMutation();
  const [updateId, setUpdateId] = useState<string | null>(null);
  const deleteMutation = useDeleteRawMaterialMutation();
  const updateMutation = useUpdateRawMaterialMutation();

  // Evita erro quando data ainda undefined durante loading
  const materials: RawMaterial[] = (data?.data ?? []).map(mapApiToUi);
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleOpenDeleteModal = (material: RawMaterial) => {
    setSelectedMaterial(material);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedMaterial(undefined);
  };

  const handleConfirmDelete = async () => {
    if (!selectedMaterial) return;
    try {
      await deleteMutation.mutateAsync(selectedMaterial.id);
      toast.success('Matéria-prima deletada');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erro ao deletar');
    }
    handleCloseDeleteModal();
  };
  
  const handleOpenCreateModal = () => {
    setSelectedMaterial(undefined);
    setModalMode('create');
    setIsModalOpen(true);
  };
  
  const handleOpenEditModal = (material: RawMaterial) => {
    setSelectedMaterial(material);
    setUpdateId(material.id);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMaterial(undefined);
    setUpdateId(null);
  };

  const handleSubmit = async (formData: FormData) => {
    // Extrai campos do formulário
    const payloadBase: CreateRawMaterialPayload = {
      code: String(formData.get('raw_code') || '').trim(),
      name: String(formData.get('raw_name') || '').trim(),
      description: String(formData.get('raw_description') || '').trim(),
      measurementUnit: String(formData.get('raw_measurementUnit') || 'KG'),
      inputGroup: String(formData.get('raw_inputGroup') || '').trim() || undefined,
      paymentTerm: Number(formData.get('raw_paymentTerm') || 30),
      acquisitionPrice: parseFloat(String(formData.get('raw_price') || '0')),
      currency: (String(formData.get('raw_currency') || 'BRL') as 'BRL' | 'USD' | 'EUR'),
      priceConvertedBrl: parseFloat(String(formData.get('raw_price') || '0')),
      additionalCost: parseFloat(String(formData.get('raw_additionalCosts') || '0')),
      taxId: String(formData.get('raw_taxId') || ''),
      freightId: String(formData.get('raw_freightId') || ''),
    };

    try {
      // Validações básicas no cliente
      if (!payloadBase.code || !payloadBase.name) {
        toast.error('Código e Nome são obrigatórios');
        return;
      }
      if (!payloadBase.taxId || !payloadBase.freightId) {
        toast.error('Selecione Imposto e Frete');
        return;
      }
      if (Number.isNaN(payloadBase.acquisitionPrice) || payloadBase.acquisitionPrice < 0) {
        toast.error('Preço inválido');
        return;
      }
      if (Number.isNaN(payloadBase.additionalCost) || payloadBase.additionalCost < 0) {
        toast.error('Custos adicionais inválidos');
        return;
      }
      if (Number.isNaN(payloadBase.paymentTerm) || payloadBase.paymentTerm < 0) {
        toast.error('Prazo de pagamento inválido');
        return;
      }

      if (modalMode === 'create') {
        await createMutation.mutateAsync(payloadBase);
        toast.success('Matéria-prima criada');
      } else if (modalMode === 'edit' && updateId) {
        const updatePayload: UpdateRawMaterialPayload = {
          code: payloadBase.code,
          name: payloadBase.name,
          description: payloadBase.description,
          measurementUnit: payloadBase.measurementUnit as any,
          inputGroup: payloadBase.inputGroup,
          paymentTerm: payloadBase.paymentTerm,
          acquisitionPrice: payloadBase.acquisitionPrice,
          currency: payloadBase.currency as any,
          priceConvertedBrl: payloadBase.priceConvertedBrl,
          additionalCost: payloadBase.additionalCost,
          taxId: payloadBase.taxId,
          freightId: payloadBase.freightId,
        };
        await updateMutation.mutateAsync({ id: updateId, payload: updatePayload });
        toast.success('Matéria-prima atualizada');
      }
      handleCloseModal();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erro ao salvar');
    }
  };

  return (
    <> 
      <PageHeader />
      <ActionBar onNewRawMaterialClick={handleOpenCreateModal} />
      {isLoading && <div className="p-4">Carregando...</div>}
      {isError && <div className="p-4 text-red-600">Erro ao carregar matérias-primas</div>}
      {!isLoading && !isError && (
        <RawMaterialTable
          materials={materials}
          onEditMaterial={handleOpenEditModal}
          onDeleteMaterial={handleOpenDeleteModal}
        />
      )}
      
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Excluir Matéria-prima"
        message="Você tem certeza que deseja excluir essa matéria-prima?"
      />
      
      <RawMaterialModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        mode={modalMode}
        material={selectedMaterial}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending || deleteMutation.isPending || updateMutation.isPending}
      />
    </>
  );
}