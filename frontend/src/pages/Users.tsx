import React, { useState } from 'react';
import type { User } from '@/types';
import { Heading } from '@/components/common/Heading';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { UsersActionBar } from '@/components/features/users/UsersActionBar';
import { UsersTable } from '@/components/features/users/UsersTable';
import { UserModal } from '@/components/features/users/UserModal';

// Mock data
const mockUsers: User[] = [
  { id: '1', email: 'camila.alves@gmail.com', branch: 'A', status: 'Ativo', role: 'Comercial' },
  { id: '2', email: 'angela.souza@gmail.com', branch: 'B', status: 'Inativo', role: 'Logística' },
  { id: '3', email: 'fernando.silva@gmail.com', branch: 'C', status: 'Ativo', role: 'Comercial' },
];

export default function Users() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const handleOpenDeleteModal = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };
  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedUser(undefined);
  };
  const handleConfirmDelete = () => {
    if (selectedUser) {
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
    }
    handleCloseDeleteModal();
  };
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  const handleOpenCreateModal = () => {
    setSelectedUser(undefined);
    setModalMode('create');
    setIsModalOpen(true); 
  };
  
  const handleOpenEditModal = (user: User) => {
    setSelectedUser(user);
    setModalMode('edit');
    setIsModalOpen(true); 
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(undefined);
  };

  return (
    <> 
      <Heading as="h1" variant="title" className="mb-6">
        Gestão de usuários
      </Heading>
      
      <UsersActionBar onNewUserClick={handleOpenCreateModal} />
      
      <UsersTable 
        users={users} 
        onEditUser={handleOpenEditModal}
        onDeleteUser={handleOpenDeleteModal}
      />
      
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Excluir Usuário"
        message="Você tem certeza que deseja excluir este usuário?"
      />
      
      <UserModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        mode={modalMode}
        user={selectedUser}
      />
    </>
  );
}