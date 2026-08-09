// Đọc danh sách sản phẩm/mẫu từ Airtable lúc build site (server-only, KHÔNG chạy trong trình duyệt).
// Ảnh upload trong form Airtable có link tạm (hết hạn sau vài giờ), nên mình tự chuyển
// (re-host) sang Cloudinary ngay tại đây để có link vĩnh viễn trước khi đưa vào trang tĩnh.
//
// Cấu hình cần thiết trong .env.local: AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID,
// CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.
// Thiếu biến nào thì hàm bên dưới tự bỏ qua (trả về rỗng), không làm sập build.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { cache } from 'react';

// Cache xuống file trên đĩa (không phải biến trong bộ nhớ) — ở `next dev`, mỗi route được
// Next.js biên dịch riêng nên biến module-level không dùng chung được giữa các route khác
// nhau, vẫn gọi lại Airtable + upload lại ảnh lên Cloudinary mỗi lần chuyển trang, rất chậm.
// File trên đĩa thì route nào đọc cũng ra cùng 1 chỗ. Không commit — đã gitignore theo /.cache.
const CACHE_FILE = path.join(process.cwd(), '.cache', 'airtable-variants.json');
const CACHE_TTL_MS = 60_000; // 1 phút

function readDiskCache() {
  try {
    const { cachedAt, grouped } = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    if (Date.now() - cachedAt < CACHE_TTL_MS) return grouped;
  } catch {
    // Chưa có file cache hoặc đọc lỗi — coi như cache miss, gọi API lại bình thường.
  }
  return null;
}

function writeDiskCache(grouped) {
  try {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify({ cachedAt: Date.now(), grouped }));
  } catch {
    // Không ghi được (vd môi trường read-only lúc deploy) thì bỏ qua, không phải lỗi nghiêm trọng.
  }
}

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID;

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

// Khớp với option của cột "Category" (Single select) trong Airtable — sửa lại nếu bạn đặt tên khác.
const CATEGORY_TO_PRODUCT_ID = {
  'Bảng NFC': 'bang-nfc',
  Standee: 'standee',
};

const PRODUCT_HREF = {
  'bang-nfc': '/san-pham/bang-nfc',
  standee: '/san-pham/standee',
};

