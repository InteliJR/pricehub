import type { User } from '@/types';
import { Text } from '@/components/common/Text';
import { StatusBadge } from '@/components/common/StatusBadge'; 
import { IconButton } from '@/components/common/IconButton';
import { FiEdit, FiTrash2 } from 'react-icons/fi';

interface UserTableRowProps {
  user: User;
  onEdit: () => void;
  onDelete: () => void;
}

export function UserTableRow({ user, onEdit, onDelete }: UserTableRowProps) {
  return (
    <tr className="border-b border-gray-200 odd:bg-white even:bg-gray-50 hover:bg-blue-50">
      {/* Usuário (Email) */}
      <td className="px-4 py-3 whitespace-nowrap">
        <Text variant="caption" className="font-semibold text-gray-900">
          {user.email}
        </Text>
      </td>
      
      {/* Filial */}
      <td className="px-4 py-3 whitespace-nowrap">
        <Text variant="caption">{user.branch}</Text>
      </td>
      
      {/* Status */}
      <td className="px-4 py-3 whitespace-nowrap">
        <StatusBadge status={user.status} />
      </td>
      
      {/* Função */}
      <td className="px-4 py-3 whitespace-nowrap">
        <Text variant="caption">{user.role}</Text>
      </td>
      
      {/* Ação */}
      <td className="px-4 py-3 whitespace-nowrap text-sm">
        <div className="flex items-center space-x-2">
          <IconButton icon={FiEdit} aria-label="Editar" onClick={onEdit} />
          <IconButton icon={FiTrash2} aria-label="Excluir" onClick={onDelete} />
        </div>
      </td>
    </tr>
  );
}