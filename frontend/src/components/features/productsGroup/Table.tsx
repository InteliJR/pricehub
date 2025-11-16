import type { ProductsGroup } from '@/types';
import { ProductsGroupTableRow } from './TableRow';
import { TableHeaderCell } from '@/components/common/ProductTableHeaderCell';

interface ProductsGroupTableProps {
  groups: ProductsGroup[];
  onEditProductsGroup: (group: ProductsGroup) => void;
  onDeleteProductsGroup: (group: ProductsGroup) => void;
  size?: 'compact' | 'comfortable' | 'spacious';
}

export function ProductsGroupTable({ 
  groups, 
  onEditProductsGroup, 
  onDeleteProductsGroup,
  size = 'comfortable'
}: ProductsGroupTableProps) {
  return (
    <div className="bg-white shadow-sm rounded-lg overflow-x-auto">
      <table className="w-full min-w-max">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <TableHeaderCell size={size}>Id</TableHeaderCell>
            <TableHeaderCell size={size}>Produto</TableHeaderCell>
            <TableHeaderCell size={size}>% do Volume</TableHeaderCell>
            <TableHeaderCell size={size}>Ação</TableHeaderCell>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <ProductsGroupTableRow 
              key={group.id} 
              group={group} 
              size={size}
              onEdit={() => onEditProductsGroup(group)}
              onDelete={() => onDeleteProductsGroup(group)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}