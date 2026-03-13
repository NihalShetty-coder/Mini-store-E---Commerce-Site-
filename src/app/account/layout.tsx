import { Metadata } from 'next';
import { generateMetadata } from '@/lib/metadata';

export const metadata: Metadata = generateMetadata({
  title: 'My Account',
  description: 'Manage your Nihal Shetty account, view order history, track shipments, and update your profile information.',
  path: '/account',
  noIndex: true, // Don't index private account pages
});

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
