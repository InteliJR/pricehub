// src/components/features/fixedCosts/FixedCostModal.tsx

import React from 'react';
import type { FixedCost } from '@/types';

import { Modal } from '@/components/common/Modal'; 
import { FixedCostForm } from './FixedCostForm';
import { SecondaryButton } from '@/components/common/SecondaryButton';

interface FixedCostModalProps {
  isOpen: boolean;
  onClose: () => void;
  // (No futuro, você terá os modos 'create' e 'edit')
  // mode: 'create' | 'edit';
  cost?: FixedCost; 
}

export function FixedCostModal({ 
  isOpen, 
  onClose, 
  cost 
}: FixedCostModalProps) {
  
  // (Vamos simplificar, por enquanto, apenas para 'create')
  const title = 'Adicionar Custo Fixo';
  const buttonText = 'Adicionar';

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
      <FixedCostForm cost={cost} />
    </Modal>
  );
}