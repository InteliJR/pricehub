import React from 'react';
import type { IconType } from 'react-icons';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: IconType;
}

export function Input({ leftIcon: LeftIcon, className, ...props }: InputProps) {
  const baseStyle = "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm";
  const withIconStyle = "pl-10"; 
  const withoutIconStyle = "px-3 py-2";

  const combinedClasses = twMerge(
    baseStyle,
    LeftIcon ? withIconStyle : withoutIconStyle,
    className
  );

  return (
    <div className="relative">
      {LeftIcon && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <LeftIcon className="h-5 w-5 text-gray-400" />
        </div>
      )}
      <input className={combinedClasses} {...props} />
    </div>
  );
}