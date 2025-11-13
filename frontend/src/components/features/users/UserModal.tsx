// src/components/features/users/UserModal.tsx

import React from 'react';
import type { User } from '@/types';

import { Modal } from '@/components/common/Modal'; 
import { UserForm } from './UserForm'; // Importa o formulário
import { SecondaryButton } from '@/components/common/SecondaryButton';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  user?: User; 
}

export function UserModal({ 
  isOpen, 
  onClose, 
  mode, 
  user 
}: UserModalProps) {
  
  const title = mode === 'create' ? 'Adicionar Usuário' : 'Editar Usuário';
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
      <UserForm user={user} />
    </Modal>
  );
}