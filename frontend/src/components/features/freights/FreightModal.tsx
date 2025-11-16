import type { Freight } from '@/types';

// 1. Importa o "esqueleto" genérico
import { Modal } from '@/components/common/Modal'; 
// 2. Importa o novo formulário
import { FreightForm } from './FreightForm';
// 3. Importa o botão
import { SecondaryButton } from '@/components/common/SecondaryButton';

interface FreightModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  freight?: Freight; 
}

export function FreightModal({ 
  isOpen, 
  onClose, 
  mode, 
  freight 
}: FreightModalProps) {
  
  const title = mode === 'create' ? 'Adicionar Frete' : 'Editar Frete';
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
      <FreightForm freight={freight} />
    </Modal>
  );
}