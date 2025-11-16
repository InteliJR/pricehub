import { SecondaryButton } from '@/components/common/SecondaryButton';
import { FiPlus, FiUpload } from 'react-icons/fi';

interface ActionBarProps {
  onNewProductsGroupClick: () => void;
}

export function ActionBar({ onNewProductsGroupClick }: ActionBarProps) {
  return (
    <div className="flex items-center space-x-3 mb-6">
      <SecondaryButton 
        variant="primary" 
        leftIcon={FiPlus}
        onClick={onNewProductsGroupClick} 
      >
        Novo Grupo de Produtos
      </SecondaryButton>
    </div>
  );
}