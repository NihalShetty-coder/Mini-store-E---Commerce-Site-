import { Metadata } from 'next';
import { generateMetadata } from '@/lib/metadata';

export const metadata: Metadata = generateMetadata({
  title: 'Shop All Products',
  description: 'Browse our complete collection of premium fashion, accessories, and lifestyle products. Curated selection of luxury items for the discerning shopper.',
  path: '/shop',
  keywords: [
    'shop all',
    'product catalog',
    'online shopping',
    'luxury products',
    'premium fashion',
    'designer collection',
  ],
});

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
