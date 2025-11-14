// src/components/common/Select.tsx

import React from 'react';
import { twMerge } from 'tailwind-merge';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

export function Select({ children, className, ...props }: SelectProps) {
  const baseStyle = "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2";

  const combinedClasses = twMerge(baseStyle, className);

  return (
    <select className={combinedClasses} {...props}>
      {children}
    </select>
  );
}