// src/components/features/taxes/FreightTaxForm.tsx

import { useForm } from "react-hook-form";
import type { FreightTax } from "@/types/taxes";
import type { CreateFreightTaxDTO } from "@/api/taxes";
import { Input } from "@/components/common/Input";
import { Label } from "@/components/common/Label";
import { Select } from "@/components/common/Select";
import { Text } from "@/components/common/Text";
import { useFreightsQuery } from "@/api/freights";

interface FreightTaxFormProps {
  tax?: FreightTax | null;
  onSubmit: (data: CreateFreightTaxDTO) => void;
  isLoading?: boolean;
}

const validateNotEmpty = (value: string | undefined): boolean => {
  return !!value && value.trim().length > 0;
};

export function FreightTaxForm({
  tax,
  onSubmit,
  isLoading,
}: FreightTaxFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateFreightTaxDTO>({
    defaultValues: tax
      ? {
          name: tax.name,
          rate: tax.rate,
          freightId: tax.freightId,
        }
      : {
          name: "",
          rate: 0,
          freightId: "",
        },
  });

  // Buscar fretes disponíveis
  const { data: freightsData, isLoading: isLoadingFreights } = useFreightsQuery({
    page: 1,
    limit: 1000, // Buscar todos para o select
  });

  const rate = Number(watch("rate")) || 0;

  const handleFormSubmit = (data: CreateFreightTaxDTO) => {
    const cleanedData = {
      ...data,
      name: data.name.trim(),
      rate: Number(data.rate),
    };
    onSubmit(cleanedData);
  };

  return (
    <form
      id="freight-tax-form"
      onSubmit={handleSubmit(handleFormSubmit)}
      className="max-h-[70vh] overflow-y-auto px-2 space-y-6"
    >
      {/* Nome do Imposto */}
      <div>
        <Label htmlFor="name">
          Nome do Imposto <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          placeholder="Ex: ICMS, PIS, COFINS"
          maxLength={40}
          {...register("name", {
            required: "Nome do imposto é obrigatório",
            validate: {
              notEmpty: (value) =>
                validateNotEmpty(value) || "Nome não pode conter apenas espaços",
            },
            minLength: { 
              value: 2, 
              message: "Nome deve ter no mínimo 2 caracteres" 
            },
            maxLength: { 
              value: 40, 
              message: "Nome deve ter no máximo 40 caracteres" 
            },
          })}
          error={errors.name?.message}
        />
        <Text className="text-xs text-gray-400 mt-1">
          Máximo de 40 caracteres
        </Text>
      </div>

      {/* Taxa */}
      <div>
        <Label htmlFor="rate">
          Taxa (%) <span className="text-red-500">*</span>
        </Label>
        <div className="flex gap-2 items-center">
          <Input
            id="rate"
            type="number"
            step="0.01"
            min="0.01"
            max="100"
            placeholder="0.00"
            {...register("rate", {
              required: "Taxa é obrigatória",
              min: { 
                value: 0.01, 
                message: "Taxa deve ser maior que 0%" 
              },
              max: { 
                value: 100, 
                message: "Taxa deve ser no máximo 100%" 
              },
              valueAsNumber: true,
            })}
            error={errors.rate?.message}
          />
          <span className="text-lg font-bold text-gray-700">%</span>
        </div>
        <Text className="text-xs text-gray-400 mt-1">
          Taxa entre 0,01% e 100%
        </Text>
      </div>

      {/* Frete Associado */}
      <div>
        <Label htmlFor="freightId">
          Frete Associado <span className="text-red-500">*</span>
        </Label>
        <Select
          id="freightId"
          disabled={isLoadingFreights || !!tax}
          {...register("freightId", {
            required: "Selecione um frete",
          })}
          error={errors.freightId?.message}
        >
          <option value="">Selecione um frete</option>
          {freightsData?.data.map((freight) => (
            <option key={freight.id} value={freight.id}>
              {freight.name}
            </option>
          ))}
        </Select>
        {tax && (
          <Text className="text-xs text-gray-500 mt-1">
            O frete não pode ser alterado após a criação
          </Text>
        )}
      </div>

      {/* Preview */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
        <Text className="font-semibold text-blue-900">Preview</Text>
        <div className="text-sm">
          <Text className="text-gray-600">Taxa aplicada:</Text>
          <Text className="font-bold text-lg text-blue-900">
            {rate.toFixed(2)}%
          </Text>
        </div>
      </div>

      {/* Validação */}
      {rate <= 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <Text className="text-red-700 text-sm font-medium">
            ⚠️ A taxa deve ser maior que zero para submeter o formulário
          </Text>
        </div>
      )}

      <p className="text-xs text-gray-500 pb-4">
        <span className="text-red-500">*</span> Campos obrigatórios
      </p>
    </form>
  );
}