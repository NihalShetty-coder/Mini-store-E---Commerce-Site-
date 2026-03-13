/**
 * Cart-related TypeScript interfaces
 */

import { Product } from './product';

export interface CartItem {
  // Product information
  id: string;
  name: string;
  price: number;
  image: string;
  
  // Variant selection
  selectedSize?: string;
  selectedColor?: string;
  
  // Cart-specific
  quantity: number;
  
  // Optional product details
  category?: string;
  stock?: number;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

/**
 * Helper type to create cart item from product
 */
export interface AddToCartParams {
  product: Product;
  quantity?: number;
  selectedSize?: string;
  selectedColor?: string;
}

/**
 * Unique cart item identifier including size/color
 */
export function getCartItemKey(item: Partial<CartItem>): string {
  return `${item.id}-${item.selectedSize || ''}-${item.selectedColor || ''}`;
}
