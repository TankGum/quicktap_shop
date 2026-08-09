import { siteConfig } from '@/lib/siteConfig';

export const dynamic = 'force-static';

export default function sitemap() {
  const routes = ['', '/san-pham/bang-nfc', '/san-pham/standee', '/lien-he'];
  return routes.map((route) => ({
    url: `${siteConfig.siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: route === '' ? 1 : 0.8,
  }));
}
