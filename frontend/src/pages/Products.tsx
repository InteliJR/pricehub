// src/pages/Products.tsx

import { useState } from 'react';
import type { Product } from '@/types';
import {
  useProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  mapApiToUi,
  type CreateProductPayload,
  type UpdateProductPayload,
} from '@/api/products';
import { toast } from 'react-hot-toast';

import { PageHeader } from '@/components/features/products/PageHeader';
import { ActionBar } from '@/components/features/products/ActionBar';
import { ViewToggle } from '@/components/features/products/ViewToggle';
import { ProductTable } from '@/components/features/products/ProductTable';
import { ProductModal } from '@/components/features/products/ProductModal';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { ProductGrid } from '@/components/features/products/ProductGrid';


// Removed mockProducts; data loaded from API

export default function Products() {
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [page] = useState(1);
  const [limit] = useState(20);
  const { data, isLoading, isError } = useProductsQuery({ page, limit });
  const products: Product[] = (data?.data ?? []).map(mapApiToUi);
  const createMutation = useCreateProductMutation();
  const updateMutation = useUpdateProductMutation();
  const deleteMutation = useDeleteProductMutation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
  const [updateId, setUpdateId] = useState<string | null>(null);

  const handleOpenCreateModal = () => {
    setSelectedProduct(undefined);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setSelectedProduct(product);
    setModalMode('edit');
    setUpdateId(product.id);
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

  const handleConfirmDelete = async () => {
    if (!selectedProduct) return;
    try {
      await deleteMutation.mutateAsync(selectedProduct.id);
      toast.success('Produto deletado');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erro ao deletar');
    }
    handleCloseDeleteModal();
  };

  const handleSubmit = async (formData: FormData) => {
    const codeRaw = String(formData.get('code') || '').replace(/^#/, '').trim();
    const name = String(formData.get('description') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const fixedCostId = String(formData.get('fixedCostId') || '') || undefined;
    const rawMaterialsJson = String(formData.get('rawMaterials') || '[]');
    let rawMaterialsParsed: { rawMaterialId: string; quantity: number }[] = [];
    try {
      rawMaterialsParsed = JSON.parse(rawMaterialsJson);
    } catch {
      rawMaterialsParsed = [];
    }
    // For now, rawMaterials empty array until selector wired.
    const base: CreateProductPayload = {
      code: codeRaw,
      name,
      description,
      fixedCostId,
      rawMaterials: rawMaterialsParsed,
    };
    try {
      if (modalMode === 'create') {
        if (!base.code || !base.name) {
          toast.error('Código e Descrição são obrigatórios');
          return;
        }
        await createMutation.mutateAsync(base);
        toast.success('Produto criado');
      } else if (modalMode === 'edit' && updateId) {
        const updatePayload: UpdateProductPayload = {
          code: base.code,
          name: base.name,
          description: base.description,
          fixedCostId: base.fixedCostId,
          rawMaterials: base.rawMaterials.length ? base.rawMaterials : undefined,
        };
        await updateMutation.mutateAsync({ id: updateId, payload: updatePayload });
        toast.success('Produto atualizado');
      }
      handleCloseModal();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erro ao salvar produto');
    }
  };

  return (
    <>
      <PageHeader />
      <ActionBar onNewProductClick={handleOpenCreateModal} />
      <ViewToggle view={view} onChange={setView} />

      {isLoading && <div className="p-4">Carregando...</div>}
      {isError && <div className="p-4 text-red-600">Erro ao carregar produtos</div>}
      {!isLoading && !isError && (
        view === 'table' ? (
          <ProductTable
            products={products}
            onEditProduct={handleOpenEditModal}
            onDeleteProduct={handleOpenDeleteModal}
          />
        ) : (
          <ProductGrid products={products} />
        )
      )}

      <ProductModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        mode={modalMode}
        product={selectedProduct}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
        // Wrap existing modal to provide a form submit
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