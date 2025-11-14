import type { UserStatus } from '@/types';
import { twMerge } from 'tailwind-merge';

interface StatusBadgeProps {
  status: UserStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const baseStyle = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

  // Define cores diferentes para cada status
  const statusStyles = {
    Ativo: 'bg-green-100 text-green-800',
    Inativo: 'bg-red-100 text-red-800',
  };

  const combinedClasses = twMerge(baseStyle, statusStyles[status]);

  return (
    <span className={combinedClasses}>
      {status}
    </span>
  );
}