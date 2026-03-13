/**
 * Store settings TypeScript interfaces
 */

export interface StoreSettings {
  // Basic info
  storeName: string;
  storeDescription?: string;
  storeEmail: string;
  storePhone?: string;
  
  // Branding
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  
  // Social media
  facebook?: string;
  instagram?: string;
  twitter?: string;
  
  // Payment
  stripePublishableKey?: string;
  currency: string;
  
  // Shipping
  freeShippingThreshold?: number;
  flatShippingRate?: number;
  
  // Tax
  taxRate?: number;
  taxEnabled: boolean;
  
  // Features
  guestCheckoutEnabled: boolean;
  reviewsEnabled: boolean;
  wishlistEnabled: boolean;
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  
  // Footer
  footerText?: string;
  
  // Timestamps
  updatedAt?: Date | unknown;
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}
