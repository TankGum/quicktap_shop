// Sinh out/kb.json lúc build — khối kiến thức DUY NHẤT mà trợ lý chat (functions/api/chat.js)
// được phép dựa vào để trả lời.
//
// Vì sao là một file tĩnh chứ không phải hằng số viết tay trong Function: site là static
// export nên giá và tên mẫu chỉ tồn tại LÚC BUILD (đọc từ Airtable qua lib/airtable.js rồi
// nướng vào HTML). Function chạy sau đó, trong môi trường Workers, không có Airtable, không
// có data/*.js. Chép tay giá sang Function là tạo nguồn sự thật thứ hai — đổi giá trên
// Airtable rồi quên sửa Function thì chat báo giá sai cho khách, kiểu hỏng không ai thấy.
//
// Cơ chế: Route Handler chỉ có GET + `dynamic = 'force-static'` được Next render thành FILE
// TĨNH lúc `next build` (giống hệt app/sitemap.js sinh ra sitemap.xml). Kết quả nằm ở
// out/kb.json, Pages phục vụ như mọi asset khác, Function nạp bằng fetch cùng tên miền.
//
// HỆ QUẢ QUAN TRỌNG: file này CÔNG KHAI, ai cũng mở /kb.json xem được. Chấp nhận được vì mọi
// thứ trong đó đã hiện sẵn trên site — nhưng cũng vì thế mà TUYỆT ĐỐI không thêm vào đây bất
// cứ thứ gì không muốn công khai (giá vốn, ghi chú nội bộ, thông tin khách).

import { products } from '@/data/products';
import { industries } from '@/data/industries';
import { platforms } from '@/data/platforms';
import { siteConfig } from '@/lib/siteConfig';
import { getVariantsByProduct } from '@/lib/airtable';

export const dynamic = 'force-static';

export async function GET() {
  const variantsByProduct = await getVariantsByProduct();

  return Response.json({
    // Ngày sinh file, để lúc dò lỗi biết ngay chat đang đọc bản build nào — "chat báo giá cũ"
    // gần như luôn là do chưa deploy lại sau khi sửa Airtable.
    generatedAt: new Date().toISOString(),

    brand: {
      name: siteConfig.brandName,
      phone: siteConfig.phoneDisplay,
      zalo: siteConfig.zaloHref,
      siteUrl: siteConfig.siteUrl,
      quantityPricing: siteConfig.quantityPricing,
      // chatPrompt.mjs CẤM trợ lý tự nghĩ ra chính sách giao hàng — đúng, vì bịa ra là hứa
      // sai với khách. Nhưng hệ quả là trước đây câu "có freeship không?" nó không trả lời
      // được, dù đây là câu khách hỏi nhiều nhất ngay trước lúc chốt đơn. Khai ở đây thì trợ
      // lý có nguồn thật để dẫn, không phải đoán.
      shipping: siteConfig.shippingPolicy,
    },

    products: products.map((p) => ({
      id: p.id,
      title: p.title,
      href: p.href,
      tagline: p.tagline,
      body: p.body,
      ticks: p.ticks,
      // Ảnh/video bỏ hẳn: model chỉ đọc chữ, mà mỗi link Cloudinary dài cả trăm ký tự — nhét
      // vào là đốt token của MỌI lượt chat cho thứ không bao giờ dùng tới.
      variants: (variantsByProduct[p.id] || []).map((v) => ({
        name: v.name,
        price: v.price,
        description: v.description,
        href: v.href,
      })),
    })),

    industries: industries.map((i) => i.label),
    platforms: platforms.map((p) => p.name),

    designTool: { href: '/thiet-ke-rieng' },

    // CỐ Ý KHÔNG có siteConfig.stats: ba ô đó đang là placeholder ('[SỐ QUÁN]+'). Lọt vào đây
    // là chat đọc nguyên văn dấu ngoặc vuông cho khách. Khi nào điền số thật thì thêm vào.
  });
}
