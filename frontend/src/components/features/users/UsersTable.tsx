// src/components/features/users/UsersTable.tsx

import React from 'react';
import type { User } from '@/types';
import { UserTableRow } from './UserTableRow';
import { TableHeaderCell } from '@/components/common/ProductTableHeaderCell';

interface UsersTableProps {
  users: User[];
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
}

export function UsersTable({ 
  users, 
  onEditUser, 
  onDeleteUser 
}: UsersTableProps) {
  return (
    <div className="bg-white shadow-sm rounded-lg overflow-x-auto">
      <table className="w-full min-w-max">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <TableHeaderCell sortable>Usuário</TableHeaderCell>
            <TableHeaderCell sortable>Filial</TableHeaderCell>
            <TableHeaderCell sortable>Status</TableHeaderCell>
            <TableHeaderCell>Função</TableHeaderCell>
            <TableHeaderCell>Ação</TableHeaderCell>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <UserTableRow 
              key={user.id} 
              user={user} 
              onEdit={() => onEditUser(user)}
              onDelete={() => onDeleteUser(user)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}