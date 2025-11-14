// src/components/features/rawMaterials/RawMaterialForm.tsx

import React from 'react';
import type { RawMaterial } from '@/types';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Textarea } from '@/components/common/Textarea';
import { Select } from '@/components/common/Select'; // 1. Importar o Select

interface RawMaterialFormProps {
  material?: RawMaterial;
}

export function RawMaterialForm({ material }: RawMaterialFormProps) {
  return (
    // 2. Adicionado um grid para layout
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      
      {/* Campo Código */}
      <div className="sm:col-span-1">
        <Label htmlFor="raw_code">Código</Label>
        <Input 
          id="raw_code" 
          placeholder="Insira o código" 
          defaultValue={material?.code}
        />
      </div>
      
      {/* Campo Nome */}
      <div className="sm:col-span-1">
        <Label htmlFor="raw_name">Nome</Label>
        <Input 
          id="raw_name" 
          placeholder="Insira o nome" 
          defaultValue={material?.name} 
        />
      </div>
      
      {/* Campo Descrição */}
      <div className="sm:col-span-2">
        <Label htmlFor="raw_description">Descrição</Label>
        <Textarea 
          id="raw_description" 
          placeholder="Insira a descrição" 
          rows={3} 
          defaultValue={material?.description}
        />
      </div>
      
      {/* Campo Preço */}
      <div className="sm:col-span-1">
        <Label htmlFor="raw_price">Preço</Label>
        <Input 
          id="raw_price" 
          type="number"
          step="0.01"
          placeholder="0.00" 
          defaultValue={material?.price}
        />
      </div>
      
      {/* Campo Moeda */}
      <div className="sm:col-span-1">
        <Label htmlFor="raw_currency">Moeda</Label>
        <Select id="raw_currency" defaultValue={material?.currency}>
          <option value="Real">Real</option>
          <option value="Dólar">Dólar</option>
        </Select>
      </div>
      
      {/* Campo Prazo */}
      <div className="sm:col-span-1">
        <Label htmlFor="raw_deadline">Prazo (Data)</Label>
        <Input 
          id="raw_deadline" 
          type="date"
          // Formatar a data pode ser complexo, 
          // defaultValue aqui é apenas um exemplo simples
          defaultValue={material?.deadline ? new Date(material.deadline).toISOString().split('T')[0] : ''}
        />
      </div>
      
      {/* Campo Custos Adicionais */}
      <div className="sm:col-span-1">
        <Label htmlFor="raw_additionalCosts">Custos Adicionais</Label>
        <Input 
          id="raw_additionalCosts" 
          type="number"
          step="0.01"
          placeholder="0.00" 
          defaultValue={material?.additionalCosts}
        />
      </div>
    </div>
  );
}