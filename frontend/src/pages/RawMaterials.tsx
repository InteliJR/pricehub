import { useState } from 'react';
import type { RawMaterial } from '@/types'; 

import { PageHeader } from '@/components/features/rawMaterials/PageHeader';
import { ActionBar } from '@/components/features/rawMaterials/ActionBar';
import { RawMaterialTable } from '@/components/features/rawMaterials/RawMaterialTable';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { RawMaterialModal } from '@/components/features/rawMaterials/RawMaterialModal';

const mockRawMaterials: RawMaterial[] = [
  { id: '1', code: '#20462', name: 'Matéria-prima x', description: 'Lorem ipsum,dolor...', deadline: '13/05/2022', price: 4.95, currency: 'Real', additionalCosts: 4.95 },
  { id: '2', code: '#18933', name: 'Matéria-prima x', description: 'Lorem ipsum,dolor...', deadline: '22/05/2022', price: 8.95, currency: 'Dólar', additionalCosts: 4.95 },
  { id: '3', code: '#45169', name: 'Matéria-prima x', description: 'Lorem ipsum,dolor...', deadline: '15/06/2022', price: 1149.95, currency: 'Real', additionalCosts: 4.95 },
  { id: '4', code: '#34304', name: 'Matéria-prima x', description: 'Lorem ipsum,dolor...', deadline: '06/09/2022', price: 899.95, currency: 'Real', additionalCosts: 4.95 },
  { id: '5', code: '#17188', name: 'Matéria-prima x', description: 'Lorem ipsum,dolor...', deadline: '25/09/2022', price: 22.95, currency: 'Real', additionalCosts: 4.95 },
];

export default function RawMaterials() {
  const [materials, setMaterials] = useState<RawMaterial[]>(mockRawMaterials);
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

  const handleConfirmDelete = () => {
    if (selectedMaterial) {
      setMaterials((prev) => 
        prev.filter((m) => m.id !== selectedMaterial.id)
      );
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
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMaterial(undefined);
  };

  return (
    <> 
      <PageHeader />
      <ActionBar onNewRawMaterialClick={handleOpenCreateModal} />
      
      <RawMaterialTable 
        materials={materials} 
        onEditMaterial={handleOpenEditModal} 
        onDeleteMaterial={handleOpenDeleteModal}
      />
      
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
      />
    </>
  );
}