// src/types/taxes.ts

export interface FreightTax {
  id: string;
  freightId: string;
  name: string;
  rate: number;
  createdAt: string;
  updatedAt: string;
  freight?: {
    id: string;
    name: string;
  };
}

export interface RawMaterialTax {
  id: string;
  rawMaterialId: string;
  name: string;
  rate: number;
  recoverable: boolean;
  createdAt: string;
  updatedAt: string;
  rawMaterial?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface FreightTaxFormData {
  name: string;
  rate: number;
  freightId: string;
}

export interface RawMaterialTaxFormData {
  name: string;
  rate: number;
  recoverable: boolean;
  rawMaterialId: string;
}