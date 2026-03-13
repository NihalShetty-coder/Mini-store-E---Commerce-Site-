/**
 * Product-related TypeScript interfaces
 */

export interface Product {
  id: string;
  name: string;
  description?: string; // Optional
  price: number;
  category: string;
  image?: string; // Single image field (used by some legacy products)
  images?: string[]; // Optional - some products may only have a single 'image' field
  videos?: string[];
  stock?: number; // Optional - some products may not track stock
  status: 'Active' | 'Draft' | 'Out of Stock';
  sizes?: string[];
  colors?: string[];
  tags?: string[];
  featured?: boolean;
  createdAt?: Date | { toMillis: () => number }; // Firestore Timestamp
  updatedAt?: Date | { toMillis: () => number };
}

export interface ProductVariant {
  id: string;
  productId: string;
  size?: string;
  color?: string;
  sku: string;
  stock: number;
  priceModifier?: number; // Additional cost for this variant
  image?: string;
}

export interface ProductFilter {
  category?: string;
  priceRange?: [number, number];
  colors?: string[];
  sizes?: string[];
  tags?: string[];
  search?: string;
  status?: Product['status'];
}

export type ProductFormData = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
