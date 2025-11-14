// src/components/features/fixedCosts/PageHeader.tsx

import React from 'react';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { Heading } from '@/components/common/Heading';
import { FiPlus } from 'react-icons/fi';

interface PageHeaderProps {
  onNewFixedCostClick: () => void;
}

export function PageHeader({ onNewFixedCostClick }: PageHeaderProps) {
  return (
    <div className="flex flex-col items-start mb-6">
      <Heading as="h1" variant="title" className="mb-4">
        Custos fixos e Overhead
      </Heading>
      <SecondaryButton 
        variant="primary" 
        leftIcon={FiPlus}
        onClick={onNewFixedCostClick}
      >
        Novo custo fixo
      </SecondaryButton>
    </div>
  );
}