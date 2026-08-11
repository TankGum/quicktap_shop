// Đọc danh sách sản phẩm/mẫu (và ảnh "Thiết kế riêng") từ Airtable lúc build site
// (server-only, KHÔNG chạy trong trình duyệt). Ảnh upload trong form Airtable có link tạm
// (hết hạn sau vài giờ), nên mình tự chuyển (re-host) sang Cloudinary ngay tại đây để có
// link vĩnh viễn trước khi đưa vào trang tĩnh.
//
// Cấu hình cần thiết trong .env.local: AIRTABLE_TOKEN, AIRTABLE_BASE_ID và 3 bảng (cùng
// base, khác bảng): AIRTABLE_TABLE_ID (sản phẩm), AIRTABLE_CUSTOM_DESIGNS_TABLE_ID (ảnh
// "Thiết kế riêng"), AIRTABLE_SITE_MEDIA_TABLE_ID (video/ảnh hero + video demo).
// Kèm CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.
// Thiếu biến nào thì hàm bên dưới tự bỏ qua (trả về rỗng), không làm sập build.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { cache } from 'react';

// Cache xuống file trên đĩa (không phải biến trong bộ nhớ) — ở `next dev`, mỗi route được
// Next.js biên dịch riêng nên biến module-level không dùng chung được giữa các route khác
// nhau, vẫn gọi lại Airtable + upload lại ảnh lên Cloudinary mỗi lần chuyển trang, rất chậm.
// File trên đĩa thì route nào đọc cũng ra cùng 1 chỗ. Không commit — đã gitignore theo /.cache.
// Mỗi bảng Airtable (sản phẩm, thiết kế riêng, ...) dùng 1 file cache riêng — xem CACHE_FILE
// truyền vào từng hàm get*() bên dưới.
const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_TTL_MS = 60_000; // 1 phút

// `allowStale: true` bỏ qua hạn dùng — chỉ dùng khi vừa gọi Airtable thất bại: lúc đó dữ
// liệu cũ vẫn tốt hơn nhiều so với việc dựng ra một trang thiếu mất cả khối nội dung.
function readDiskCache(cacheFile, { allowStale = false } = {}) {
  try {
    const { cachedAt, data } = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    if (allowStale || Date.now() - cachedAt < CACHE_TTL_MS) return data;
  } catch {
    // Chưa có file cache hoặc đọc lỗi — coi như cache miss, gọi API lại bình thường.
  }
  return null;
}

// Gọi khi fetchAirtableRecords báo thất bại. Hai điều KHÔNG được làm ở đây: trả về rỗng như
// thể bảng trống thật, và ghi cái rỗng đó xuống cache (sẽ khoá luôn 60 giây kế tiếp, và tệ
// hơn là nướng thẳng vào bản build tĩnh mà không ai hay).
function fallbackToStaleCache(cacheFile, label, emptyValue) {
  const stale = readDiskCache(cacheFile, { allowStale: true });
  if (stale) {
    console.warn(`[airtable] Đọc bảng ${label} thất bại — dùng lại dữ liệu cache cũ trên đĩa.`);
    return stale;
  }
  console.warn(`[airtable] Đọc bảng ${label} thất bại và không có cache cũ — trả về rỗng, KHÔNG ghi cache để lần sau thử lại ngay.`);
  return emptyValue;
}

function writeDiskCache(cacheFile, data) {
  try {
    fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
    fs.writeFileSync(cacheFile, JSON.stringify({ cachedAt: Date.now(), data }));
  } catch {
    // Không ghi được (vd môi trường read-only lúc deploy) thì bỏ qua, không phải lỗi nghiêm trọng.
  }
}

const VARIANTS_CACHE_FILE = path.join(CACHE_DIR, 'airtable-variants.json');
const CUSTOM_DESIGNS_CACHE_FILE = path.join(CACHE_DIR, 'airtable-custom-designs.json');
const SITE_MEDIA_CACHE_FILE = path.join(CACHE_DIR, 'airtable-site-media.json');

// Bản đồ publicId -> secure_url của lần upload Cloudinary THÀNH CÔNG gần nhất nhất. Khác các
// cache ở trên: KHÔNG có hạn dùng (CACHE_TTL_MS), vì ảnh trên Cloudinary tồn tại vĩnh viễn trừ
// khi bị xoá tay — đây là phao cứu khi một lượt build gặp Cloudinary lỗi, xem
// fallbackForFailedUpload() cạnh rehostToCloudinary().
const CLOUDINARY_URL_CACHE_FILE = path.join(CACHE_DIR, 'cloudinary-urls.json');

