import type { Freight } from '@/types';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';

interface FreightFormProps {
  freight?: Freight;
}

export function FreightForm({ freight }: FreightFormProps) {
  return (
    // 2. Adicionado um grid para layout
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      
      {/* Campo Cidade Origem */}
      <div className="sm:col-span-1">
        <Label htmlFor="raw_code">Cidade de Origem</Label>
        <Input 
          id="raw_origin" 
          placeholder="Insira a cidade de origem" 
          defaultValue={freight?.originCity}
        />
      </div>
      
      {/* Campo Cidade Destino */}
      <div className="sm:col-span-1">
        <Label htmlFor="raw_name">Cidade Destino</Label>
        <Input 
          id="raw_destiny" 
          placeholder="Insira a cidade destino" 
          defaultValue={freight?.destinyCity} 
        />
      </div>
    </div>
  );
}