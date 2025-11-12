// src/components/features/rawMaterials/RawMaterialForm.tsx

import React from 'react';
import type { RawMaterial } from '@/types';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Textarea } from '@/components/common/Textarea';

interface RawMaterialFormProps {
  material?: RawMaterial;
}

export function RawMaterialForm({ material }: RawMaterialFormProps) {
  return (
    <div className="flex flex-col space-y-4">
      <div>
        <Label htmlFor="name">Nome</Label>
        <Input 
          id="name" 
          placeholder="Insira o nome da matéria-prima" 
          defaultValue={material?.name} 
        />
      </div>
      
      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea 
          id="description" 
          placeholder="Insira a descrição aqui" 
          rows={4} 
          defaultValue={material?.description} 
        />
      </div>
      
      {/* Você pode adicionar os outros campos (Prazo, Preço, etc.) aqui 
          seguindo o mesmo padrão de Label + Input 
      */}
    </div>
  );
}