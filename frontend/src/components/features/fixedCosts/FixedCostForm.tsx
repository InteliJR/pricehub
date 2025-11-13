// src/components/features/fixedCosts/FixedCostForm.tsx

import React from 'react';
import type { FixedCost } from '@/types';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';

interface FixedCostFormProps {
  cost?: FixedCost;
}

export function FixedCostForm({ cost }: FixedCostFormProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      
      {/* Campo Descrição */}
      <div className="sm:col-span-2">
        <Label htmlFor="fc_description">Descrição</Label>
        <Input 
          id="fc_description" 
          placeholder="Insira a descrição" 
          defaultValue={cost?.description}
        />
      </div>
      
      {/* Campo Código */}
      <div className="sm:col-span-1">
        <Label htmlFor="fc_code">Código (Opcional)</Label>
        <Input 
          id="fc_code" 
          placeholder="Insira o código" 
          defaultValue={cost?.code}
        />
      </div>
      
      {/* Campo % Gastos a Considerar */}
      <div className="sm:col-span-1">
        <Label htmlFor="fc_percentage">% Gastos a Considerar</Label>
        <Input 
          id="fc_percentage" 
          type="number"
          placeholder="100" 
          defaultValue={cost?.percentage}
        />
      </div>

      {/* --- CUSTOS --- */}
      
      {/* Campo Pessoal */}
      <div className="sm:col-span-1">
        <Label htmlFor="fc_personnel">Pessoal</Label>
        <Input 
          id="fc_personnel" 
          type="number"
          step="0.01"
          placeholder="0.00" 
          defaultValue={cost?.personnel}
        />
      </div>
      
      {/* Campo Outros */}
      <div className="sm:col-span-1">
        <Label htmlFor="fc_others">Outros</Label>
        <Input 
          id="fc_others" 
          type="number"
          step="0.01"
          placeholder="0.00" 
          defaultValue={cost?.others}
        />
      </div>

      {/* Campo Depreciação */}
      <div className="sm:col-span-1">
        <Label htmlFor="fc_depreciation">Depreciação</Label>
        <Input 
          id="fc_depreciation" 
          type="number"
          step="0.01"
          placeholder="0.00" 
          defaultValue={cost?.depreciation}
        />
      </div>
    </div>
  );
}