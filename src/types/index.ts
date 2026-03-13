/**
 * Central export point for all TypeScript types
 */

export * from './product';
export * from './cart';
export * from './order';
export * from './user';
export * from './analytics';
export * from './settings';

// Common utility types
export type FirestoreTimestamp = Date | { toMillis: () => number };

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}
