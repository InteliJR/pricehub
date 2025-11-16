import type { ProductsGroup } from '@/types';
import { IconButton } from '@/components/common/IconButton';
import { Text } from '@/components/common/Text';
import { FiEdit, FiTrash2 } from 'react-icons/fi';

interface ProductsGroupTableRowProps {
  group: ProductsGroup;
  onEdit: () => void;
  onDelete: () => void;
  size?: 'compact' | 'comfortable' | 'spacious';
}

export function ProductsGroupTableRow({ group, onEdit, onDelete, size = 'comfortable' }: ProductsGroupTableRowProps) {
  const pyClass = size === 'compact' ? 'py-2' : size === 'spacious' ? 'py-4' : 'py-3';
  return (
    <tr className="border-b border-gray-200 odd:bg-white even:bg-gray-50 hover:bg-blue-50">
      <td className={`px-4 ${pyClass} whitespace-nowrap`}>
        <Text variant="caption" className="text-gray-700">{group.id}</Text>
      </td>
      <td className={`px-4 ${pyClass} whitespace-nowrap`}>
        <Text variant="caption" className="font-semibold text-gray-900">
          {group.product}
        </Text>
      </td>
      <td className={`px-4 ${pyClass} whitespace-nowrap`}>
        <Text variant="caption">{group.volume}%</Text>
      </td>
      <td className={`px-4 ${pyClass} whitespace-nowrap text-sm`}>
        <div className="flex items-center space-x-2">
          <IconButton icon={FiEdit} aria-label="Editar" onClick={onEdit} />
          <IconButton icon={FiTrash2} aria-label="Excluir" onClick={onDelete} />
        </div>
      </td>
    </tr>
  );
}