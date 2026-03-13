import { Metadata } from 'next';

/**
 * Shared SEO metadata configuration
 * Centralized place to manage site-wide SEO settings
 */

export const siteConfig = {
  name: 'Nihal Shetty',
  title: 'Nihal Shetty | Premium E-commerce Store',
  description: 'Discover curated luxury fashion and editorial lifestyle products. Shop our exclusive collection of premium apparel, accessories, and home goods.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com',
  ogImage: '/og-image.jpg', // TODO: Create OG image
  keywords: [
    'luxury fashion',
    'premium e-commerce',
    'editorial style',
    'designer clothing',
    'lifestyle products',
    'curated fashion',
    'online boutique',
  ],
  creator: 'Nihal Shetty',
  twitterHandle: '@nihalshetty', // TODO: Update with actual handle
};

/**
 * Generate metadata for a page
 */
export function generateMetadata({
  title,
  description,
  image,
  path = '',
  noIndex = false,
  keywords,
}: {
  title?: string;
  description?: string;
  image?: string;
  path?: string;
  noIndex?: boolean;
  keywords?: string[];
}): Metadata {
  const pageTitle = title 
    ? `${title} | ${siteConfig.name}` 
    : siteConfig.title;
  
  const pageDescription = description || siteConfig.description;
  const pageImage = image || siteConfig.ogImage;
  const pageUrl = `${siteConfig.url}${path}`;
  const pageKeywords = keywords || siteConfig.keywords;

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: pageKeywords,
    authors: [{ name: siteConfig.creator }],
    creator: siteConfig.creator,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: pageUrl,
      title: pageTitle,
      description: pageDescription,
      siteName: siteConfig.name,
      images: [
        {
          url: pageImage,
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
      images: [pageImage],
      creator: siteConfig.twitterHandle,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
  };
}

/**
 * Product-specific metadata generator
 */
export function generateProductMetadata({
  name,
  description,
  price,
  image,
  category,
  productId,
}: {
  name: string;
  description?: string;
  price: number;
  image?: string;
  category?: string;
  productId: string;
}): Metadata {
  const title = `${name} | Shop ${category || 'Products'}`;
  const metaDescription = description 
    ? description.substring(0, 160) 
    : `Shop ${name} at ${siteConfig.name}. Premium quality, curated selection. Price: $${price.toFixed(2)}`;

  return generateMetadata({
    title,
    description: metaDescription,
    image,
    path: `/product/${productId}`,
    keywords: [
      name,
      category || '',
      'buy online',
      'shop now',
      ...siteConfig.keywords,
    ].filter(Boolean),
  });
}

/**
 * Collection/Category metadata generator
 */
export function generateCategoryMetadata({
  category,
  description,
  productCount,
}: {
  category: string;
  description?: string;
  productCount?: number;
}): Metadata {
  const title = `Shop ${category}`;
  const metaDescription = description || 
    `Explore our curated collection of ${category.toLowerCase()}. ${productCount ? `${productCount} products available.` : ''} Premium quality, editorial style.`;

  return generateMetadata({
    title,
    description: metaDescription,
    path: `/shop?category=${encodeURIComponent(category)}`,
    keywords: [
      category,
      `${category} collection`,
      `shop ${category}`,
      ...siteConfig.keywords,
    ],
  });
}
