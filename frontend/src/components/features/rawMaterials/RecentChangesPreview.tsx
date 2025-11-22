// src/components/features/rawMaterials/RecentChangesPreview.tsx

import { useRecentChangesQuery } from "@/api/rawMaterials";
import { Text } from "@/components/common/Text";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FiClock } from "react-icons/fi";

export function RecentChangesPreview() {
  const { data: recentChanges, isLoading, isError } = useRecentChangesQuery();

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      code: "Código",
      name: "Nome",
      description: "Descrição",
      measurementUnit: "Unidade de Medida",
      inputGroup: "Grupo de Insumo",
      paymentTerm: "Prazo de Pagamento",
      acquisitionPrice: "Preço de Aquisição",
      currency: "Moeda",
      priceConvertedBrl: "Preço em BRL",
      additionalCost: "Custo Adicional",
      freightId: "Frete",
    };
    return labels[field] || field;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <FiClock className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Últimas Alterações
          </h3>
        </div>
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (isError) {
    return null; // Não mostrar nada em caso de erro
  }

  if (!recentChanges || recentChanges.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <FiClock className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Últimas Alterações
          </h3>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <Text className="text-gray-500 text-sm">
            Nenhuma alteração recente registrada
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <FiClock className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Últimas Alterações
        </h3>
        <span className="ml-auto text-sm text-gray-500">
          {recentChanges.length} {recentChanges.length === 1 ? "registro" : "registros"}
        </span>
      </div>

      <div className="space-y-3">
        {recentChanges.map((log) => (
          <div
            key={log.id}
            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {/* Indicador visual */}
            <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />

            {/* Conteúdo */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <Text variant="caption" className="font-semibold text-gray-900">
                  {getFieldLabel(log.field)}
                </Text>
                <Text variant="small" className="text-gray-500 flex-shrink-0">
                  {format(new Date(log.changedAt), "dd/MM HH:mm", {
                    locale: ptBR,
                  })}
                </Text>
              </div>

              <div className="flex items-center gap-2 text-xs">
                {log.oldValue && (
                  <>
                    <span className="text-red-600 line-through truncate max-w-[200px]">
                      {log.oldValue}
                    </span>
                    <span className="text-gray-400">→</span>
                  </>
                )}
                {log.newValue && (
                  <span className="text-green-600 font-medium truncate max-w-[200px]">
                    {log.newValue}
                  </span>
                )}
                {!log.oldValue && !log.newValue && (
                  <span className="text-gray-500 italic">Campo limpo</span>
                )}
              </div>

              <Text variant="small" className="text-gray-400 mt-1">
                Por: {log.changedBy}
              </Text>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <Text variant="small" className="text-gray-500 text-center">
          Mostrando as 10 alterações mais recentes em todas as matérias-primas
        </Text>
      </div>
    </div>
  );
}