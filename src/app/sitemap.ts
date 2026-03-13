import { MetadataRoute } from 'next';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { siteConfig } from '@/lib/metadata';

/**
 * Dynamic sitemap generation
 * This will be automatically generated at /sitemap.xml
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // Dynamic product pages via Admin SDK (server-side only)
  let productPages: MetadataRoute.Sitemap = [];

  try {
    const db = getAdminFirestore();
    const snapshot = await db
      .collection('products')
      .where('status', '==', 'Active')
      .select('createdAt')
      .get();

    productPages = snapshot.docs.map((doc) => {
      const data = doc.data();
      let lastMod = new Date();
      if (data.createdAt) {
        if (typeof data.createdAt.toDate === 'function') {
          lastMod = data.createdAt.toDate();
        } else if (data.createdAt instanceof Date) {
          lastMod = data.createdAt;
        }
      }
      return {
        url: `${baseUrl}/product/${doc.id}`,
        lastModified: lastMod,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      };
    });
  } catch (error) {
    console.error('Error fetching products for sitemap:', error);
    // Continue without product pages if there's an error
  }

  return [...staticPages, ...productPages];
}
