import { SecondaryButton } from '@/components/common/SecondaryButton'; 
import { Heading } from '@/components/common/Heading';
import { FiFilter } from 'react-icons/fi';

export function PageHeader() {
  return (
    <div className="flex justify-between items-center mb-6">
      <Heading as="h1" variant="title">
       Frete
      </Heading>
      <SecondaryButton variant="secondary" leftIcon={FiFilter}>
        Filtro
      </SecondaryButton>
    </div>
  );
}