import React from 'react';
import { IconButton } from './IconButton';
import { Heading } from './Heading';
import { FiX } from 'react-icons/fi';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode; 
  footer?: React.ReactNode; 
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose} 
    >
      
      <div 
        className="relative w-full max-w-3xl rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <Heading as="h2" variant="subtitle">{title}</Heading>
          <IconButton icon={FiX} aria-label="Fechar modal" onClick={onClose} />
        </div>
        
        <div className="p-6">
          {children}
        </div>
        
        {footer && (
          <div className="border-t border-gray-200 p-6 flex justify-end">
            {footer}
          </div>
        )}
        
      </div>
    </div>
  );
}