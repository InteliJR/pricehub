// src/components/features/rawMaterials/RawMaterialForm.tsx

import React from 'react';
import type { RawMaterial } from '@/types';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Textarea } from '@/components/common/Textarea';
import { Select } from '@/components/common/Select';
import { MEASUREMENT_UNITS, CURRENCIES } from '@/lib/constants';
import type { TaxApi } from '@/api/taxes';
import type { FreightApi } from '@/api/freights';

interface RawMaterialFormProps {
  material?: RawMaterial;
  taxes?: TaxApi[];
  freights?: FreightApi[];
  defaults?: {
    measurementUnit?: string;
    inputGroup?: string;
    paymentTerm?: number;
    price?: number;
    currency?: 'BRL' | 'USD' | 'EUR';
    additionalCosts?: number;
    taxId?: string;
    freightId?: string;
  };
}

export function RawMaterialForm({ material, taxes = [], freights = [], defaults }: RawMaterialFormProps) {
  return (
    // 2. Adicionado um grid para layout
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      
      {/* Campo Código */}
      <div className="sm:col-span-1">
        <Label htmlFor="raw_code">Código</Label>
        <Input 
          id="raw_code" 
          name="raw_code"
          placeholder="Insira o código" 
          defaultValue={material?.code}
        />
      </div>
      
      {/* Campo Nome */}
      <div className="sm:col-span-1">
        <Label htmlFor="raw_name">Nome</Label>
        <Input 
          id="raw_name" 
          name="raw_name"
          placeholder="Insira o nome" 
          defaultValue={material?.name} 
        />
      </div>
      
      {/* Campo Descrição */}
      <div className="sm:col-span-2">
        <Label htmlFor="raw_description">Descrição</Label>
        <Textarea 
          id="raw_description" 
          name="raw_description"
          placeholder="Insira a descrição" 
          rows={3} 
          defaultValue={material?.description}
        />
      </div>

      {/* Unidade de Medida */}
      <div className="sm:col-span-1">
        <Label htmlFor="raw_measurementUnit">Unidade de Medida</Label>
        <Select id="raw_measurementUnit" name="raw_measurementUnit" defaultValue={defaults?.measurementUnit || 'KG'}>
          {MEASUREMENT_UNITS.map((u) => (
            <option key={u.value} value={u.value}>{u.label}</option>
          ))}
        </Select>
      </div>

      {/* Grupo de insumo */}
      <div className="sm:col-span-1">
        <Label htmlFor="raw_inputGroup">Grupo</Label>
        <Input id="raw_inputGroup" name="raw_inputGroup" placeholder="Ex.: Resinas" defaultValue={defaults?.inputGroup} />
      </div>
      
      {/* Campo Preço */}
      <div className="sm:col-span-1">
        <Label htmlFor="raw_price">Preço</Label>
        <Input 
          id="raw_price" 
          name="raw_price"
          type="number"
          step="0.01"
          placeholder="0.00" 
          defaultValue={defaults?.price ?? material?.price}
        />
      </div>
      
      {/* Campo Moeda */}
      <div className="sm:col-span-1">
        <Label htmlFor="raw_currency">Moeda</Label>
        <Select id="raw_currency" name="raw_currency" defaultValue={defaults?.currency || 'BRL'}>
          {CURRENCIES.filter((c) => c.value === 'BRL' || c.value === 'USD').map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </Select>
      </div>
      
      {/* Campo Prazo (dias) */}
      <div className="sm:col-span-1">
        <Label htmlFor="raw_paymentTerm">Prazo de Pagamento (dias)</Label>
        <Input id="raw_paymentTerm" name="raw_paymentTerm" type="number" min={0} placeholder="30" defaultValue={defaults?.paymentTerm ?? 30} />
      </div>
      
      {/* Campo Custos Adicionais */}
      <div className="sm:col-span-1">
        <Label htmlFor="raw_additionalCosts">Custos Adicionais</Label>
        <Input 
          id="raw_additionalCosts" 
          name="raw_additionalCosts"
          type="number"
          step="0.01"
          placeholder="0.00" 
          defaultValue={defaults?.additionalCosts ?? material?.additionalCosts}
        />
      </div>

      {/* Seleção de Imposto */}
      <div className="sm:col-span-1">
        <Label htmlFor="raw_taxId">Imposto</Label>
        <Select id="raw_taxId" name="raw_taxId" defaultValue={defaults?.taxId || ''}>
          <option value="" disabled>Selecione...</option>
          {taxes.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </Select>
      </div>

      {/* Seleção de Frete */}
      <div className="sm:col-span-1">
        <Label htmlFor="raw_freightId">Frete</Label>
        <Select id="raw_freightId" name="raw_freightId" defaultValue={defaults?.freightId || ''}>
          <option value="" disabled>Selecione...</option>
          {freights.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </Select>
      </div>
    </div>
  );
}