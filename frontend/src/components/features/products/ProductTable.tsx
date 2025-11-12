import type { Product } from '@/types';
import { ProductTableHeaderCell } from './ProductTableHeaderCell';
import { ProductTableRow } from './ProductTableRow';

interface ProductTableProps {
  products: Product[];
}

export function ProductTable({ products }: ProductTableProps) {
  return (
    <div className="bg-white shadow-sm rounded-lg overflow-x-auto">
      <table className="w-full min-w-max">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <ProductTableHeaderCell>Código</ProductTableHeaderCell>
            <ProductTableHeaderCell>Descrição</ProductTableHeaderCell>
            <ProductTableHeaderCell sortable>Grupo</ProductTableHeaderCell>
            <ProductTableHeaderCell sortable>Preço</ProductTableHeaderCell>
            <ProductTableHeaderCell>Moeda</ProductTableHeaderCell>
            <ProductTableHeaderCell sortable>Overhead a considerar</ProductTableHeaderCell>
            <ProductTableHeaderCell>Ação</ProductTableHeaderCell>
          </tr>
        </thead>
        
        <tbody>
          {products.map((product) => (
            <ProductTableRow key={product.id} product={product} />
          ))}
        </tbody>
      </table>
    </div>
  );
}