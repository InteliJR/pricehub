import type { Product } from '@/types'; 

import { Modal } from '@/components/common/Modal'; 

import { ProductForm } from './ProductForm';
import { RawMaterialSelector } from './RawMaterialSelector';

import { Button } from '@/components/common/Button';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  product?: Product; 
}

export function ProductModal({ isOpen, onClose, mode, product }: ProductModalProps) {
  
  const title = mode === 'create' ? 'Adicionar produto' : 'Editar produto';
  const buttonText = mode === 'create' ? 'Adicionar produto' : 'Salvar alterações';

  const modalFooter = (
    <Button variant="primary">
      {buttonText}
    </Button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={modalFooter}
    >

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        
        <ProductForm product={product} />
        
        <RawMaterialSelector />
        
      </div>
    </Modal>
  );
}