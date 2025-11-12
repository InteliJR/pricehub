import type { Product } from '@/types';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Textarea } from '@/components/common/Textarea';

interface ProductFormProps {
  product?: Product;
}

export function ProductForm({ product }: ProductFormProps) {
  return (
    <div className="flex flex-col space-y-4">
      <div>
        <Label htmlFor="code">Código</Label>
        <Input 
          id="code" 
          placeholder="Insira o código do produto aqui" 
          defaultValue={product?.code}

        />
      </div>
      
      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea 
          id="description" 
          placeholder="Insira a descrição aqui" 
          rows={4} 
          defaultValue={product?.description} 
        />
      </div>
    </div>
  );
}