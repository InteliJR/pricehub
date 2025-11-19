// src/components/features/products/ProductForm.tsx

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import type { Product } from "@/types/products";
import type { CreateProductDTO } from "@/api/products";

import { Input } from "@/components/common/Input";
import { Label } from "@/components/common/Label";
import { Textarea } from "@/components/common/Textarea";
import { SecondaryButton } from "@/components/common/SecondaryButton";
import { Text } from "@/components/common/Text";
import { Autocomplete } from "@/components/common/Autocomplete";

import { FiTrash2 } from "react-icons/fi";
import { formatCurrency } from "@/lib/utils";

import { useRawMaterialsQuery } from "@/api/rawMaterials";
import { useFixedCostsQuery } from "@/api/fixedCosts";
import { useProductGroupsQuery } from "@/api/productgroups";

interface ProductFormProps {
  product?: Product | null;
  onSubmit: (data: CreateProductDTO) => void;
  isLoading?: boolean;
}

const validateNotEmpty = (value: string | undefined): boolean => {
  return !!value && value.trim().length > 0;
};

export function ProductForm({
  product,
  onSubmit,
  isLoading,
}: ProductFormProps) {
  const [rawMaterialSearch, setRawMaterialSearch] = useState("");
  const [fixedCostSearch, setFixedCostSearch] = useState("");
  const [productGroupSearch, setProductGroupSearch] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateProductDTO>({
    defaultValues: product
      ? {
          code: product.code,
          name: product.name,
          description: product.description || "",
          fixedCostId: product.fixedCostId || "",
          productGroupId: product.productGroupId || "",
          rawMaterials: product.productRawMaterials.map((rm) => ({
            rawMaterialId: rm.rawMaterialId,
            quantity: rm.quantity,
          })),
        }
      : {
          code: "",
          name: "",
          description: "",
          fixedCostId: "",
          productGroupId: "",
          rawMaterials: [],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "rawMaterials",
  });

  const { data: rawMaterialsData } = useRawMaterialsQuery({
    page: 1,
    limit: 50,
    search: rawMaterialSearch,
  });

  const { data: fixedCostsData } = useFixedCostsQuery({
    page: 1,
    limit: 50,
    search: fixedCostSearch,
  });

  const { data: productGroupsData } = useProductGroupsQuery({
    page: 1,
    limit: 50,
    search: productGroupSearch,
  });

  const rawMaterials = watch("rawMaterials") || [];
  const selectedFixedCostId = watch("fixedCostId");

  const calculateBasePrice = () => {
    let total = 0;
    rawMaterials.forEach((rm) => {
      const rawMat = rawMaterialsData?.data?.find(
        (r) => r.id === rm.rawMaterialId
      );
      if (rawMat) {
        const quantity = Number(rm.quantity) || 0;
        total += rawMat.priceConvertedBrl * quantity;
      }
    });
    return total;
  };

  const calculatePriceWithTaxesAndFreight = () => {
    let total = 0;
    rawMaterials.forEach((rm) => {
      const rawMat = rawMaterialsData?.data?.find(
        (r) => r.id === rm.rawMaterialId
      );
      if (rawMat) {
        const quantity = Number(rm.quantity) || 0;
        const materialCost = rawMat.priceConvertedBrl * quantity;
        
        const taxes = rawMat.rawMaterialTaxes || [];
        const taxAmount = taxes.reduce((sum, tax) => {
          return sum + materialCost * (Number(tax.rate) / 100);
        }, 0);
        
        const freightCost = rawMat.freight?.unitPrice || 0;
        
        total += materialCost + taxAmount + freightCost * quantity;
      }
    });
    
    if (selectedFixedCostId) {
      const fixedCost = fixedCostsData?.data?.find(
        (fc) => fc.id === selectedFixedCostId
      );
      if (fixedCost) {
        total += fixedCost.overheadPerUnit || 0;
      }
    }
    
    return total;
  };

  const basePrice = calculateBasePrice();
  const finalPrice = calculatePriceWithTaxesAndFreight();

  const addRawMaterial = (rawMaterialId: string) => {
    const exists = rawMaterials.some((rm) => rm.rawMaterialId === rawMaterialId);
    if (!exists) {
      append({ rawMaterialId, quantity: 1 });
      setRawMaterialSearch("");
    }
  };

  const handleFormSubmit = (data: CreateProductDTO) => {
    if (data.rawMaterials.length === 0) {
      return;
    }

    const cleanedData = {
      ...data,
      code: data.code.trim(),
      name: data.name.trim(),
      description: data.description?.trim() || "",
      fixedCostId: data.fixedCostId || undefined,
      productGroupId: data.productGroupId || undefined,
    };
    onSubmit(cleanedData);
  };

  return (
    <form
      id="product-form"
      onSubmit={handleSubmit(handleFormSubmit)}
      className="max-h-[70vh] overflow-y-auto px-2 space-y-6"
    >
      {/* SEÇÃO 1: INFORMAÇÕES BÁSICAS */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Informações Básicas
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="code">
              Código <span className="text-red-500">*</span>
            </Label>
            <Input
              id="code"
              type="text"
              placeholder="Ex: 001, 002..."
              maxLength={20}
              {...register("code", {
                required: "Código é obrigatório",
                validate: {
                  notEmpty: (value) =>
                    validateNotEmpty(value) ||
                    "Código não pode conter apenas espaços",
                  numeric: (value) =>
                    /^\d+$/.test(value.trim()) ||
                    "Código deve conter apenas números",
                },
                maxLength: {
                  value: 20,
                  message: "Código deve ter no máximo 20 caracteres",
                },
              })}
              error={errors.code?.message}
            />
          </div>

          <div>
            <Label htmlFor="name">
              Nome do Produto <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Ex: Produto A"
              maxLength={100}
              {...register("name", {
                required: "Nome é obrigatório",
                validate: {
                  notEmpty: (value) =>
                    validateNotEmpty(value) ||
                    "Nome não pode conter apenas espaços",
                },
                minLength: {
                  value: 3,
                  message: "Nome deve ter no mínimo 3 caracteres",
                },
                maxLength: {
                  value: 100,
                  message: "Nome deve ter no máximo 100 caracteres",
                },
              })}
              error={errors.name?.message}
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="description">Descrição (Opcional)</Label>
            <Textarea
              id="description"
              placeholder="Detalhes sobre o produto..."
              rows={4}
              maxLength={500}
              className="min-h-[100px] max-h-[240px]"
              {...register("description", {
                maxLength: {
                  value: 500,
                  message: "Descrição deve ter no máximo 500 caracteres",
                },
              })}
            />
            <Text className="text-xs text-gray-400 mt-1">
              Máximo de 500 caracteres
            </Text>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="productGroupId">Grupo de Produto (Opcional)</Label>
            <Autocomplete
              options={
                productGroupsData?.data?.map((pg) => ({
                  value: pg.id,
                  label: pg.name,
                  description: pg.description,
                })) || []
              }
              value={watch("productGroupId")}
              onChange={(value) => setValue("productGroupId", value)}
              onSearchChange={setProductGroupSearch}
              placeholder="Buscar grupo de produto..."
              emptyMessage="Nenhum grupo encontrado"
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="fixedCostId">Custo Fixo (Opcional)</Label>
            <Autocomplete
              options={
                fixedCostsData?.data?.map((fc) => ({
                  value: fc.id,
                  label: fc.description,
                  description: `${fc.code || "S/C"} - ${formatCurrency(
                    fc.overheadPerUnit
                  )}/un`,
                })) || []
              }
              value={selectedFixedCostId}
              onChange={(value) => setValue("fixedCostId", value)}
              onSearchChange={setFixedCostSearch}
              placeholder="Buscar custo fixo..."
              emptyMessage="Nenhum custo fixo encontrado"
            />
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: MATÉRIAS-PRIMAS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">
            Matérias-Primas <span className="text-red-500">*</span>
          </h3>
          <Text className="text-xs text-gray-500">Mínimo: 1 item</Text>
        </div>

        <div className="mb-4">
          <Autocomplete
            options={
              rawMaterialsData?.data
                ?.filter(
                  (rm) => !rawMaterials.some((r) => r.rawMaterialId === rm.id)
                )
                .map((rm) => ({
                  value: rm.id,
                  label: `${rm.code} - ${rm.name}`,
                  description: `${formatCurrency(rm.priceConvertedBrl)} - ${
                    rm.measurementUnit
                  }`,
                })) || []
            }
            value=""
            onChange={addRawMaterial}
            onSearchChange={setRawMaterialSearch}
            placeholder="Buscar e adicionar matéria-prima..."
            emptyMessage="Nenhuma matéria-prima encontrada"
          />
        </div>

        {fields.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <Text className="text-gray-500 text-sm">
              Nenhuma matéria-prima adicionada. Busque e adicione pelo menos uma.
            </Text>
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => {
              const rawMat = rawMaterialsData?.data?.find(
                (r) => r.id === rawMaterials[index]?.rawMaterialId
              );

              return (
                <div
                  key={field.id}
                  className="flex gap-3 items-start bg-gray-50 p-4 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Text
                        variant="caption"
                        className="font-semibold text-gray-900"
                      >
                        {rawMat?.code} - {rawMat?.name}
                      </Text>
                    </div>

                    <div className="text-xs text-gray-500 space-y-1">
                      <div>
                        Preço unitário:{" "}
                        <span className="font-medium">
                          {formatCurrency(rawMat?.priceConvertedBrl || 0)}
                        </span>
                      </div>
                      <div>
                        Unidade:{" "}
                        <span className="font-medium">
                          {rawMat?.measurementUnit}
                        </span>
                      </div>
                      {rawMat?.freight && (
                        <div>
                          Frete:{" "}
                          <span className="font-medium">
                            {formatCurrency(rawMat.freight.unitPrice)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="w-32">
                    <Label htmlFor={`quantity-${index}`}>Quantidade</Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Qtd."
                      {...register(`rawMaterials.${index}.quantity`, {
                        required: "Quantidade é obrigatória",
                        min: {
                          value: 0.01,
                          message: "Mínimo: 0.01",
                        },
                        valueAsNumber: true,
                      })}
                      error={errors.rawMaterials?.[index]?.quantity?.message}
                    />
                  </div>

                  <div className="w-32 flex flex-col justify-center">
                    <Text className="text-xs text-gray-600 mb-1">
                      Subtotal:
                    </Text>
                    <Text className="font-semibold text-gray-900">
                      {formatCurrency(
                        (rawMat?.priceConvertedBrl || 0) *
                          (Number(rawMaterials[index]?.quantity) || 0)
                      )}
                    </Text>
                  </div>

                  <SecondaryButton
                    type="button"
                    variant="ghost"
                    leftIcon={FiTrash2}
                    onClick={() => remove(index)}
                    className="cursor-pointer text-red-600 hover:bg-red-50"
                    aria-label={`Remover matéria-prima ${index + 1}`}
                  />
                </div>
              );
            })}
          </div>
        )}

        {fields.length === 0 && (
          <Text className="text-xs text-red-600 mt-2">
            Adicione pelo menos uma matéria-prima para criar o produto
          </Text>
        )}
      </div>

      {/* SEÇÃO 3: PREVIEW */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
        <Text className="font-semibold text-blue-900">
          Preview de Valores (Calculado Automaticamente)
        </Text>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <Text className="text-gray-700">Custo de Matérias-Primas:</Text>
            <Text className="font-semibold text-gray-900">
              {formatCurrency(basePrice)}
            </Text>
          </div>

          {selectedFixedCostId && (
            <div className="flex justify-between">
              <Text className="text-gray-700">Custo Fixo (Overhead):</Text>
              <Text className="font-semibold text-gray-900">
                {formatCurrency(
                  fixedCostsData?.data?.find((fc) => fc.id === selectedFixedCostId)
                    ?.overheadPerUnit || 0
                )}
              </Text>
            </div>
          )}

          <div className="flex justify-between pt-2 border-t border-blue-300">
            <Text className="text-gray-700 font-medium">
              Preço Base (sem impostos/frete):
            </Text>
            <Text className="font-bold text-blue-900">
              {formatCurrency(basePrice)}
            </Text>
          </div>

          <div className="flex justify-between pt-2 border-t border-blue-300">
            <Text className="text-gray-700 font-medium">
              Preço Final (com impostos/frete):
            </Text>
            <Text className="font-bold text-lg text-green-700">
              {formatCurrency(finalPrice)}
            </Text>
          </div>

          {finalPrice > basePrice && (
            <div className="text-xs text-gray-600 text-right">
              +{(((finalPrice - basePrice) / basePrice) * 100).toFixed(1)}% de
              impostos e frete
            </div>
          )}
        </div>

        <div className="bg-white rounded p-3 mt-3 text-xs text-gray-600">
          <p className="font-medium mb-1">ℹ️ Como o preço é calculado:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Preço Base: soma de (matéria-prima × quantidade)</li>
            <li>
              Preço Final: Base + impostos das matérias + fretes + custo fixo
            </li>
          </ul>
        </div>
      </div>

      <p className="text-xs text-gray-500 pb-4">
        <span className="text-red-500">*</span> Campos obrigatórios
      </p>
    </form>
  );
}