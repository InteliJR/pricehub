export interface Product {
  id: string;
  code: string;
  description: string;
  group: number;
  price: number;
  currency: 'Real' | 'Dólar';
  overhead: number;
}

export interface RawMaterial {
  id: string;
  code: string; 
  name: string;
  description: string;
  deadline: string; 
  price: number;
  currency: 'Real' | 'Dólar';
  additionalCosts: number;
}