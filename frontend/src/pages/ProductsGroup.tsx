import { useState } from 'react';
import type { ProductsGroup } from '@/types';

import { PageHeader } from '@/components/features/productsGroup/PageHeader';
import { ActionBar } from '@/components/features/productsGroup/ActionBar';
import { ProductsGroupTable } from '@/components/features/productsGroup/Table';
import { ProductsGroupModal } from '@/components/features/productsGroup/ProductsGroupModal';
import { ConfirmModal } from '@/components/common/ConfirmModal';

const mockGroups: ProductsGroup[] = [
  {
    id: '1',
    product: 'Cloro',
    volume: 30,
  },
  {
    id: '2',
    product: 'Hipo',
    volume: 27,
  },
  {
    id: '3',
    product: 'Granel/Envase/Secaria',
    volume: 16,
  },
  {
    id: '4',
    product: 'Premium',
    volume: 0,
  },
  {
    id: '5',
    product: 'Venda Direta',
    volume: 11,
  },
  {
    id: '6',
    product: 'Peroxido',
    volume: 3,
  },
   {
    id: '7',
    product: 'Fluor',
    volume: 13,
  },
];

export default function ProductsGroup() {
  const [groups, setGroups] = useState<ProductsGroup[]>(mockGroups);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedGroup, setSelectedGroup] = useState<ProductsGroup | undefined>(undefined);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleOpenCreate = () => {
    setSelectedGroup(undefined);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (group: ProductsGroup) => {
    setSelectedGroup(group);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDelete = (group: ProductsGroup) => {
    setSelectedGroup(group);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedGroup) {
      setGroups(prev => prev.filter(g => g.id !== selectedGroup.id));
    }
    setIsDeleteModalOpen(false);
    setSelectedGroup(undefined);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedGroup(undefined);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGroup(undefined);
  };

  return (
    <>
      <PageHeader />
      <ActionBar onNewProductsGroupClick={handleOpenCreate} />
      <ProductsGroupTable
        groups={groups}
        onEditProductsGroup={handleOpenEdit}
        onDeleteProductsGroup={handleDelete}
        size="spacious"
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Excluir Grupo de Produtos"
        message="Você tem certeza que deseja excluir este grupo?"
      />

      <ProductsGroupModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        mode={modalMode}
        group={selectedGroup}
      />
    </>
  );
}