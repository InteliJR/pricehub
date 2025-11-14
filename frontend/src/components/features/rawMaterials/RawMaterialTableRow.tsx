import React from 'react';
import type { RawMaterial } from '@/types';
import { IconButton } from '@/components/common/IconButton';
import { Text } from '@/components/common/Text';
import { FiEdit, FiTrash2 } from 'react-icons/fi';

interface RawMaterialTableRowProps {
  material: RawMaterial;
  onEdit: () => void;
  onDelete: () => void;
}

// Helper (pode mover para lib/utils.ts)
const formatCurrency = (value: number, currency: string) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency === 'Real' ? 'BRL' : 'USD',
  }).format(value);
};

export function RawMaterialTableRow({ material, onEdit, onDelete }: RawMaterialTableRowProps) {
  return (
    <tr className="border-b border-gray-200 odd:bg-white even:bg-gray-50 hover:bg-blue-50">
      <td className="px-4 py-3 whitespace-nowrap">
        <Text variant="caption" className="text-gray-700">{material.code}</Text>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <Text variant="caption" className="font-semibold text-gray-900">
          {material.name}
        </Text>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <Text variant="caption">{material.description}</Text>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <Text variant="caption">{material.deadline}</Text>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <Text variant="caption">
          {formatCurrency(material.price, material.currency)}
        </Text>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <Text variant="caption">{material.currency}</Text>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <Text variant="caption">
          {formatCurrency(material.additionalCosts, 'Real')}
        </Text>
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