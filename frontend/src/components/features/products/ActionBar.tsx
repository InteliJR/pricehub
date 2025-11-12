import { FiPlus, FiUpload } from 'react-icons/fi';
import { SecondaryButton } from '@/components/common/SecondaryButton';

export function ActionBar() {
  return (
    <div className="flex items-center space-x-3 mb-6">
      <SecondaryButton variant="primary" leftIcon={FiPlus}>
        Novo Produto
      </SecondaryButton>

      <SecondaryButton variant="secondary" leftIcon={FiUpload}>
        Subir em lote
      </SecondaryButton>
    </div>
  );
}