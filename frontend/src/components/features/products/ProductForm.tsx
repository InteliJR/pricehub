// src/components/features/products/ProductForm.tsx

import React from 'react';
import type { Product } from '@/types';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Textarea } from '@/components/common/Textarea';
import { Select } from '@/components/common/Select'; // 1. Importar o Select
import { useFixedCostsQuery } from '@/api/fixedCosts';

interface ProductFormProps {
  product?: Product;
}

export function ProductForm({ product }: ProductFormProps) {
  const { data: fixedCostsData } = useFixedCostsQuery({ page: 1, limit: 100 });
  const fixedCosts = fixedCostsData?.data ?? [];
  return (
    // 2. Adicionado um grid para melhor layout dos campos
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      
      {/* Campo Código */}
      <div className="sm:col-span-1">
        <Label htmlFor="code">Código</Label>
        <Input 
          id="code"
          name="code"
          placeholder="Insira o código" 
          defaultValue={product?.code}
        />
      </div>
      
      {/* Campo Grupo */}
      <div className="sm:col-span-1">
        <Label htmlFor="group">Grupo</Label>
        <Input 
          id="group" 
          name="group"
          type="number"
          placeholder="Insira o grupo" 
          defaultValue={product?.group}
        />
      </div>
      
      {/* Campo Descrição */}
      <div className="sm:col-span-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea 
          id="description" 
          name="description"
          placeholder="Insira a descrição" 
          rows={3} 
          defaultValue={product?.description}
        />
      </div>

      {/* Seleção de Custo Fixo (Overhead) */}
      <div className="sm:col-span-2">
        <Label htmlFor="fixedCostId">Custo Fixo (Overhead)</Label>
        <Select id="fixedCostId" name="fixedCostId" defaultValue="">
          <option value="">Nenhum</option>
          {fixedCosts.map(fc => (
            <option key={fc.id} value={fc.id}>{fc.code ? `${fc.code} - ${fc.description}` : fc.description}</option>
          ))}
        </Select>
      </div>
    </div>
  );
}