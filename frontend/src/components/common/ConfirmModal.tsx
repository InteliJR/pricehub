import { Modal } from './Modal';
import { SecondaryButton } from './SecondaryButton'; 
import { Text } from './Text';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Excluir", 
  cancelText = "Cancelar", 
}: ConfirmModalProps) {

  const modalFooter = (
    <div className="flex space-x-3">
      <SecondaryButton variant="secondary" onClick={onClose}>
        {cancelText}
      </SecondaryButton>
      <SecondaryButton variant="danger" onClick={onConfirm}>
        {confirmText}
      </SecondaryButton>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={modalFooter}
    >
      <Text>{message}</Text>
    </Modal>
  );
}