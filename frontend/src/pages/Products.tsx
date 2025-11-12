import { useState } from 'react';
import type { Product } from '@/types';

import { PageHeader } from '@/components/features/products/PageHeader';
import { ActionBar } from '@/components/features/products/ActionBar';
import { ViewToggle } from '@/components/features/products/ViewToggle';
import { ProductTable } from '@/components/features/products/ProductTable';

const mockProducts: Product[] = [
  { id: '1', code: '#20462', description: 'Produto X', group: 1, price: 4.95, currency: 'Real', overhead: 4.95 },
  { id: '2', code: '#18933', description: 'Produto X', group: 1, price: 8.95, currency: 'Dólar', overhead: 4.95 },
  { id: '3', code: '#45169', description: 'Produto X', group: 1, price: 1149.95, currency: 'Real', overhead: 4.95 },
  { id: '4', code: '#34304', description: 'Produto X', group: 1, price: 899.95, currency: 'Real', overhead: 4.95 },
  { id: '5', code: '#17188', description: 'Produto X', group: 1, price: 22.95, currency: 'Real', overhead: 4.95 },
];

export default function Products() {

  const [view, setView] = useState<'table' | 'grid'>('table');

  const [products] = useState<Product[]>(mockProducts);

  return (
    <>
      <PageHeader />
      <ActionBar />
      <ViewToggle view={view} onChange={setView} />

      {view === 'table' ? (
        <ProductTable products={products} />
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <p>Visualização em Grid (a ser implementada)</p>
        </div>
      )}
    </>
  );
}