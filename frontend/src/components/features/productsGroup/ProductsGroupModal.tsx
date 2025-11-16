import React from 'react';
import type { ProductsGroup } from '@/types';
import { Modal } from '@/components/common/Modal';
import { ProductsGroupForm } from './ProductsGroupForm';
import { SecondaryButton } from '@/components/common/SecondaryButton';

interface ProductsGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  group?: ProductsGroup;
}

export function ProductsGroupModal({ isOpen, onClose, mode, group }: ProductsGroupModalProps) {
  const title = mode === 'create' ? 'Adicionar Grupo de Produtos' : 'Editar Grupo de Produtos';
  const buttonText = mode === 'create' ? 'Adicionar' : 'Salvar alterações';

  const footer = (
    <SecondaryButton variant="primary">
      {buttonText}
    </SecondaryButton>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer}>
      <ProductsGroupForm group={group} />
    </Modal>
  );
}
