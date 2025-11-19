// src/components/features/rawMaterials/RawMaterialModal.tsx

import { toast } from 'react-hot-toast';
import type { RawMaterial } from '@/types/rawMaterial';
import type { CreateRawMaterialDTO } from '@/api/rawMaterials';
import { Modal } from '@/components/common/Modal';
import { RawMaterialForm } from './RawMaterialForm';
import { ChangeLogHistory } from './ChangeLogHistory';
import { Button } from '@/components/common/Button';
import { 
  useCreateRawMaterialMutation, 
  useUpdateRawMaterialMutation 
} from '@/api/rawMaterials';

interface RawMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawMaterial?: RawMaterial | null;
}

export function RawMaterialModal({ 
  isOpen, 
  onClose, 
  rawMaterial 
}: RawMaterialModalProps) {
  
  const createMutation = useCreateRawMaterialMutation();
  const updateMutation = useUpdateRawMaterialMutation();

  const isEditing = !!rawMaterial;
  const title = isEditing ? 'Editar Matéria-Prima' : 'Adicionar Matéria-Prima';

  const handleSubmit = async (data: CreateRawMaterialDTO) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ 
          id: rawMaterial.id, 
          payload: data 
        });
        toast.success('Matéria-prima atualizada com sucesso');
      } else {
        await createMutation.mutateAsync(data);
        toast.success('Matéria-prima criada com sucesso');
      }
      onClose();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Erro ao salvar matéria-prima';
      
      // Tratamento de erros específicos
      if (error?.response?.status === 409) {
        toast.error('Já existe uma matéria-prima com este código');
      } else if (error?.response?.data?.errors) {
        // Erros de validação
        const validationErrors = error.response.data.errors;
        if (Array.isArray(validationErrors)) {
          validationErrors.forEach((err: any) => {
            toast.error(err.message || 'Erro de validação');
          });
        } else {
          toast.error(message);
        }
      } else {
        toast.error(message);
      }
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="xl"
    >
      <div className="space-y-6">
        {/* Formulário */}
        <RawMaterialForm 
          rawMaterial={rawMaterial} 
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
        
        {/* Histórico de mudanças (apenas em edição) */}
        {isEditing && (
          <div className="border-t pt-6">
            <ChangeLogHistory rawMaterialId={rawMaterial.id} />
          </div>
        )}
      </div>
      
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
          form="raw-material-form"
          isLoading={isLoading}
        >
          {isEditing ? 'Atualizar' : 'Adicionar'}
        </Button>
      </div>
    </Modal>
  );
}