// src/components/features/taxes/RawMaterialTaxForm.tsx

import { useForm } from "react-hook-form";
import type { RawMaterialTax } from "@/types/taxes";
import type { CreateRawMaterialTaxDTO } from "@/api/taxes";
import { Input } from "@/components/common/Input";
import { Label } from "@/components/common/Label";
import { Select } from "@/components/common/Select";
import { Checkbox } from "@/components/common/Checkbox";
import { Text } from "@/components/common/Text";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";

interface RawMaterialTaxFormProps {
  tax?: RawMaterialTax | null;
  onSubmit: (data: CreateRawMaterialTaxDTO) => void;
  isLoading?: boolean;
}

const validateNotEmpty = (value: string | undefined): boolean => {
  return !!value && value.trim().length > 0;
};

export function RawMaterialTaxForm({
  tax,
  onSubmit,
  isLoading,
}: RawMaterialTaxFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateRawMaterialTaxDTO>({
    defaultValues: tax
      ? {
          name: tax.name,
          rate: tax.rate,
          recoverable: tax.recoverable,
          rawMaterialId: tax.rawMaterialId,
        }
      : {
          name: "",
          rate: 0,
          recoverable: false,
          rawMaterialId: "",
        },
  });

  // Buscar matérias-primas disponíveis
  const { data: rawMaterialsData, isLoading: isLoadingRawMaterials } = useQuery({
    queryKey: ["raw-materials-all"],
    queryFn: async () => {
      const { data } = await apiClient.get("/raw-materials", {
        params: { page: 1, limit: 1000 },
      });
      return data;
    },
  });

  const rate = Number(watch("rate")) || 0;
  const recoverable = watch("recoverable");

  const handleFormSubmit = (data: CreateRawMaterialTaxDTO) => {
    const cleanedData = {
      ...data,
      name: data.name.trim(),
      rate: Number(data.rate),
    };
    onSubmit(cleanedData);
  };

  return (
    <form
      id="raw-material-tax-form"
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
          placeholder="Ex: PIS, COFINS, ICMS, IPI, IR, CSLL"
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

      {/* Recuperável */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <Checkbox
          id="recoverable"
          label="Imposto recuperável"
          {...register("recoverable")}
        />
        <Text className="text-xs text-gray-500 mt-2 ml-6">
          Marque esta opção se o imposto pode ser recuperado posteriormente
        </Text>
      </div>

      {/* Matéria-Prima Associada */}
      <div>
        <Label htmlFor="rawMaterialId">
          Matéria-Prima Associada <span className="text-red-500">*</span>
        </Label>
        <Select
          id="rawMaterialId"
          disabled={isLoadingRawMaterials || !!tax}
          {...register("rawMaterialId", {
            required: "Selecione uma matéria-prima",
          })}
          error={errors.rawMaterialId?.message}
        >
          <option value="">Selecione uma matéria-prima</option>
          {rawMaterialsData?.data?.map((rawMaterial: any) => (
            <option key={rawMaterial.id} value={rawMaterial.id}>
              {rawMaterial.code} - {rawMaterial.name}
            </option>
          ))}
        </Select>
        {tax && (
          <Text className="text-xs text-gray-500 mt-1">
            A matéria-prima não pode ser alterada após a criação
          </Text>
        )}
      </div>

      {/* Preview */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
        <Text className="font-semibold text-blue-900">Preview</Text>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Text className="text-gray-600">Taxa aplicada:</Text>
            <Text className="font-bold text-lg text-blue-900">
              {rate.toFixed(2)}%
            </Text>
          </div>
          <div>
            <Text className="text-gray-600">Recuperável:</Text>
            <Text className={`font-semibold ${recoverable ? 'text-green-700' : 'text-gray-700'}`}>
              {recoverable ? "Sim" : "Não"}
            </Text>
          </div>
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