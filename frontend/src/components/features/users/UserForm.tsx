// src/components/features/users/UserForm.tsx

import React from 'react';
import type { User } from '@/types';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Select } from '@/components/common/Select';

interface UserFormProps {
  user?: User;
}

export function UserForm({ user }: UserFormProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      
      {/* Campo Email */}
      <div className="sm:col-span-2">
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email" 
          type="email"
          placeholder="exemplo@gmail.com" 
          defaultValue={user?.email}
        />
      </div>
      
      {/* Campo Filial */}
      <div className="sm:col-span-1">
        <Label htmlFor="branch">Filial</Label>
        <Input 
          id="branch" 
          placeholder="A" 
          defaultValue={user?.branch}
        />
      </div>

      {/* Campo Função (Role) */}
      <div className="sm:col-span-1">
        <Label htmlFor="role">Função</Label>
        <Select id="role" defaultValue={user?.role}>
          <option value="Comercial">Comercial</option>
          <option value="Logística">Logística</option>
          <option value="Admin">Admin</option>
        </Select>
      </div>
      
      {/* Campo Status */}
      <div className="sm:col-span-1">
        <Label htmlFor="status">Status</Label>
        <Select id="status" defaultValue={user?.status}>
          <option value="Ativo">Ativo</option>
          <option value="Inativo">Inativo</option>
        </Select>
      </div>

    </div>
  );
}