function readCloudinaryUrlCache() {
  try {
    return JSON.parse(fs.readFileSync(CLOUDINARY_URL_CACHE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function rememberCloudinaryUrl(publicId, secureUrl) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    const map = readCloudinaryUrlCache();
    map[publicId] = secureUrl;
    fs.writeFileSync(CLOUDINARY_URL_CACHE_FILE, JSON.stringify(map));
  } catch {
    // Không ghi được thì bỏ qua — lần build sau chỉ mất phao cứu, không mất dữ liệu Airtable.
  }
}

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID;
const AIRTABLE_CUSTOM_DESIGNS_TABLE_ID = process.env.AIRTABLE_CUSTOM_DESIGNS_TABLE_ID;
const AIRTABLE_SITE_MEDIA_TABLE_ID = process.env.AIRTABLE_SITE_MEDIA_TABLE_ID;

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

// `label` chỉ để in ra cảnh báo cho dễ hiểu đang thiếu cấu hình của bảng nào.
//
// Trả về { ok, records }. Phải phân biệt cho bằng được "bảng rỗng thật" (ok: true, records
// rỗng — cache lại bình thường) với "gọi API hỏng" (ok: false — người gọi phải quay về dùng
// cache cũ). Trước đây cả hai đều ra mảng rỗng như nhau nên một cú 429 lúc build là đủ để
// xoá sạch một khối nội dung khỏi trang mà không có lấy một dấu hiệu nào.
async function fetchAirtableRecords(tableId, label) {
  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID || !tableId) {
    // Thiếu cấu hình là chủ ý (chưa khai báo bảng), không phải sự cố — cứ coi là bảng rỗng.
    console.warn(`[airtable] Thiếu cấu hình cho bảng ${label} trong .env.local — bỏ qua, coi như bảng rỗng.`);
    return { ok: true, records: [] };
  }

  const records = [];
  let offset;

  // Next.js vá đè global fetch và lưu response vào .next/cache/fetch-cache theo URL. Vì
  // `output: export` cấm dùng cache:'no-store' (route sẽ thành dynamic và build gãy), ta
  // phá cache bằng cách cho mỗi lần đọc thật một URL khác nhau. Airtable bỏ qua tham số
  // lạ này (đã kiểm chứng: vẫn 200 và trả đủ records).
  //
  // Không có nó thì build sau ăn lại response cũ: đã từng khiến site dựng ra 2 dòng trống
  // trong khi Airtable có 6 mẫu thật, và không báo bất kỳ lỗi nào.
  const cacheBuster = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

  do {
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableId}`);
    url.searchParams.set('_cb', cacheBuster);
    if (offset) url.searchParams.set('offset', offset);

    // Để nguyên chế độ cache mặc định — dùng cache:'no-store' ở đây sẽ biến route thành
    // dynamic và làm gãy `output: export` (xem cacheBuster ở trên để biết cách xử lý).
    let res;
    try {
      res = await fetch(url, {
        headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
      });
    } catch (err) {
      // Mất mạng / DNS hỏng. Trước đây lỗi này ném xuyên lên và làm sập cả `next build`.
      console.warn(`[airtable] Không gọi được API cho bảng ${label}:`, err.message);
      return { ok: false, records: [] };
    }

    if (!res.ok) {
      console.warn(`[airtable] Lấy dữ liệu bảng ${label} thất bại:`, res.status, await res.text());
      return { ok: false, records: [] };
    }

    let data;
    try {
      data = await res.json();
    } catch (err) {
      console.warn(`[airtable] Phản hồi của bảng ${label} không phải JSON hợp lệ:`, err.message);
      return { ok: false, records: [] };
    }

    records.push(...(data.records || []));
    offset = data.offset;
  } while (offset);
  // Gãy ở trang thứ 2 thì bỏ luôn cả mẻ: nửa danh sách trông vẫn "hợp lý" nên sẽ lặng lẽ
  // thay thế dữ liệu đủ trong cache — hỏng kiểu đó khó phát hiện hơn là rỗng hẳn.

  return { ok: true, records };
}

function signCloudinaryParams(params) {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return crypto.createHash('sha1').update(toSign + CLOUDINARY_API_SECRET).digest('hex');
}

// Gọi khi một lượt upload lên Cloudinary lỗi TRONG KHI cấu hình đã đủ — nghĩa là đáng lẽ phải
// thành công (khác nhánh "thiếu cấu hình" ở trên, vốn là trạng thái dev cục bộ chủ ý).
//
// KHÔNG được trả link tạm của Airtable ở đây: `next build` sẽ nướng thẳng giá trị trả về vào
// HTML tĩnh, link đó hết hạn sau vài giờ và ảnh vỡ trên site thật mà không ai hay — đúng lỗi
// đã xảy ra thật. Ưu tiên URL Cloudinary của lần upload thành công gần nhất (ảnh đó vẫn còn
// vĩnh viễn trừ khi bị xoá tay trên Cloudinary); không có thì trả null để nơi gọi coi như
// "chưa có ảnh" — mất 1 ảnh vẫn đỡ hơn nướng vào build 1 link chắc chắn sẽ hỏng.
function fallbackForFailedUpload(publicId, label) {
  const cachedUrl = publicId ? readCloudinaryUrlCache()[publicId] : null;
  if (cachedUrl) {
    console.warn(`[cloudinary] Upload ${label} thất bại — dùng lại URL Cloudinary của lần build trước.`);
    return cachedUrl;
  }
  console.warn(`[cloudinary] Upload ${label} thất bại và chưa từng upload thành công trước đó — bỏ ảnh này (không dùng link Airtable tạm vì sẽ hết hạn).`);
  return null;
}

// Nhờ Cloudinary tự tải file từ 1 URL tạm (link Airtable) về lưu vĩnh viễn, trả link mới.
//
// QUAN TRỌNG — `publicId` phải CỐ ĐỊNH theo từng ảnh (dùng attachment id của Airtable):
// nếu không gửi public_id, Cloudinary tự sinh id ngẫu nhiên nên MỖI LẦN gọi lại đẻ ra một
// asset mới. Cache chỉ sống 1 phút, mà `next dev` render lại liên tục và mỗi `next build`
// cũng gọi lại — trước đây việc này đã tạo ~1.480 bản sao cho vỏn vẹn 11 ảnh thật.
// Kèm `overwrite: false` để lần thứ hai trở đi Cloudinary trả về đúng asset đã có.
//
// Không dùng link Airtable làm khoá được vì link đó là link tạm, đổi liên tục; còn
// attachment id thì giữ nguyên cho tới khi bạn thay ảnh khác trong Airtable — thay ảnh
// thì id đổi, tạo asset mới, đúng như mong muốn.
async function rehostToCloudinary(remoteUrl, { folder, publicId }) {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.warn('[cloudinary] Thiếu cấu hình Cloudinary trong .env.local — giữ nguyên link Airtable (sẽ hết hạn).');
    return remoteUrl;
  }

  const label = `${folder}/${publicId || '(không có publicId)'}`;

  if (!publicId) {
    // Không có khoá cố định thì không thể tra lại cache theo publicId — coi như lỗi upload
    // không có phao cứu, xem fallbackForFailedUpload(). Trước đây nhánh này trả link Airtable
    // tạm, cũng hỏng y hệt các nhánh lỗi khác nên gộp chung xử lý cho nhất quán.
    console.warn('[cloudinary] Thiếu publicId cố định — bỏ qua upload để tránh tạo ảnh trùng.');
    return fallbackForFailedUpload(publicId, label);
  }

  const timestamp = Math.floor(Date.now() / 1000);
  // Chữ ký phải phủ đúng bộ tham số gửi lên (trừ file/api_key) — xem signCloudinaryParams.
  const params = { folder, overwrite: 'false', public_id: publicId, timestamp };
  const signature = signCloudinaryParams(params);

  const body = new URLSearchParams({
    ...params,
    timestamp: String(timestamp),
    file: remoteUrl,
    api_key: CLOUDINARY_API_KEY,
    signature,
  });

  let res;
  try {
    res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, {
      method: 'POST',
      body,
    });
  } catch (err) {
    // Mất mạng / DNS hỏng. Trước đây lỗi này ném xuyên lên, làm sập cả Promise.all và cả
    // `next build` chỉ vì MỘT ảnh không upload được.
    console.warn(`[cloudinary] Không gọi được API để upload ${label}:`, err.message);
    return fallbackForFailedUpload(publicId, label);
  }

  if (!res.ok) {
    console.warn(`[cloudinary] Re-host ${label} thất bại:`, res.status, await res.text());
    return fallbackForFailedUpload(publicId, label);
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    console.warn(`[cloudinary] Phản hồi upload ${label} không phải JSON hợp lệ:`, err.message);
    return fallbackForFailedUpload(publicId, label);
  }

  if (!data.secure_url) {
    console.warn(`[cloudinary] Upload ${label} không trả về secure_url:`, JSON.stringify(data));
    return fallbackForFailedUpload(publicId, label);
  }

  rememberCloudinaryUrl(publicId, data.secure_url);
  return data.secure_url;
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

// Cột "Description" nhiều người điền <br> (gõ tay để tạo dòng mới khi xem trên site) hoặc
// xuống dòng thật (Enter trong ô Long text của Airtable). Cả 2 kiểu đều KHÔNG được đưa
// nguyên vào <meta description>/Open Graph/JSON-LD — những chỗ đó bắt buộc văn bản thuần 1
// dòng, lẫn thẻ HTML thô vào sẽ hiện thành chữ "<br>" xấu xí trên kết quả tìm kiếm Google.
// (Phần hiển thị trên trang thì dùng renderMultiline trong VariantDetail.jsx — vẽ <br/> thật
// bằng React, không dùng dangerouslySetInnerHTML nên không có rủi ro XSS với dữ liệu Airtable.)
export function toPlainText(text) {
  if (!text) return '';
  return text
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Trả về { 'bang-nfc': [variant, ...], standee: [variant, ...] } từ các dòng đã tick Published.
// Bọc trong React.cache để nhiều component dùng chung 1 lần gọi trong cùng 1 lượt render.
export const getVariantsByProduct = cache(async function getVariantsByProduct() {
  const cached = readDiskCache(VARIANTS_CACHE_FILE);
  if (cached) return cached;

  const { ok, records } = await fetchAirtableRecords(AIRTABLE_TABLE_ID, 'sản phẩm (AIRTABLE_TABLE_ID)');
  if (!ok) return fallbackToStaleCache(VARIANTS_CACHE_FILE, 'sản phẩm', {});

  // Xử lý song song thay vì tuần tự — upload ảnh lên Cloudinary của các mẫu không phụ
  // thuộc nhau, tuần tự thì 6 mẫu = 6 lần chờ nối tiếp, song song thì chỉ chờ bằng 1 lần.
  const processed = await Promise.all(records.map(async (record) => {
    const f = record.fields || {};
    if (!f.Published) return null;

    const productId = CATEGORY_TO_PRODUCT_ID[f.Category];
    if (!productId) return null;

    // Field Image trong Airtable cho phép đính NHIỀU ảnh — trước đây chỉ lấy f.Image[0] nên
    // 1 mẫu upload 4 ảnh chỉ hiện được đúng 1 ảnh trên trang chi tiết. Lấy hết, re-host song
    // song (từng ảnh khoá bằng chính attachment id nên không đẻ trùng — xem rehostToCloudinary).
    const attachments = Array.isArray(f.Image) ? f.Image.filter((a) => a?.url) : [];
    const images = (
      await Promise.all(attachments.map((a, i) => rehostToCloudinary(a.url, {
        folder: 'quicktap-products',
        publicId: a.id || `${record.id}-${i}`,
      })))
    ).filter(Boolean); // bỏ ảnh nào upload lỗi (rehostToCloudinary trả null — xem fallbackForFailedUpload)
    const image = images[0] || null; // ảnh đại diện — vẫn giữ để không phá các nơi chỉ cần 1 ảnh

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
        images,
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

  writeDiskCache(VARIANTS_CACHE_FILE, grouped);
  return grouped;
});

// Ảnh cho khối "Thiết kế riêng" ngoài trang chủ — đọc từ MỘT BẢNG AIRTABLE RIÊNG
// (AIRTABLE_CUSTOM_DESIGNS_TABLE_ID), tách khỏi bảng sản phẩm để hai bên không lẫn nhau.
//
// Bảng chỉ cần 2 cột:
//   Name  (Single line text)  — mô tả ngắn, dùng làm alt cho ảnh (hỗ trợ đọc màn hình + SEO)
//   Image (Attachment)        — ảnh mẫu thiết kế
// Dòng nào chưa có ảnh thì tự bỏ qua (không render ô trống).
export const getCustomDesigns = cache(async function getCustomDesigns() {
  const cached = readDiskCache(CUSTOM_DESIGNS_CACHE_FILE);
  if (cached) return cached;

  const { ok, records } = await fetchAirtableRecords(
    AIRTABLE_CUSTOM_DESIGNS_TABLE_ID,
    'thiết kế riêng (AIRTABLE_CUSTOM_DESIGNS_TABLE_ID)',
  );
  if (!ok) return fallbackToStaleCache(CUSTOM_DESIGNS_CACHE_FILE, 'thiết kế riêng', []);

  // Song song như bảng sản phẩm — các ảnh không phụ thuộc nhau nên không cần chờ nối tiếp.
  const processed = await Promise.all(records.map(async (record) => {
    const f = record.fields || {};

    // Bảng này không bắt buộc có cột Published. Nếu sau này bạn thêm cột đó để ẩn/hiện
    // từng mẫu thì dòng dưới tự có tác dụng; còn chưa có cột thì mọi dòng đều hiện.
    if (f.Published === false) return null;

    const attachment = Array.isArray(f.Image) ? f.Image[0] : null;
    if (!attachment?.url) return null; // không có ảnh thì không có gì để hiện

    const image = await rehostToCloudinary(attachment.url, {
      folder: 'quicktap-custom-designs',
      publicId: attachment.id || record.id,
    });
    // rehostToCloudinary trả null khi upload lỗi và không có ảnh cũ để dùng lại (xem
    // fallbackForFailedUpload) — bỏ mẫu này, tốt hơn là hiện ảnh vỡ hoặc link Airtable sắp hết hạn.
    if (!image) return null;

    return { id: record.id, alt: f.Name || '', image };
  }));

  const designs = processed.filter(Boolean);

  writeDiskCache(CUSTOM_DESIGNS_CACHE_FILE, designs);
  return designs;
});

// Video/ảnh lớn của trang chủ — cũng đọc từ MỘT BẢNG AIRTABLE RIÊNG
// (AIRTABLE_SITE_MEDIA_TABLE_ID) thay vì hardcode link trong lib/siteConfig.js.
//
// Bảng dạng "mỗi dòng một ô trên trang", cần 3 cột:
//   Key  (Single line text) — heroVideo | heroImage | demoVideo  (xem MEDIA_KEYS bên dưới)
//   File (Attachment)       — video .mp4 hoặc ảnh
//   Alt  (Single line text) — mô tả cho người dùng trình đọc màn hình; bỏ trống cũng được,
//                             sẽ lấy câu mặc định trong lib/siteConfig.js
//
// Trả về { heroVideo: {url, alt} | null, heroImage: ..., demoVideo: ... } — ô nào chưa có
// dòng/chưa có file thì là null, trang chủ tự lùi về phương án dự phòng (xem app/page.js).
const MEDIA_KEYS = {
  herovideo: 'heroVideo',
  heroimage: 'heroImage',
  demovideo: 'demoVideo',
};

export const getSiteMedia = cache(async function getSiteMedia() {
  const cached = readDiskCache(SITE_MEDIA_CACHE_FILE);
  if (cached) return cached;

  const { ok, records } = await fetchAirtableRecords(
    AIRTABLE_SITE_MEDIA_TABLE_ID,
    'media trang chủ (AIRTABLE_SITE_MEDIA_TABLE_ID)',
  );
  if (!ok) {
    return fallbackToStaleCache(SITE_MEDIA_CACHE_FILE, 'media trang chủ', {
      heroVideo: null, heroImage: null, demoVideo: null,
    });
  }

  const processed = await Promise.all(records.map(async (record) => {
    const f = record.fields || {};
    if (f.Published === false) return null;

    // Chấp nhận "heroVideo", "Hero Video", "hero-video"... cho đỡ phải gõ chính xác.
    const key = MEDIA_KEYS[String(f.Key || '').toLowerCase().replace(/[^a-z0-9]/g, '')];
    if (!key) return null;

    const attachment = Array.isArray(f.File) ? f.File[0] : null;
    if (!attachment?.url) return null;

    // /auto/upload nhận cả ảnh lẫn video, Cloudinary tự nhận dạng và trả secure_url đúng
    // loại (/image/upload/... hay /video/upload/...).
    const url = await rehostToCloudinary(attachment.url, {
      folder: 'quicktap-site-media',
      publicId: attachment.id || record.id,
    });
    // null khi upload lỗi và không có URL cũ để dùng lại — coi như dòng này chưa có file, để
    // app/page.js tự lùi về phương án dự phòng (ảnh → SVG) thay vì render <video src={null}>.
    if (!url) return null;

    return [key, { url, alt: f.Alt || '' }];
  }));

  const media = { heroVideo: null, heroImage: null, demoVideo: null };
  for (const item of processed) {
    if (item) media[item[0]] = item[1];
  }

  writeDiskCache(SITE_MEDIA_CACHE_FILE, media);
  return media;
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
