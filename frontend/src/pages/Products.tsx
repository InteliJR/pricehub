// src/pages/Products.tsx

import { useState } from 'react';
import type { Product } from '@/types';

import { PageHeader } from '@/components/features/products/PageHeader';
import { ActionBar } from '@/components/features/products/ActionBar';
import { ViewToggle } from '@/components/features/products/ViewToggle';
import { ProductTable } from '@/components/features/products/ProductTable';
import { ProductModal } from '@/components/features/products/ProductModal';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { ProductGrid } from '@/components/features/products/ProductGrid';


const mockProducts: Product[] = [
  { id: '1', code: '#20462', description: 'Produto X', group: 1, price: 4.95, currency: 'Real', overhead: 4.95 },
  { id: '2', code: '#18933', description: 'Produto X', group: 1, price: 8.95, currency: 'Dólar', overhead: 4.95 },
  { id: '3', code: '#45169', description: 'Produto X', group: 1, price: 1149.95, currency: 'Real', overhead: 4.95 },
  { id: '4', code: '#34304', description: 'Produto X', group: 1, price: 899.95, currency: 'Real', overhead: 4.95 },
  { id: '5', code: '#17188', description: 'Produto X', group: 1, price: 22.95, currency: 'Real', overhead: 4.95 },
  { id: '5', code: '#17188', description: 'Produto X', group: 1, price: 22.95, currency: 'Real', overhead: 4.95 },
  { id: '5', code: '#17188', description: 'Produto X', group: 1, price: 22.95, currency: 'Real', overhead: 4.95 },
  { id: '5', code: '#17188', description: 'Produto X', group: 1, price: 22.95, currency: 'Real', overhead: 4.95 },
  { id: '5', code: '#17188', description: 'Produto X', group: 1, price: 22.95, currency: 'Real', overhead: 4.95 },
  { id: '5', code: '#17188', description: 'Produto X', group: 1, price: 22.95, currency: 'Real', overhead: 4.95 },
  { id: '5', code: '#17188', description: 'Produto X', group: 1, price: 22.95, currency: 'Real', overhead: 4.95 },
];

export default function Products() {
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);

  const handleOpenCreateModal = () => {
    setSelectedProduct(undefined);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setSelectedProduct(product);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(undefined);
  };

  const handleOpenDeleteModal = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedProduct(undefined);
  };

  const handleConfirmDelete = () => {
    if (selectedProduct) {
      setProducts((prevProducts) =>
        prevProducts.filter((p) => p.id !== selectedProduct.id)
      );
    }
    handleCloseDeleteModal();
  };

  return (
    <>
      <PageHeader />
      <ActionBar onNewProductClick={handleOpenCreateModal} />
      <ViewToggle view={view} onChange={setView} />

      {view === 'table' ? (
        <ProductTable
          products={products}
          onEditProduct={handleOpenEditModal}
          onDeleteProduct={handleOpenDeleteModal}
        />
      ) : (
        <ProductGrid products={products} />
      )}

      <ProductModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        mode={modalMode}
        product={selectedProduct}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Excluir Produto"
        message="Você tem certeza que deseja excluir esse produto?"
      />
    </>
  );
}