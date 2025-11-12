export interface Product {
  id: string;
  code: string;
  description: string;
  group: number;
  price: number;
  currency: 'Real' | 'Dólar';
  overhead: number;
}

