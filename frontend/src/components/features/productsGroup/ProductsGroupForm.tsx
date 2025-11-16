import React from 'react';
import type { ProductsGroup } from '@/types';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Textarea } from '@/components/common/Textarea';
import { Select } from '@/components/common/Select'; 

interface ProductsGroupFormProps {
  group?: ProductsGroup;
}

export function ProductsGroupForm({ group }: ProductsGroupFormProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-1">
        <Label htmlFor="pg_product">Produto</Label>
        <Input
          id="pg_product"
          placeholder="Insira o nome do produto"
          defaultValue={group?.product}
        />
      </div>

      <div className="sm:col-span-1">
        <Label htmlFor="pg_volume">% do volume</Label>
        <Input
          id="pg_volume"
          type="number"
          step="1"
          min="0"
          max="100"
          placeholder="0"
          defaultValue={group?.volume}
        />
      </div>
    </div>
  );
}
