// Sinh out/llms.txt lúc build — bản tóm tắt site dạng văn bản thuần, dành cho các trình thu
// thập của trợ lý AI (GPTBot, ClaudeBot, PerplexityBot…).
//
// NÓI THẬT VỀ GIÁ TRỊ: `llms.txt` là một quy ước MỚI và CHƯA có nhà cung cấp nào công bố rằng
// họ thực sự đọc nó. Lý do vẫn làm: chi phí gần như bằng không vì mọi dữ liệu đã có sẵn trong
// siteConfig + Airtable, và nếu quy ước này được dùng thật thì site đã sẵn sàng. Đừng kỳ vọng
// nó một mình làm AI giới thiệu shop — thứ quyết định vẫn là được nhắc tới ở nơi khác.
//
// Cùng khuôn với app/kb.json/route.js: Route Handler chỉ có GET + `dynamic = 'force-static'`
// nên `next build` render thành file tĩnh. Sinh ra từ siteConfig chứ KHÔNG viết tay, vì viết
// tay là tạo nguồn sự thật thứ hai cho giá và chính sách — đổi giá trên Airtable rồi quên sửa
// file này thì mình đang đưa số sai cho đúng những con AI mà mình muốn nó nói đúng về mình.
//
// HỆ QUẢ: file CÔNG KHAI. Cùng giới hạn với kb.json — không thêm gì không muốn công khai.

import { products } from '@/data/products';
import { siteConfig } from '@/lib/siteConfig';
import { getVariantsByProduct } from '@/lib/airtable';

export const dynamic = 'force-static';

export async function GET() {
  const variantsByProduct = await getVariantsByProduct();
  const u = (path) => `${siteConfig.siteUrl}${path}`;

  const productBlocks = products.map((p) => {
    const variants = variantsByProduct[p.id] || [];
    const lines = variants
      .filter((v) => v.name)
      .map((v) => `- [${v.name}](${u(v.href)})${v.price ? `: ${v.price}` : ''}`);
    // Dòng rỗng ở CUỐI mỗi khối: các khối được spread vào một mảng rồi join bằng '\n', nên
    // không có nó thì mẫu cuối của sản phẩm này dính liền vào tiêu đề của sản phẩm sau.
    return [`### ${p.title}`, '', `${p.body}`, '', `Trang: ${u(p.href)}`, '', ...lines, ''].join('\n');
  });

  const text = [
    `# ${siteConfig.brandName}`,
    '',
    `> Bảng NFC và standee QR giúp quán ăn, cà phê, khách sạn, spa tăng số lượng đánh giá trên`,
    `> Google Maps, Booking.com và TripAdvisor. Khách chạm điện thoại hoặc quét mã là mở thẳng`,
    `> trang đánh giá của quán. Giao toàn quốc, miễn phí giao hàng tại ${siteConfig.shippingFreeRegion}.`,
    '',
    `Đơn vị: ${siteConfig.legal.companyName} — mã số thuế ${siteConfig.legal.taxCode}, ${siteConfig.legal.address}.`,
    '',
    '## Sản phẩm',
    '',
    // Mỗi khối đã tự kết thúc bằng một dòng rỗng, nên KHÔNG thêm '' ở đây nữa.
    ...productBlocks,
    '## Giá và chiết khấu',
    '',
    siteConfig.quantityPricing,
    '',
    '## Giao hàng',
    '',
    siteConfig.shippingPolicy,
    '',
    '## Thanh toán',
    '',
    'Hai cách: thanh toán khi nhận hàng (COD), hoặc chuyển khoản theo mã QR sinh ra sau khi đặt',
    '(nội dung chuyển khoản chính là mã đơn). Đơn chuyển khoản chỉ được xác nhận sau khi tiền về.',
    '',
    '## Thiết kế riêng',
    '',
    `Khách tự lên mẫu tại ${u('/thiet-ke-rieng')}: chọn mẫu, tải logo lên, đổi màu nền, xem trước`,
    'rồi gửi về. Gửi xong nhận ngay một mã đơn dạng TK-XXXX.',
    '',
    '## Liên hệ',
    '',
    `- Điện thoại: ${siteConfig.phoneDisplay}`,
    `- Zalo: ${siteConfig.zaloHref}`,
    ...(siteConfig.legal.email ? [`- Email: ${siteConfig.legal.email}`] : []),
    '',
    '## Dữ liệu máy đọc',
    '',
    `- [kb.json](${u('/kb.json')}): toàn bộ mẫu, giá, chính sách và FAQ dưới dạng JSON`,
    `- [sitemap.xml](${u('/sitemap.xml')}): mọi trang kèm ảnh từng mẫu`,
    '',
    '## Trang chính',
    '',
    `- [Trang chủ](${u('/')})`,
    ...products.map((p) => `- [${p.title}](${u(p.href)})`),
    `- [Liên hệ](${u('/lien-he')})`,
    `- [Thông tin pháp lý](${u('/phap-ly')})`,
    '',
  ].join('\n');

  return new Response(text, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
