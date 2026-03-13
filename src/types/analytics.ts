/**
 * Analytics-related TypeScript interfaces
 */

export type AnalyticsEventType = 
  | 'PAGE_VIEW'
  | 'PRODUCT_VIEW'
  | 'ADD_TO_CART'
  | 'REMOVE_FROM_CART'
  | 'CHECKOUT_STARTED'
  | 'ORDER_COMPLETED'
  | 'SEARCH'
  | 'FILTER_APPLIED';

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  data: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  timestamp: Date | { toMillis: () => number } | null;
  
  // Context
  page?: string;
  referrer?: string;
  userAgent?: string;
}

export interface AnalyticsMetrics {
  // Revenue
  totalRevenue: number;
  revenueGrowth: number;
  
  // Orders
  totalOrders: number;
  ordersGrowth: number;
  averageOrderValue: number;
  
  // Customers
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  
  // Products
  topProducts: Array<{
    productId: string;
    name: string;
    revenue: number;
    units: number;
  }>;
  
  // Traffic
  pageViews: number;
  uniqueVisitors: number;
  conversionRate: number;
  
  // Time period
  startDate: Date;
  endDate: Date;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface TrafficSource {
  source: string;
  percentage: number;
  visitors: number;
}
