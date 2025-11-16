import { useState, useEffect } from 'react';
import { Label } from '@/components/common/Label';
import { Input } from '@/components/common/Input';
import { FiSearch } from 'react-icons/fi';
import { useRawMaterialsQuery, mapApiToUi } from '@/api/rawMaterials';

interface RawMaterialSelectorProps {
  onChange: (items: { rawMaterialId: string; quantity: number }[]) => void;
}

export function RawMaterialSelector({ onChange }: RawMaterialSelectorProps) {
  const { data } = useRawMaterialsQuery({ page: 1, limit: 100, search: '' });
  const materials = (data?.data ?? []).map(mapApiToUi);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Record<string, number>>({});

  const filtered = materials.filter(m =>
    m.description.toLowerCase().includes(search.toLowerCase()) ||
    m.code.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const items = Object.entries(selected).map(([id, qty]) => ({ rawMaterialId: id, quantity: qty }));
    onChange(items);
  }, [selected, onChange]);

  const toggle = (id: string) => {
    setSelected(prev => {
      if (prev[id]) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: 1 };
    });
  };

  const updateQty = (id: string, qty: number) => {
    setSelected(prev => ({ ...prev, [id]: qty <= 0 ? 1 : qty }));
  };

  return (
    <div className="flex flex-col space-y-4">
      <div>
        <Label htmlFor="rm-search">Matérias-primas</Label>
        <Input
          id="rm-search"
          placeholder="Buscar"
          leftIcon={FiSearch}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <ul className="h-48 overflow-y-auto divide-y divide-gray-200 pr-2">
        {filtered.map(m => {
          const isSelected = !!selected[m.id];
          return (
            <li
              key={m.id}
              className="flex items-center justify-between py-2 cursor-pointer"
              onClick={() => toggle(m.id)}
            >
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-800">{m.description}</span>
                <span className="text-xs text-gray-500">{m.code}</span>
              </div>
              {isSelected ? (
                <Input
                  type="number"
                  className="w-20"
                  value={selected[m.id]}
                  onClick={e => e.stopPropagation()}
                  onChange={e => updateQty(m.id, Number(e.target.value))}
                  min={0.01}
                  step={0.01}
                />
              ) : (
                <span className="text-xs text-gray-400">Adicionar</span>
              )}
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="py-2 text-sm text-gray-500">Nenhuma matéria-prima encontrada</li>
        )}
      </ul>
      {/* Campo oculto para submissão via form se necessário */}
      <input
        type="hidden"
        name="rawMaterials"
        value={JSON.stringify(
          Object.entries(selected).map(([id, qty]) => ({ rawMaterialId: id, quantity: qty }))
        )}
      />
    </div>
  );
}