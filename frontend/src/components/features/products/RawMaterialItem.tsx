import { Text } from '@/components/common/Text';
import { FiPaperclip } from 'react-icons/fi';

export function RawMaterialItem() {
  return (
    <li className="flex items-center justify-between py-2">
      <div className="flex items-center space-x-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100 text-gray-400">
          <FiPaperclip className="h-5 w-5" /> 
        </div>
        <div>
          <Text as="span" variant="caption" className="font-semibold text-gray-800">
            Matéria prima X
          </Text>
          <Text as="p" variant="small" className="text-gray-500">
            Lorem ipsum
          </Text>
        </div>
      </div>
      <Text as="span" variant="caption" className="text-gray-600">
        1x
      </Text>
    </li>
  );
}