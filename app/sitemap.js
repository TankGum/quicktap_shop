import { siteConfig } from '@/lib/siteConfig';
import { getVariantsByProduct } from '@/lib/airtable';

export const dynamic = 'force-static';

export default async function sitemap() {
  const staticRoutes = [
    '', '/san-pham/bang-nfc', '/san-pham/standee', '/thiet-ke-rieng', '/lien-he',
    // Trang pháp lý + bản đồ trang web: ưu tiên thấp hơn (đặt ở nhóm dưới) nhưng vẫn phải có
    // mặt, vì Google coi sự tồn tại của chúng là một tín hiệu tin cậy của site bán hàng.
    '/chinh-sach-bao-mat', '/dieu-khoan-su-dung', '/phap-ly', '/so-do-trang',
  ];
  const lowPriorityRoutes = new Set(['/chinh-sach-bao-mat', '/dieu-khoan-su-dung', '/phap-ly', '/so-do-trang']);

  // Trước đây sitemap chỉ có 4 trang tĩnh — bỏ sót toàn bộ trang chi tiết từng mẫu
  // (/san-pham/bang-nfc/[slug], /san-pham/standee/[slug]), dù mỗi trang có ảnh + mô tả
  // riêng, hoàn toàn đáng được Google biết tới. Lấy trực tiếp từ Airtable, không hardcode
  // danh sách tay — mẫu nào xuất hiện trên site thì tự có trong sitemap, không cần nhớ sửa
  // thêm ở đây mỗi khi thêm mẫu mới.
  const variantsByProduct = await getVariantsByProduct();
  const variants = Object.values(variantsByProduct).flat();

  const now = new Date();

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteConfig.siteUrl}${route}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: route === '' ? 1 : lowPriorityRoutes.has(route) ? 0.3 : 0.8,
    })),
    ...variants.map((v) => ({
      url: `${siteConfig.siteUrl}${v.href}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
      // Khai ẢNH kèm từng URL -> Next sinh thẻ <image:image> trong sitemap.xml. Không có khối
      // này thì Google phải tự suy ra ảnh bằng cách đọc HTML, mà ảnh mẫu nằm trên Cloudinary
      // (khác tên miền với site) nên rất dễ bị bỏ qua. Đây là đường ngắn nhất để ảnh từng mẫu
      // vào được Google Images — cùng một tấm ảnh đã hiển thị trên trang, không thêm tài sản mới.
      ...(v.images?.length ? { images: v.images } : {}),
    })),
  ];
}
