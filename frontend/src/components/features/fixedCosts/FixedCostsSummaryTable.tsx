import type { FixedCost } from '@/types';
import { Text } from '@/components/common/Text';
import { TableHeaderCell } from '@/components/common/ProductTableHeaderCell';

interface FixedCostsSummaryTableProps {
  costs: FixedCost[];
}

// Helper (pode mover para lib/utils.ts)
const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Helper para calcular totais
const calculateTotals = (costs: FixedCost[]) => {
  return costs.reduce((acc, cost) => {
    const personnel = cost.personnel || 0;
    const others = cost.others || 0;
    const depreciation = cost.depreciation || 0;
    const total = personnel + others + depreciation;
    const overhead = (total * (cost.percentage / 100));

    acc.personnel += personnel;
    acc.others += others;
    acc.depreciation += depreciation;
    acc.total += total;
    acc.overhead += overhead;
    return acc;
  }, { personnel: 0, others: 0, depreciation: 0, total: 0, overhead: 0 });
};

export function FixedCostsSummaryTable({ costs }: FixedCostsSummaryTableProps) {
  const totals = calculateTotals(costs);

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-x-auto mb-8">
      <table className="w-full min-w-max">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <TableHeaderCell>Descrição</TableHeaderCell>
            <TableHeaderCell>Código</TableHeaderCell>
            <TableHeaderCell sortable>Pessoal</TableHeaderCell>
            <TableHeaderCell sortable>Outros</TableHeaderCell>
            <TableHeaderCell>Depreciação</TableHeaderCell>
            <TableHeaderCell>Total</TableHeaderCell>
            <TableHeaderCell>% Gastos a Considerar</TableHeaderCell>
            <TableHeaderCell>Overhead a considerar</TableHeaderCell>
          </tr>
        </thead>
        
        {/* Corpo da Tabela */}
        <tbody>
          {costs.map((cost) => {
            const total = (cost.personnel || 0) + (cost.others || 0) + (cost.depreciation || 0);
            const overhead = total * (cost.percentage / 100);
            
            return (
              <tr key={cost.id} className="border-b border-gray-200 odd:bg-white even:bg-gray-50">
                <td className="px-4 py-3"><Text variant="caption" className="font-semibold text-gray-900">{cost.description}</Text></td>
                <td className="px-4 py-3"><Text variant="caption">{cost.code || '-'}</Text></td>
                <td className="px-4 py-3"><Text variant="caption">{formatCurrency(cost.personnel)}</Text></td>
                <td className="px-4 py-3"><Text variant="caption">{formatCurrency(cost.others)}</Text></td>
                <td className="px-4 py-3"><Text variant="caption">{formatCurrency(cost.depreciation)}</Text></td>
                <td className="px-4 py-3"><Text variant="caption" className="font-semibold">{formatCurrency(total)}</Text></td>
                <td className="px-4 py-3"><Text variant="caption">{cost.percentage}%</Text></td>
                <td className="px-4 py-3"><Text variant="caption" className="font-semibold">{formatCurrency(overhead)}</Text></td>
              </tr>
            );
          })}
        </tbody>

        {/* Rodapé da Tabela */}
        <tfoot className="bg-gray-50 border-t-2 border-gray-300">
          <tr>
            <th className="px-4 py-3 text-left">
              <Text variant="caption" className="font-bold uppercase text-gray-700">TOTAL GERAL</Text>
            </th>
            <th className="px-4 py-3"></th> {/* Código */}
            <th className="px-4 py-3 text-left"><Text variant="caption" className="font-bold">{formatCurrency(totals.personnel)}</Text></th>
            <th className="px-4 py-3 text-left"><Text variant="caption" className="font-bold">{formatCurrency(totals.others)}</Text></th>
            <th className="px-4 py-3 text-left"><Text variant="caption" className="font-bold">{formatCurrency(totals.depreciation)}</Text></th>
            <th className="px-4 py-3 text-left"><Text variant="caption" className="font-bold">{formatCurrency(totals.total)}</Text></th>
            <th className="px-4 py-3"></th> {/* % */}
            <th className="px-4 py-3 text-left"><Text variant="caption" className="font-bold">{formatCurrency(totals.overhead)}</Text></th>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}