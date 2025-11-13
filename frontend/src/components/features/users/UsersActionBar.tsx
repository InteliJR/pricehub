import { Input } from '@/components/common/Input';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { FiSearch, FiPlus } from 'react-icons/fi';

interface UsersActionBarProps {
  onNewUserClick: () => void;
}

export function UsersActionBar({ onNewUserClick }: UsersActionBarProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="w-full max-w-xs">
        <Input 
          placeholder="Buscar" 
          leftIcon={FiSearch} 
        />
      </div>
      
      <SecondaryButton 
        variant="primary" 
        leftIcon={FiPlus}
        onClick={onNewUserClick}
      >
        Novo usuário
      </SecondaryButton>
    </div>
  );
}