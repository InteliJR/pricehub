import { RawMaterialItem } from './RawMaterialItem'; // Importa o átomo

export function RawMaterialList() {
  return (
    <ul className="h-40 overflow-y-auto divide-y divide-gray-200 pr-2">
      <RawMaterialItem />
      <RawMaterialItem />
    </ul>
  );
}