import type { Product } from '@/types'; 

import { Modal } from '@/components/common/Modal'; 

import { ProductForm } from './ProductForm';
import { RawMaterialSelector } from './RawMaterialSelector';

import { Button } from '@/components/common/Button';
import { useState } from 'react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  product?: Product; 
  onSubmit?: (formData: FormData) => void | Promise<void>;
  submitting?: boolean;
}

export function ProductModal({ isOpen, onClose, mode, product, onSubmit, submitting = false }: ProductModalProps) {
  const [rawMaterials, setRawMaterials] = useState<{ rawMaterialId: string; quantity: number }[]>([]);
  
  const title = mode === 'create' ? 'Adicionar produto' : 'Editar produto';
  const buttonText = mode === 'create' ? 'Adicionar produto' : 'Salvar alterações';

  const modalFooter = (
    <Button variant="primary" type="submit" form="product-form" disabled={submitting}>
      {submitting ? 'Salvando...' : buttonText}
    </Button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={modalFooter}
    >

      <form
        id="product-form"
        className="grid grid-cols-1 gap-8 md:grid-cols-2"
        onSubmit={e => {
          e.preventDefault();
          if (!onSubmit) return;
          const formData = new FormData(e.currentTarget);
          // rawMaterials already serialized in hidden input; ensure sync state if needed
          formData.set('rawMaterials', JSON.stringify(rawMaterials));
          onSubmit(formData);
        }}
      >
        <ProductForm product={product} />
        <RawMaterialSelector onChange={setRawMaterials} />
      </form>
    </Modal>
  );
}