// "Bảng vân gỗ #1" -> "bang-van-go-1" (bỏ dấu tiếng Việt, chỉ giữ chữ/số/gạch ngang).
function slugify(str) {
  return String(str || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function fetchAirtableRecords() {
  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
    console.warn('[airtable] Thiếu AIRTABLE_TOKEN/BASE_ID/TABLE_ID trong .env.local — bỏ qua, dùng sản phẩm tĩnh.');
    return [];
  }

  const records = [];
  let offset;

  do {
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`);
    if (offset) url.searchParams.set('offset', offset);

    // Không dùng cache: 'no-store' — site export tĩnh cần fetch này chạy được lúc build
    // (kết quả được "đóng băng" vào HTML tĩnh, không gọi lại lúc khách truy cập).
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
    });

    if (!res.ok) {
      console.warn('[airtable] Lấy dữ liệu thất bại:', res.status, await res.text());
      break;
    }

    const data = await res.json();
    records.push(...(data.records || []));
    offset = data.offset;
  } while (offset);

  return records;
}

function signCloudinaryParams(params) {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return crypto.createHash('sha1').update(toSign + CLOUDINARY_API_SECRET).digest('hex');
}

// Nhờ Cloudinary tự tải file từ 1 URL tạm (link Airtable) về lưu vĩnh viễn, trả link mới.
async function rehostToCloudinary(remoteUrl, folder = 'quicktap-products') {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.warn('[cloudinary] Thiếu cấu hình Cloudinary trong .env.local — giữ nguyên link Airtable (sẽ hết hạn).');
    return remoteUrl;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const params = { timestamp, folder };
  const signature = signCloudinaryParams(params);

  const body = new URLSearchParams({
    file: remoteUrl,
    api_key: CLOUDINARY_API_KEY,
    timestamp: String(timestamp),
    folder,
    signature,
  });

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, {
    method: 'POST',
    body,
  });

  if (!res.ok) {
    console.warn('[cloudinary] Re-host ảnh thất bại:', res.status, await res.text());
    return remoteUrl;
  }

  const data = await res.json();
  return data.secure_url || remoteUrl;
}

// Cột "Price" trong Airtable là Text nên "199000" tới đây vẫn là chuỗi, không phải số —
// nếu người điền chỉ gõ toàn chữ số thì tự format thành "199.000đ"; còn nếu họ đã ghi rõ
// kiểu "199.000đ/cái" hay "Liên hệ" thì giữ nguyên, không đụng vào.
function formatPrice(price) {
  if (price === undefined || price === null || price === '') return '';
  const asNumber = Number(price);
  if (/^\d+$/.test(String(price).trim())) return `${asNumber.toLocaleString('vi-VN')}đ`;
  return String(price);
}

// Trả về { 'bang-nfc': [variant, ...], standee: [variant, ...] } từ các dòng đã tick Published.
// Bọc trong React.cache để nhiều component dùng chung 1 lần gọi trong cùng 1 lượt render.
export const getVariantsByProduct = cache(async function getVariantsByProduct() {
  const cached = readDiskCache();
  if (cached) return cached;

  const records = await fetchAirtableRecords();

  // Xử lý song song thay vì tuần tự — upload ảnh lên Cloudinary của các mẫu không phụ
  // thuộc nhau, tuần tự thì 6 mẫu = 6 lần chờ nối tiếp, song song thì chỉ chờ bằng 1 lần.
  const processed = await Promise.all(records.map(async (record) => {
    const f = record.fields || {};
    if (!f.Published) return null;

    const productId = CATEGORY_TO_PRODUCT_ID[f.Category];
    if (!productId) return null;

    const attachment = Array.isArray(f.Image) ? f.Image[0] : null;
    const image = attachment?.url ? await rehostToCloudinary(attachment.url) : null;

    if (!f.Name && !image && !f.VideoUrl) return null; // dòng test trống, bỏ qua

    // Gắn hậu tố từ id bản ghi để link không trùng nhau dù 2 mẫu đặt cùng tên.
    const slug = `${slugify(f.Name) || 'mau'}-${record.id.slice(-6).toLowerCase()}`;

    return {
      productId,
      variant: {
        id: record.id,
        slug,
        href: `${PRODUCT_HREF[productId]}/${slug}`,
        name: f.Name || '',
        description: f.Description || '',
        price: formatPrice(f.Price),
        image,
        video: f.VideoUrl || null,
      },
    };
  }));

  const grouped = {};
  for (const item of processed) {
    if (!item) continue;
    if (!grouped[item.productId]) grouped[item.productId] = [];
    grouped[item.productId].push(item.variant);
  }

  writeDiskCache(grouped);
  return grouped;
});

// Tìm đúng 1 mẫu theo slug trong URL (dùng cho trang chi tiết + generateStaticParams).
export async function getVariantBySlug(productId, slug) {
  const grouped = await getVariantsByProduct();
  return (grouped[productId] || []).find((v) => v.slug === slug) || null;
}

// Danh sách slug cho generateStaticParams của route [slug]. Với `output: export`, Next.js
// coi mảng rỗng như thể hàm generateStaticParams "không tồn tại" và báo lỗi build — nên khi
// một dòng sản phẩm (vd Bảng NFC) chưa có mẫu nào trong Airtable, trả về 1 slug giả để build
// qua; trang ứng với slug giả đó sẽ tự render "không tìm thấy" (xem getVariantBySlug ở trên).
export async function getVariantSlugs(productId) {
  const grouped = await getVariantsByProduct();
  const list = grouped[productId] || [];
  return list.length > 0 ? list.map((v) => ({ slug: v.slug })) : [{ slug: '_chua-co-mau' }];
}
