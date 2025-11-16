import { SecondaryButton } from '@/components/common/SecondaryButton';
import { FiPlus } from 'react-icons/fi';

interface ActionBarProps {
  onNewFreightClick: () => void;
}

export function ActionBar({ onNewFreightClick }: ActionBarProps) {
  return (
    <div className="flex items-center space-x-3 mb-6">
      <SecondaryButton 
        variant="primary" 
        leftIcon={FiPlus}
        onClick={onNewFreightClick}
      >
        Novo Frete
      </SecondaryButton>
    </div>
  );
}