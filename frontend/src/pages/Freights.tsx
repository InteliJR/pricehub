import { useState } from 'react';
import type { Freight } from '@/types'; 

import { PageHeader } from '@/components/features/freights/PageHeader';
import { ActionBar } from '@/components/features/freights/ActionBar';
import { FreightTable } from '@/components/features/freights/FreightTable';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { FreightModal } from '@/components/features/freights/FreightModal';

const mockFreights: Freight[] = [
  {
    id: '1',
    originUf: 'SP',
    originCity: 'São Paulo',
    destinyUf: 'RJ',
    distance: 430,
    vehicle: 1,
    charge: 2500,
    thirdParties: 'Transportadora X',
  },
  {
    id: '2',
    originUf: 'MG',
    originCity: 'Belo Horizonte',
    destinyUf: 'BA',
    distance: 1370,
    vehicle: 2,
    charge: 5200,
    thirdParties: 'Parceiro Y',
  },
  {
    id: '3',
    originUf: 'PR',
    originCity: 'Curitiba',
    destinyUf: 'SC',
    distance: 300,
    vehicle: 1,
    charge: 1500,
    thirdParties: 'Transportadora Z',
  },
];

export default function Freights() {
  const [freights, setFreights] = useState<Freight[]>(mockFreights);
  const [selectedFreight, setSelectedFreight] = useState<Freight | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleOpenDeleteModal = (freight: Freight) => {
    setSelectedFreight(freight);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedFreight(undefined);
  };

  const handleConfirmDelete = () => {
    if (selectedFreight) {
      setFreights((prev) => 
        prev.filter((m) => m.id !== selectedFreight.id)
      );
    }
    handleCloseDeleteModal();
  };
  
  const handleOpenCreateModal = () => {
    setSelectedFreight(undefined);
    setModalMode('create');
    setIsModalOpen(true);
  };
  
  const handleOpenEditModal = (freight: Freight) => {
    setSelectedFreight(freight);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedFreight(undefined);
  };

  return (
    <> 
      <PageHeader />
      <ActionBar onNewFreightClick={handleOpenCreateModal} />
      
      <FreightTable 
        freights={freights} 
        onEditFreight={handleOpenEditModal} 
        onDeleteFreight={handleOpenDeleteModal}
      />
      
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Excluir Frete"
        message="Você tem certeza que deseja excluir este frete?"
      />
      
      <FreightModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        mode={modalMode}
        freight={selectedFreight}
      />
    </>
  );
}