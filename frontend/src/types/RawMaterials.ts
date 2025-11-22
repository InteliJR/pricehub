// src/types/rawMaterial.ts

export type Currency = 'BRL' | 'USD' | 'EUR';

export type MeasurementUnit = 
  | 'KG' 
  | 'G' 
  | 'L' 
  | 'ML' 
  | 'M' 
  | 'CM' 
  | 'UN' 
  | 'CX' 
  | 'PC';

export interface RawMaterialTax {
  id?: string;
  rawMaterialId?: string;
  name: string;
  rate: number;
  recoverable: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RawMaterialFreightInfo {
  id: string;
  unitPrice: number; // Usado no cálculo: rawMat.freight.unitPrice
}

export interface RawMaterialTaxInfo {
  id: string;
  rate: number; // Usado no cálculo: tax.rate
  recoverable: boolean;
}

export interface RawMaterialChangeLog {
  id: string;
  rawMaterialId: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: string;
  changedAt: string;
}

export interface RawMaterial {
  id: string;
  code: string;
  name: string;
  description?: string;
  measurementUnit: MeasurementUnit;
  inputGroup?: string;
  paymentTerm: number;
  acquisitionPrice: number;
  currency: Currency;
  priceConvertedBrl: number;
  additionalCost: number;
  freightId: string;
  createdAt: string;
  updatedAt: string;
  
  // Relações
  freight?: {
    id: string;
    name: string;
    unitPrice: number;
    currency: Currency;
  };
  rawMaterialTaxes: RawMaterialTax[];
  changeLogs?: RawMaterialChangeLog[];
}

export interface RawMaterialFormData {
  code: string;
  name: string;
  description?: string;
  measurementUnit: MeasurementUnit;
  inputGroup?: string;
  paymentTerm: number;
  acquisitionPrice: number;
  currency: Currency;
  priceConvertedBrl: number;
  additionalCost: number;
  freightId: string;
  rawMaterialTaxes: {
    id?: string;
    name: string;
    rate: number;
    recoverable: boolean;
  }[];
}