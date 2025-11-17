// src/components/features/freights/FreightsTable.tsx

import type { Freight } from '@/types';
import { Text } from '@/components/common/Text';
import { IconButton } from '@/components/common/IconButton';
import { FiEdit2, FiTrash2, FiChevronUp } from 'react-icons/fi';
import { formatCurrency } from '@/lib/utils';

interface FreightsTableProps {
  freights: Freight[];
  onEdit: (freight: Freight) => void;
  onDelete: (id: string) => void;
  onSort: (column: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export function FreightsTable({
  freights,
  onEdit,
  onDelete,
  onSort,
  sortBy,
  sortOrder,
}: FreightsTableProps) {
  
  const SortIcon = ({ column }: { column: string }) => {
    const isActive = sortBy === column;

    return (
      <span
        className={`
          text-blue-600 w-4 h-4 transition-transform duration-200 
          ${isActive ? 'opacity-100' : 'opacity-0'} 
          ${isActive && sortOrder === 'desc' ? 'rotate-180' : ''}
        `}
      >
        <FiChevronUp />
      </span>
    );
  };

  const SortableHeader = ({
    column,
    label,
  }: {
    column: string;
    label: string;
  }) => (
    <th
      onClick={() => onSort(column)}
      aria-label={`Ordenar por ${label}`}
      className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none transition-colors"
    >
      <span className="flex items-center gap-1">
        {label}
        <SortIcon column={column} />
      </span>
    </th>
  );

  const getOperationTypeLabel = (type: string) => {
    return type === 'INTERNAL' ? 'Interno' : 'Externo';
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols = { BRL: 'R$', USD: 'US$', EUR: '€' };
    return symbols[currency as keyof typeof symbols] || currency;
  };

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-x-auto mb-8">
      <table className="w-full min-w-max">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <SortableHeader column="name" label="Nome" />
            <SortableHeader column="originCity" label="Origem" />
            <SortableHeader column="destinationCity" label="Destino" />
            <SortableHeader column="cargoType" label="Tipo de Carga" />
            <SortableHeader column="operationType" label="Operação" />
            <SortableHeader column="unitPrice" label="Preço Unitário" />
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Impostos
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Ações
            </th>
          </tr>
        </thead>

        <tbody>
          {freights.map((freight) => (
            <tr
              key={freight.id}
              className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <td className="px-4 py-3">
                <Text variant="caption" className="font-semibold text-gray-900">
                  {freight.name}
                </Text>
                {freight.description && (
                  <Text variant="caption" className="text-gray-500 text-xs mt-1">
                    {freight.description.length > 50 
                      ? `${freight.description.substring(0, 50)}...` 
                      : freight.description}
                  </Text>
                )}
              </td>
              <td className="px-4 py-3">
                <Text variant="caption">
                  {freight.originCity}, {freight.originUf}
                </Text>
              </td>
              <td className="px-4 py-3">
                <Text variant="caption">
                  {freight.destinationCity}, {freight.destinationUf}
                </Text>
              </td>
              <td className="px-4 py-3">
                <Text variant="caption">{freight.cargoType}</Text>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  freight.operationType === 'INTERNAL' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {getOperationTypeLabel(freight.operationType)}
                </span>
              </td>
              <td className="px-4 py-3">
                <Text variant="caption" className="font-semibold">
                  {getCurrencySymbol(freight.currency)} {formatCurrency(freight.unitPrice).replace('R$', '').trim()}
                </Text>
              </td>
              <td className="px-4 py-3">
                {freight.freightTaxes && freight.freightTaxes.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {freight.freightTaxes.map((tax, index) => (
                      <span 
                        key={tax.id || index}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                      >
                        {tax.name} ({tax.rate}%)
                      </span>
                    ))}
                  </div>
                ) : (
                  <Text variant="caption" className="text-gray-400">-</Text>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <IconButton
                    icon={FiEdit2}
                    aria-label="Editar frete"
                    onClick={() => onEdit(freight)}
                    className="text-blue-600 hover:bg-blue-50 cursor-pointer"
                  />
                  <IconButton
                    icon={FiTrash2}
                    aria-label="Excluir frete"
                    onClick={() => onDelete(freight.id)}
                    className="text-red-600 hover:bg-red-50 cursor-pointer"
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}