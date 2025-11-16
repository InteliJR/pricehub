import type { Product } from '@/types';
import { IconButton } from '@/components/common/IconButton';
import { Text } from '@/components/common/Text';
import { FiEdit, FiTrash2 } from 'react-icons/fi';

interface ProductTableRowProps {
    product: Product;
    onEdit: () => void;
    onDelete: () => void;
}

const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: currency === 'Real' ? 'BRL' : 'USD',
    }).format(value);
};

export function ProductTableRow({ product, onEdit, onDelete }: ProductTableRowProps) {
    return (
        <tr className="border-b border-gray-200 odd:bg-white even:bg-gray-50 hover:bg-blue-50">
            <td className="px-4 py-3 whitespace-nowrap">
                <Text variant="caption" className="text-gray-700">{product.code}</Text>
            </td>

            <td className="px-4 py-3 whitespace-nowrap">
                <Text variant="caption" className="font-medium text-gray-900">
                    {product.description}
                </Text>
            </td>

            <td className="px-4 py-3 whitespace-nowrap">
                <Text variant="caption">{product.group}</Text>
            </td>

            <td className="px-4 py-3 whitespace-nowrap">
                <Text variant="caption">
                    {formatCurrency(product.price, product.currency)}
                </Text>
            </td>

            <td className="px-4 py-3 whitespace-nowrap">
                <Text variant="caption">{product.currency}</Text>
            </td>

            <td className="px-4 py-3 whitespace-nowrap">
                <Text variant="caption">
                    {formatCurrency(product.overhead, 'Real')}
                </Text>
            </td>


            <td className="px-4 py-3 whitespace-nowrap text-sm">
                <div className="flex items-center space-x-2">
                    <IconButton icon={FiEdit} aria-label="Editar produto" onClick={onEdit} />
                    <IconButton icon={FiTrash2} aria-label="Excluir produto" onClick={onDelete} />
                </div>
            </td>
        </tr>
    );
}