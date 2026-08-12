import { siteConfig } from '@/lib/siteConfig';
import { getVariantsByProduct } from '@/lib/airtable';

export const dynamic = 'force-static';

export default async function sitemap() {
  const staticRoutes = ['', '/san-pham/bang-nfc', '/san-pham/standee', '/lien-he'];

  // Trước đây sitemap chỉ có 4 trang tĩnh — bỏ sót toàn bộ trang chi tiết từng mẫu
  // (/san-pham/bang-nfc/[slug], /san-pham/standee/[slug]), dù mỗi trang có ảnh + mô tả
  // riêng, hoàn toàn đáng được Google biết tới. Lấy trực tiếp từ Airtable, không hardcode
  // danh sách tay — mẫu nào xuất hiện trên site thì tự có trong sitemap, không cần nhớ sửa
  // thêm ở đây mỗi khi thêm mẫu mới.
  const variantsByProduct = await getVariantsByProduct();
  const variantRoutes = Object.values(variantsByProduct).flat().map((v) => v.href);

  const now = new Date();

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteConfig.siteUrl}${route}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: route === '' ? 1 : 0.8,
    })),
    ...variantRoutes.map((href) => ({
      url: `${siteConfig.siteUrl}${href}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    })),
  ];
}
