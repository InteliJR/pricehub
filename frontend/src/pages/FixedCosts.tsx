import { useState } from 'react';
import type { FixedCost, OverheadGroup } from '@/types'; 
import { PageHeader } from '@/components/features/fixedCosts/PageHeader';
import { FixedCostsSummaryTable } from '@/components/features/fixedCosts/FixedCostsSummaryTable';
import { OverheadGroupsTable } from '@/components/features/fixedCosts/OverheadGroupsTable';

import { FixedCostModal } from '@/components/features/fixedCosts/FixedCostModal'; 

const mockFixedCosts: FixedCost[] = [
  { id: '1', description: 'DESPESAS COM PESSOAL', code: '', personnel: 53188.59, percentage: 100 },
  { id: '2', description: 'GASTOS GERAIS API', code: '', others: 49913.50, percentage: 100 },
  { id: '3', description: 'PRÓ LABORE ***', code: '', percentage: 100 },
];

const mockOverheadGroups: OverheadGroup[] = [
  { id: 'g1', groupName: 'Grupo 01', unit: 'Quilograma', salesVolume: 165000, overheadValue: 0.365 },
  { id: 'g2', groupName: 'Grupo 02', unit: 'Quilograma', salesVolume: 145000, overheadValue: 0.365 },
  { id: 'g3', groupName: 'Grupo 03', unit: 'Quilograma', salesVolume: 130000, overheadValue: 0.365 },
  { id: 'g4', groupName: 'Grupo 04', unit: 'Quilograma', salesVolume: 130000, overheadValue: 0.365 },
  { id: 'g5', groupName: 'Grupo 05', unit: 'Quilograma', salesVolume: 130000, overheadValue: 0.365 },
  { id: 'g6', groupName: 'Grupo 06', unit: 'Quilograma', salesVolume: 130000, overheadValue: 0.365 },
  { id: 'g7', groupName: 'Grupo 07', unit: 'Quilograma', salesVolume: 130000, overheadValue: 0.365 },
];

export default function FixedCosts() {
  const [costs] = useState(mockFixedCosts);
  const [groups] = useState(mockOverheadGroups);
  
  // Lógica para o modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenCreateModal = () => {
    setIsModalOpen(true); // Conecta a abertura do modal
  };

  const handleCloseModal = () => {
    setIsModalOpen(false); // Conecta o fechamento do modal
  };

  return (
    <> 
      {/* Passa a função de abertura para o header */}
      <PageHeader onNewFixedCostClick={handleOpenCreateModal} />
      
      {/* Primeira Tabela */}
      <FixedCostsSummaryTable costs={costs} />
      
      {/* Segunda Tabela */}
      <OverheadGroupsTable groups={groups} />

      {/* Renderiza o modal (ele só aparece quando 'isOpen' é true) */}
      <FixedCostModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
      />
    </>
  );
}