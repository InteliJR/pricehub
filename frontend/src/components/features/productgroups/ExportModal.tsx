import { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { Checkbox } from '@/components/common/Checkbox';
import type { FindAllProductGroupsQuery } from '@/api/productgroups';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (filters: Partial<FindAllProductGroupsQuery>) => void;
  currentFilters: FindAllProductGroupsQuery;
}

export function ExportModal({
  isOpen,
  onClose,
  onExport,
  currentFilters,
}: ExportModalProps) {
  const [search, setSearch] = useState(currentFilters.search || '');
  const [sortBy, setSortBy] = useState(currentFilters.sortBy || '');
  const [sortOrder, setSortOrder] = useState(currentFilters.sortOrder || 'asc');
  const [limit, setLimit] = useState('');
  const [useCurrentFilters, setUseCurrentFilters] = useState(true);

  useEffect(() => {
    if (isOpen) {
      if (useCurrentFilters) {
        setSearch(currentFilters.search || '');
        setSortBy(currentFilters.sortBy || '');
        setSortOrder(currentFilters.sortOrder || 'asc');
      }
    }
  }, [isOpen, currentFilters, useCurrentFilters]);

  const handleExport = () => {
    const exportFilters: Partial<FindAllProductGroupsQuery> = {};

    if (useCurrentFilters) {
      if (currentFilters.search) exportFilters.search = currentFilters.search;
      if (currentFilters.sortBy) exportFilters.sortBy = currentFilters.sortBy;
      if (currentFilters.sortOrder) exportFilters.sortOrder = currentFilters.sortOrder;
    } else {
      if (search) exportFilters.search = search;
      if (sortBy) exportFilters.sortBy = sortBy as FindAllProductGroupsQuery['sortBy'];
      if (sortOrder) exportFilters.sortOrder = sortOrder as 'asc' | 'desc';
    }

    if (limit) exportFilters.limit = parseInt(limit);

    onExport(exportFilters);
    onClose();
  };

  const footer = (
    <div className="flex justify-end gap-3">
      <Button variant="secondary" onClick={onClose}>
        Cancelar
      </Button>
      <Button onClick={handleExport}>
        Exportar CSV
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Exportar Grupos"
      footer={footer}
    >
      <div className="space-y-4">
        <Checkbox
          label="Usar filtros atuais"
          checked={useCurrentFilters}
          onChange={(e) => setUseCurrentFilters(e.target.checked)}
        />

        {!useCurrentFilters && (
          <>
            <Input
              label="Buscar por nome"
              placeholder="Digite o nome do grupo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <Select
              label="Ordenar por"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="">Nenhum</option>
              <option value="name">Nome</option>
              <option value="volumePercentageByQuantity">% Volume (Quantidade)</option>
              <option value="volumePercentageByValue">% Volume (Valor)</option>
              <option value="averagePrice">Preço Médio</option>
            </Select>

            {sortBy && (
              <Select
                label="Ordem"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="asc">Crescente</option>
                <option value="desc">Decrescente</option>
              </Select>
            )}
          </>
        )}

        <Input
          label="Limite de registros"
          type="number"
          placeholder="Deixe em branco para exportar todos"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          min="1"
        />

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Dica:</strong> O arquivo CSV será gerado com base nos filtros selecionados.
            {useCurrentFilters && currentFilters.search && (
              <span className="block mt-1">
                Filtro ativo: "{currentFilters.search}"
              </span>
            )}
          </p>
        </div>
      </div>
    </Modal>
  );
}