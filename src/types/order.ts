/**
 * Order-related TypeScript interfaces
 */

export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  
  // Variant details
  size?: string;
  color?: string;
  
  // Snapshot of product at order time
  category?: string;
}

export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface Order {
  id: string;
  
  // Customer information
  userId?: string; // Optional for guest checkout
  email: string;
  
  // Order items
  items: OrderItem[];
  
  // Pricing
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  
  // Shipping
  shippingAddress: ShippingAddress;
  
  // Status
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  
  // Payment details
  stripeSessionId?: string;
  paymentIntentId?: string;
  
  // Tracking
  trackingNumber?: string;
  carrier?: string;
  
  // Timestamps
createdAt: Date | { toMillis: () => number }; // Firestore Timestamp
    updatedAt?: Date | { toMillis: () => number };
    shippedAt?: Date | { toMillis: () => number };
    deliveredAt?: Date | { toMillis: () => number };
  
  // Notes
  customerNotes?: string;
  adminNotes?: string;
}

export interface CreateOrderParams {
  email: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  userId?: string;
  customerNotes?: string;
  
  // Calculated values
  subtotal: number;
  shipping?: number;
  tax?: number;
  discount?: number;
}

export interface OrderFilter {
  userId?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  startDate?: Date;
  endDate?: Date;
  search?: string; // Order ID or email
}
