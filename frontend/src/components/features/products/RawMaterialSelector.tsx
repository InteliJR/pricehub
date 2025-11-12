import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { FiSearch } from 'react-icons/fi';

import { RawMaterialList } from './RawMaterialList';

export function RawMaterialSelector() {
  return (
    <div className="flex flex-col space-y-4">
      
      <div>
        <Label htmlFor="raw-material">Matérias-primas</Label>
        <Input 
          id="raw-material" 
          placeholder="Adicione aqui a matéria prima" 
          leftIcon={FiSearch} 
        />
      </div>
      
      <RawMaterialList />
      
    </div>
  );
}