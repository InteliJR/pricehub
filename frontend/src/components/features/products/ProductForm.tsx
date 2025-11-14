// src/components/features/products/ProductForm.tsx

import React from 'react';
import type { Product } from '@/types';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Textarea } from '@/components/common/Textarea';
import { Select } from '@/components/common/Select'; // 1. Importar o Select

interface ProductFormProps {
  product?: Product;
}

export function ProductForm({ product }: ProductFormProps) {
  return (
    // 2. Adicionado um grid para melhor layout dos campos
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      
      {/* Campo Código */}
      <div className="sm:col-span-1">
        <Label htmlFor="code">Código</Label>
        <Input 
          id="code" 
          placeholder="Insira o código" 
          defaultValue={product?.code}
        />
      </div>
      
      {/* Campo Grupo */}
      <div className="sm:col-span-1">
        <Label htmlFor="group">Grupo</Label>
        <Input 
          id="group" 
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
          placeholder="Insira a descrição" 
          rows={3} 
          defaultValue={product?.description}
        />
      </div>
      
      {/* Campo Preço */}
      <div className="sm:col-span-1">
        <Label htmlFor="price">Preço</Label>
        <Input 
          id="price" 
          type="number"
          step="0.01"
          placeholder="0.00" 
          defaultValue={product?.price}
        />
      </div>
      
      {/* Campo Moeda */}
      <div className="sm:col-span-1">
        <Label htmlFor="currency">Moeda</Label>
        <Select id="currency" defaultValue={product?.currency}>
          <option value="Real">Real</option>
          <option value="Dólar">Dólar</option>
        </Select>
      </div>

      {/* Campo Overhead */}
      <div className="sm:col-span-2">
        <Label htmlFor="overhead">Overhead a considerar</Label>
        <Input 
          id="overhead" 
          type="number"
          step="0.01"
          placeholder="0.00" 
          defaultValue={product?.overhead}
        />
      </div>
    </div>
  );
}