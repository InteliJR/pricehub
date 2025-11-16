import type { Freight } from '@/types';
import { FreightTableRow } from './FreightTableRow';
import { TableHeaderCell } from '@/components/common/ProductTableHeaderCell';

interface FreightTableProps {
  freights: Freight[];
  onEditFreight: (freight: Freight) => void;
  onDeleteFreight: (freight: Freight) => void;
}

export function FreightTable({ 
  freights, 
  onEditFreight, 
  onDeleteFreight 
}: FreightTableProps) {
  return (
    <div className="bg-white shadow-sm rounded-lg overflow-x-auto">
      <table className="w-full min-w-max">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <TableHeaderCell>UF Origem</TableHeaderCell>
            <TableHeaderCell>Cidade Origem</TableHeaderCell>
            <TableHeaderCell>UF Destino</TableHeaderCell>
            <TableHeaderCell>Cidade Destino</TableHeaderCell>
            <TableHeaderCell>Distância</TableHeaderCell>
            <TableHeaderCell>Veículo</TableHeaderCell>
            <TableHeaderCell>Carga</TableHeaderCell>
            <TableHeaderCell>Terceiros</TableHeaderCell>
            <TableHeaderCell>Ação</TableHeaderCell>
          </tr>
        </thead>
        <tbody>
          {freights.map((freight) => (
            <FreightTableRow 
              key={freight.id} 
              freight={freight} 
              onEdit={() => onEditFreight(freight)}
              onDelete={() => onDeleteFreight(freight)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}