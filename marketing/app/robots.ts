import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/partners/login'],
      },
    ],
    sitemap: 'https://helena.bio/sitemap.xml',
  }
}
