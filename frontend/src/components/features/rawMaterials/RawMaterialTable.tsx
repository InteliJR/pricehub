import type { RawMaterial } from '@/types';
import { RawMaterialTableRow } from './RawMaterialTableRow';
import { TableHeaderCell } from '@/components/common/ProductTableHeaderCell';

interface RawMaterialTableProps {
  materials: RawMaterial[];
  onEditMaterial: (material: RawMaterial) => void;
  onDeleteMaterial: (material: RawMaterial) => void;
}

export function RawMaterialTable({ 
  materials, 
  onEditMaterial, 
  onDeleteMaterial 
}: RawMaterialTableProps) {
  return (
    <div className="bg-white shadow-sm rounded-lg overflow-x-auto">
      <table className="w-full min-w-max">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <TableHeaderCell>Id</TableHeaderCell>
            <TableHeaderCell sortable>Nome</TableHeaderCell>
            <TableHeaderCell sortable>Descrição</TableHeaderCell>
            <TableHeaderCell sortable>Prazo</TableHeaderCell>
            <TableHeaderCell sortable>Preço</TableHeaderCell>
            <TableHeaderCell>Moeda</TableHeaderCell>
            <TableHeaderCell>Custos adicionais</TableHeaderCell>
            <TableHeaderCell>Ação</TableHeaderCell>
          </tr>
        </thead>
        <tbody>
          {materials.map((material) => (
            <RawMaterialTableRow 
              key={material.id} 
              material={material} 
              onEdit={() => onEditMaterial(material)}
              onDelete={() => onDeleteMaterial(material)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}