import type { Freight } from '@/types';
import { IconButton } from '@/components/common/IconButton';
import { Text } from '@/components/common/Text';
import { FiEdit, FiTrash2 } from 'react-icons/fi';

interface FreightTableRowProps {
  freight: Freight;
  onEdit: () => void;
  onDelete: () => void;
}

export function FreightTableRow({ freight, onEdit, onDelete }: FreightTableRowProps) {
  return (
    <tr className="border-b border-gray-200 odd:bg-white even:bg-gray-50 hover:bg-blue-50">
      <td className="px-4 py-3 whitespace-nowrap">
        <Text variant="caption" className="text-gray-700">{freight.originUf}</Text>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <Text variant="caption" className="font-semibold text-gray-900">
          {freight.originCity}
        </Text>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <Text variant="caption">{freight.destinyUf}</Text>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <Text variant="caption">{freight.distance}</Text>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <Text variant="caption">{freight.distance}</Text>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <Text variant="caption">{freight.vehicle}</Text>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <Text variant="caption">{freight.charge}</Text>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <Text variant="caption">{freight.thirdParties}</Text>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm">
        <div className="flex items-center space-x-2">
          <IconButton icon={FiEdit} aria-label="Editar" onClick={onEdit} />
          <IconButton icon={FiTrash2} aria-label="Excluir" onClick={onDelete} />
        </div>
      </td>
    </tr>
  );
}