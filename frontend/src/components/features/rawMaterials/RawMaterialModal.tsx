// src/components/features/rawMaterials/RawMaterialModal.tsx

import React from 'react';
import type { RawMaterial } from '@/types';

// 1. Importa o "esqueleto" genérico
import { Modal } from '@/components/common/Modal'; 
// 2. Importa o novo formulário
import { RawMaterialForm } from './RawMaterialForm';
// 3. Importa o botão
import { SecondaryButton } from '@/components/common/SecondaryButton';

interface RawMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  material?: RawMaterial; 
}

export function RawMaterialModal({ 
  isOpen, 
  onClose, 
  mode, 
  material 
}: RawMaterialModalProps) {
  
  const title = mode === 'create' ? 'Adicionar Matéria-prima' : 'Editar Matéria-prima';
  const buttonText = mode === 'create' ? 'Adicionar' : 'Salvar alterações';

  const modalFooter = (
    <SecondaryButton variant="primary">
      {buttonText}
    </SecondaryButton>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={modalFooter}
    >
      {/* Diferente do ProductModal, este não tem 2 colunas,
        apenas o formulário simples.
      */}
      <RawMaterialForm material={material} />
    </Modal>
  );
}