// src/components/features/products/ProductCard.tsx

import React from 'react';
import type { Product } from '@/types';
import { Text } from '@/components/common/Text';
// 👇 1. REMOVEMOS A IMPORTAÇÃO DO PLACEHOLDER
// import { ProductCardPlaceholder } from './ProductCardPlaceholder';

interface ProductCardProps {
  product: Product;
}

// Helper (copiado do ProductTableRow)
const formatCurrency = (value: number, currency: string) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency === 'Real' ? 'BRL' : 'USD',
  }).format(value);
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      
      {/* O Título */}
      <Text as="span" variant="caption" className="font-semibold text-gray-900">
        {product.description}
      </Text>
      
      <div className="mt-4 space-y-1">
        <Text as="p" variant="small">
          <strong className="text-gray-600">Código:</strong> {product.code}
        </Text>
        <Text as="p" variant="small">
          <strong className="text-gray-600">Preço:</strong> {formatCurrency(product.price, product.currency)}
        </Text>
        <Text as="p" variant="small">
          <strong className="text-gray-600">Grupo:</strong> {product.group}
        </Text>
      </div>
      
    </div>
  );
}