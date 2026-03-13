/**
 * User-related TypeScript interfaces
 */

export type UserRole = 'customer' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  
  // Contact
  phone?: string;
  
  // Preferences
  emailNotifications?: boolean;
  
  // Timestamps
  createdAt: Date | unknown;
  updatedAt?: Date | unknown;
  lastLoginAt?: Date | unknown;
  
  // Stats (optional)
  totalOrders?: number;
  totalSpent?: number;
}

export type UserProfile = Partial<Omit<User, 'id' | 'email' | 'role'>>;

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignUpData extends AuthCredentials {
  firstName: string;
  lastName: string;
}
