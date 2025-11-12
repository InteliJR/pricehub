import type { Product } from '@/types';
import { ProductTableRow } from './ProductTableRow';
import { TableHeaderCell } from '@/components/common/ProductTableHeaderCell';

interface ProductTableProps {
  products: Product[];
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
}

export function ProductTable({ products, onEditProduct, onDeleteProduct }: ProductTableProps) {
  return (
    <div className="bg-white shadow-sm rounded-lg overflow-x-auto">
      <table className="w-full min-w-max">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <TableHeaderCell>Código</TableHeaderCell>
            <TableHeaderCell>Descrição</TableHeaderCell>
            <TableHeaderCell sortable>Grupo</TableHeaderCell>
            <TableHeaderCell sortable>Preço</TableHeaderCell>
            <TableHeaderCell>Moeda</TableHeaderCell>
            <TableHeaderCell sortable>Overhead a considerar</TableHeaderCell>
            <TableHeaderCell>Ação</TableHeaderCell>
          </tr>
        </thead>

        <tbody>
          {products.map((product) => (
            <ProductTableRow key={product.id} product={product}
              onEdit={() => onEditProduct(product)}
              onDelete={() => onDeleteProduct(product)}
            />

          ))}
        </tbody>
      </table>
    </div>
  );
}