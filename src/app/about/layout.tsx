import { Metadata } from 'next';
import { generateMetadata } from '@/lib/metadata';

export const metadata: Metadata = generateMetadata({
  title: 'About Us',
  description: 'Discover the story behind Nihal Shetty. Learn about our commitment to curated luxury, editorial style, and exceptional quality in every product we offer.',
  path: '/about',
});

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
