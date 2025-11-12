import { FiGrid  } from 'react-icons/fi';
import { FaTable } from "react-icons/fa6";


type ViewMode = 'table' | 'grid';

interface ViewToggleProps {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  
  const baseStyle = "flex items-center px-4 py-2 border-b-2 font-medium text-sm transition-colors";
  const activeStyle = "border-black-200 text-blue-800";
  const inactiveStyle = "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300";

  return (
    <div className="flex border-b border-gray-200 mb-4">
      <button
        type="button"
        className={`${baseStyle} ${view === 'table' ? activeStyle : inactiveStyle}`}
        onClick={() => onChange('table')}
      >
        <FaTable className="mr-2 h-5 w-5" />
        Tabela
      </button>

      <button
        type="button"
        className={`${baseStyle} ${view === 'grid' ? activeStyle : inactiveStyle}`}
        onClick={() => onChange('grid')}
      >
        <FiGrid className="mr-2 h-5 w-5" />
        Grid
      </button>
    </div>
  );
}