import type { OverheadGroup } from '@/types';
import { Text } from '@/components/common/Text';

interface OverheadGroupsTableProps {
  groups: OverheadGroup[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function OverheadGroupsTable({ groups }: OverheadGroupsTableProps) {
  return (

    <div className="shadow-sm rounded-lg overflow-hidden">
      
      <table className="w-full">
        
        {/* Cabeçalho com fundo escuro */}
        <thead className="bg-blue-900">
          <tr>
            {/* Célula do canto (Escura) */}
            <th className="px-4 py-3 bg-gray-50"></th> 
            
            {/* Cabeçalhos dos Grupos (Escuros) */}
            {groups.map(group => (
              <th 
                key={group.id} 
                className="px-4 py-3 text-left"
              >
                <Text 
                  as="span" 
                  variant="small" 
                  className="font-semibold uppercase text-white"
                >
                  {group.groupName}
                </Text>
              </th>
            ))}
          </tr>
        </thead>
        
        <tbody>
          {/* Linha 1: Unidade */}
          <tr className="border-b border-gray-200 bg-white">
            {/* O 'th' da lateral escuro. O texto aqui irá quebrar
               automaticamente conforme necessário.
            */}
            <th className="px-4 py-3 text-left bg-blue-900" scope="row">
              <Text variant="caption" className="font-semibold text-white">
                Unidade de medida a considerar para volume de venda
              </Text>
            </th>
            {/* Dados (Fundo Branco) */}
            {groups.map(group => (
              <td key={group.id} className="px-4 py-3">
                <Text variant="caption">{group.unit}</Text>
              </td>
            ))}
          </tr>
          
          {/* Linha 2: Volume */}
          <tr className="border-b border-gray-200 bg-white">
            <th className="px-4 py-3 text-left bg-blue-900" scope="row">
              <Text variant="caption" className="font-semibold text-white">
                Volume de vendas a considerar para o cálculo do preço de venda
              </Text>
            </th>
            {groups.map(group => (
              <td key={group.id} className="px-4 py-3">
                <Text variant="caption">{formatCurrency(group.salesVolume)}</Text>
              </td>
            ))}
          </tr>

          {/* Linha 3: Valor do Overhead */}
          <tr className="border-b border-gray-200 bg-white">
            <th className="px-4 py-3 text-left bg-blue-900" scope="row">
              <Text variant="caption" className="font-semibold text-white">
                Valor do overhead a considerar por unidade de venda
              </Text>
            </th>
            {groups.map(group => (
              <td key={group.id} className="px-4 py-3">
                <Text variant="caption" className="font-semibold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 3,
                  }).format(group.overheadValue)}
                </Text>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}