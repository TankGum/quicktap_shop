// Sinh lại data/diaGioi.json — danh mục Tỉnh/Thành phố -> Phường/Xã cho dropdown địa chỉ.
//
// Chạy TAY, không nằm trong `npm run build`:
//   node scripts/fetch-diagioi.mjs
//
// Vì sao không gọi lúc build: build mà phụ thuộc một API bên ngoài thì hôm nào API đó sập là
// không deploy được, dù chẳng liên quan gì tới thay đổi mình đang làm. Đơn vị hành chính vài
// năm mới đổi một lần, nên chạy tay rồi commit kết quả là đúng mức độ.
//
// Cấu trúc 2 cấp (Tỉnh/Thành -> Phường/Xã), không có cấp huyện — đúng tổ chức hành chính áp
// dụng từ 01/07/2025.
//
// LƯU Ý khi chạy lại: nếu danh mục thay đổi (sáp nhập, đổi tên), các đơn đã có trong D1 KHÔNG
// bị ảnh hưởng — shop_orders chép sẵn province_name/ward_name lúc đặt, cố ý để đơn cũ vẫn đọc
// ra đúng địa chỉ khách đã nhập.

import { writeFile } from 'node:fs/promises';

const SOURCE = 'https://provinces.open-api.vn/api/v2/?depth=2';
// Ghi thẳng vào public/: đây là tài sản tĩnh, Next copy nguyên sang out/ rồi Pages phục vụ
// tại /diachi.json. Không cần Route Handler như app/kb.json (cái đó phải trộn dữ liệu Airtable
// lúc build nên mới cần render), và cả trình duyệt lẫn Pages Function đều nạp cùng một file.
const OUT = new URL('../public/diachi.json', import.meta.url);

// Mã chuẩn theo danh mục đơn vị hành chính: tỉnh 2 chữ số, phường/xã 5 chữ số. API trả về số
// nguyên (Hà Nội = 1), phải đệm 0 cho khớp với siteConfig.shippingFreeProvinceCode = '01' —
// so '1' với '01' là hụt, mà hụt ở đây nghĩa là thu nhầm 30k của khách Hà Nội.
const padProvince = (code) => String(code).padStart(2, '0');
const padWard = (code) => String(code).padStart(5, '0');

const res = await fetch(SOURCE);
if (!res.ok) {
  console.error(`Nguồn trả ${res.status}. Không ghi đè file cũ.`);
  process.exit(1);
}

const raw = await res.json();
if (!Array.isArray(raw) || raw.length === 0) {
  console.error('Nguồn trả dữ liệu rỗng hoặc sai định dạng. Không ghi đè file cũ.');
  process.exit(1);
}

const provinces = raw
  .map((p) => ({
    code: padProvince(p.code),
    name: p.name,
    // Chỉ giữ mã + tên. Bỏ codename/division_type/phone_code: file này tải về máy khách ở
    // trang thanh toán, mỗi trường thừa là vài chục KB không ai dùng tới.
    wards: (p.wards || [])
      .map((w) => ({ code: padWard(w.code), name: w.name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'vi')),
  }))
  .sort((a, b) => a.name.localeCompare(b.name, 'vi'));

const wardCount = provinces.reduce((n, p) => n + p.wards.length, 0);

// Chốt chặn trước khi ghi đè: một lần API trả thiếu mà mình ghi đè mất là dropdown cụt ngón
// giữa lúc khách đang đặt hàng, và không ai nhận ra cho tới khi có người phàn nàn.
if (provinces.length < 30 || wardCount < 2000) {
  console.error(`Dữ liệu ngờ vực: ${provinces.length} tỉnh / ${wardCount} phường-xã. Không ghi đè.`);
  process.exit(1);
}
if (!provinces.some((p) => p.code === '01')) {
  console.error('Không thấy mã tỉnh 01 (Hà Nội) — freeship sẽ hỏng. Không ghi đè.');
  process.exit(1);
}

await writeFile(OUT, `${JSON.stringify({ generatedAt: new Date().toISOString(), provinces })}\n`);
console.log(`public/diachi.json: ${provinces.length} tỉnh/thành, ${wardCount} phường/xã.`);
