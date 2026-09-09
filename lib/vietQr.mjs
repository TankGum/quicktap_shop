// Sinh chuỗi VietQR để vẽ mã QR chuyển khoản.
//
// VietQR là CHUẨN CHUNG (EMVCo / Napas), không phải dịch vụ phải mua: chuỗi dưới đây tự dựng
// được hết, không gọi API ai cả. Cố ý không nhúng ảnh từ img.vietqr.io — đó là phụ thuộc mạng
// ngoài đặt đúng vào khoảnh khắc khách sắp trả tiền, dịch vụ chậm hay chặn tần suất là khách
// nhìn thấy ảnh vỡ. Repo đã học bài này hai lần (link Cloudinary hardcode làm gãy trang,
// Airtable chỉ được đụng lúc build).
//
// Định dạng: chuỗi TLV lồng nhau — mỗi trường là <id 2 số><độ dài 2 số><nội dung> — rồi 4 ký
// tự CRC ở cuối. Sai một ký tự độ dài là app ngân hàng báo "mã không hợp lệ", nhìn ảnh QR
// không thấy khác gì cả; đó là lý do file này để .mjs và có test riêng.

// GUID của Napas trong trường Merchant Account Information — cố định cho mọi mã VietQR.
const NAPAS_GUID = 'A000000727';
// Chuyển khoản nhanh tới SỐ TÀI KHOẢN (khác QRIBFTTC là tới số thẻ).
const SERVICE_TRANSFER_TO_ACCOUNT = 'QRIBFTTA';
const CURRENCY_VND = '704';
const COUNTRY_VN = 'VN';

/**
 * Một trường TLV. Độ dài tính theo KÝ TỰ và chỉ đúng khi nội dung là ASCII — nên chặn thẳng ở
 * đây thay vì để chuỗi lệch đi âm thầm. Mọi thứ mình nhét vào (mã ngân hàng, số tài khoản, số
 * tiền, mã đơn TK-XXXX) đều là ASCII.
 */
function tlv(id, value) {
  const s = String(value);
  if (!/^[\x20-\x7E]*$/.test(s)) {
    throw new Error(`vietQr: trường ${id} có ký tự ngoài ASCII: ${JSON.stringify(s)}`);
  }
  if (s.length > 99) throw new Error(`vietQr: trường ${id} dài quá 99 ký tự`);
  return `${id}${String(s.length).padStart(2, '0')}${s}`;
}

/**
 * CRC-16/CCITT-FALSE: khởi tạo 0xFFFF, đa thức 0x1021, không đảo bit, không XOR cuối.
 * Tính trên TOÀN BỘ chuỗi ĐÃ gồm cả "6304" ở cuối — đó là quy định của chuẩn, bỏ 4 ký tự đó
 * ra khỏi phép tính là mã quét không ra.
 */
export function crc16(input) {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= (input.charCodeAt(i) & 0xff) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Bỏ dấu tiếng Việt và ký tự lạ khỏi nội dung chuyển khoản.
 *
 * Nội dung CK của mình chỉ là mã đơn (TK-8F3K) nên vốn đã sạch — hàm này là lưới an toàn cho
 * trường hợp sau này có người nối thêm tên quán vào nội dung. Ngân hàng cũng thường tự bỏ dấu,
 * nên gửi đi bản không dấu thì hai bên nhìn thấy cùng một chuỗi.
 */
export function asciiFold(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^\x20-\x7E]/g, '')
    .trim();
}

/**
 * @param {object} p
 * @param {string} p.bankBin   mã ngân hàng 6 chữ số theo Napas (vd '970436' = Vietcombank)
 * @param {string} p.accountNo số tài khoản
 * @param {number} p.amount    số tiền VND, số nguyên dương
 * @param {string} p.addInfo   nội dung chuyển khoản — ở đây luôn là mã đơn
 * @returns {string} chuỗi để vẽ thành QR
 */
export function buildVietQrPayload({ bankBin, accountNo, amount, addInfo }) {
  if (!/^\d{6}$/.test(String(bankBin || ''))) {
    throw new Error('vietQr: bankBin phải là 6 chữ số (mã ngân hàng theo Napas)');
  }
  if (!/^\d{4,19}$/.test(String(accountNo || ''))) {
    throw new Error('vietQr: accountNo phải là chuỗi chữ số');
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('vietQr: amount phải là số nguyên dương (VND, không có phần lẻ)');
  }

  const merchantAccount =
    tlv('00', NAPAS_GUID) +
    tlv('01', tlv('00', String(bankBin)) + tlv('01', String(accountNo))) +
    tlv('02', SERVICE_TRANSFER_TO_ACCOUNT);

  const body =
    tlv('00', '01') +
    // '12' = mã dùng MỘT LẦN (đã gắn sẵn số tiền). '11' là mã tĩnh dùng lại nhiều lần — dùng
    // nhầm '11' thì app ngân hàng bỏ qua số tiền và bắt khách tự gõ, đúng thứ mình muốn tránh.
    tlv('01', '12') +
    tlv('38', merchantAccount) +
    tlv('53', CURRENCY_VND) +
    tlv('54', String(amount)) +
    tlv('58', COUNTRY_VN) +
    tlv('62', tlv('08', asciiFold(addInfo)));

  const withCrcTag = `${body}6304`;
  return withCrcTag + crc16(withCrcTag);
}
