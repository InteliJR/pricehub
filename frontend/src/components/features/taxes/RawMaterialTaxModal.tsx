// src/components/features/taxes/RawMaterialTaxModal.tsx

import { toast } from 'react-hot-toast';
import type { RawMaterialTax } from '@/types/taxes';
import type { CreateRawMaterialTaxDTO } from '@/api/taxes';
import { Modal } from '@/components/common/Modal';
import { RawMaterialTaxForm } from './RawMaterialTaxForm';
import { Button } from '@/components/common/Button';
import { 
  useCreateRawMaterialTaxMutation, 
  useUpdateRawMaterialTaxMutation 
} from '@/api/taxes';

interface RawMaterialTaxModalProps {
  isOpen: boolean;
  onClose: () => void;
  tax?: RawMaterialTax | null;
}

export function RawMaterialTaxModal({ 
  isOpen, 
  onClose, 
  tax 
}: RawMaterialTaxModalProps) {
  
  const createMutation = useCreateRawMaterialTaxMutation();
  const updateMutation = useUpdateRawMaterialTaxMutation();

  const isEditing = !!tax;
  const title = isEditing ? 'Editar Imposto de Matéria-Prima' : 'Adicionar Imposto de Matéria-Prima';

  const handleSubmit = async (data: CreateRawMaterialTaxDTO) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ 
          id: tax.id, 
          payload: data 
        });
        toast.success('Imposto atualizado com sucesso');
      } else {
        await createMutation.mutateAsync(data);
        toast.success('Imposto criado com sucesso');
      }
      onClose();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Erro ao salvar imposto';
      toast.error(message);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
    >
      <RawMaterialTaxForm 
        tax={tax} 
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
      
      <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
        <Button 
          variant="secondary" 
          onClick={onClose}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button 
          type="submit"
          variant="primary"
          form="raw-material-tax-form"
          isLoading={isLoading}
        >
          {isEditing ? 'Atualizar' : 'Adicionar'}
        </Button>
      </div>
    </Modal>
  );
}