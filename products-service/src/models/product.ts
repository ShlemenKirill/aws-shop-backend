export interface Product {
  id: string;
  title: string;
  description?: string;
  price?: number;
}

export interface ProductWithCount extends Product {
  count: number
}

export type PostNewProductDto = Omit<Product, 'id'>
