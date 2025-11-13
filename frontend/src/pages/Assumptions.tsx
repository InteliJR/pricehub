import { useState } from 'react'; 
import type { AssumptionItem } from '@/types';
import { Heading } from '@/components/common/Heading';
import { AssumptionsTable } from '@/components/features/Assumptions/AssumptionsTable';
import { RateCard } from '@/components/features/Assumptions/RateCard';

// Mock data (items)
const mockItems: AssumptionItem[] = [
  { id: '1', item: 'PIS', group1: 1.650, group2: 1.650 },
  { id: '2', item: 'COFINS', group1: 7.600, group2: 7.600 },
  { id: '7', item: 'TAXA DE FINANCIAMENTO DAS VENDAS - % MÊS', group1: 1.760, group2: 1.760 },
];

export default function Assumptions() {
  const [items] = useState(mockItems);
  
  return (
    <>
      <Heading as="h1" variant="title" className="mb-6">
        Premissas
      </Heading>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2">
          <AssumptionsTable items={items} />
        </div>

        <div className="lg:col-span-1 flex flex-col space-y-8">
          <RateCard 
            title="Taxa utilizada para cálculo dos ganhos e perdas financeiras nas compras de materiais e serviços (em % ao mês)"
            value="0,000%" 
          />
          <RateCard 
            title="Taxa de administração O.A. (será utilizada para acréscimo no OVERHEAD, sobre os custos da simulação de preço api)"
            value="0,000%" 
          />
        </div>

      </div>
    </>
  );
}