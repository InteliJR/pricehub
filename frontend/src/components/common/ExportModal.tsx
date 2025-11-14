import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Checkbox } from './Checkbox'; // Importe o componente criado

type ColumnOption = {
  key: string;
  label: string;
};

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: { limit: number; columns: string[] }) => void;
  defaultColumns: ColumnOption[];
}

export function ExportModal({
  isOpen,
  onClose,
  onConfirm,
  defaultColumns,
}: ExportModalProps) {
  const [limit, setLimit] = useState(500);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    defaultColumns.map((col) => col.key) // Começa com todas selecionadas
  );

  // Reseta o estado quando o modal é fechado
  useEffect(() => {
    if (isOpen) {
      setLimit(500);
      setSelectedColumns(defaultColumns.map((col) => col.key));
    }
  }, [isOpen, defaultColumns]);

  const handleColumnChange = (key: string, checked: boolean) => {
    setSelectedColumns((prev) =>
      checked ? [...prev, key] : prev.filter((col) => col !== key)
    );
  };

  const handleSubmit = () => {
    if (selectedColumns.length === 0) {
      // Evita exportar um arquivo vazio
      toast.error('Selecione pelo menos uma coluna para exportar.');
      return;
    }
    onConfirm({ limit, columns: selectedColumns });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configurar Exportação CSV">
      <div className="space-y-6">
        {/* 1. Limite de Linhas */}
        <Input
          id="limit"
          label="Limite de linhas"
          type="number"
          min="1"
          value={limit}
          onChange={(e) => setLimit(Math.max(1, Number(e.target.value)))}
        />

        {/* 2. Seleção de Colunas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Colunas para incluir
          </label>
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 p-4">
            {defaultColumns.map((col) => (
              <Checkbox
                key={col.key}
                id={col.key}
                label={col.label}
                checked={selectedColumns.includes(col.key)}
                onChange={(e) => handleColumnChange(col.key, e.target.checked)}
              />
            ))}
          </div>
        </div>

        {/* 3. Botões de Ação */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" onClick={handleSubmit}>
            Gerar CSV
          </Button>
        </div>
      </div>
    </Modal>
  );
}