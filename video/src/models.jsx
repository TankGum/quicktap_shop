import { staticFile } from 'remotion';
import './models.css';

// Kích thước thật (mm), khớp components/Standee3D.jsx của website.
const PW = 105;
const PH = 148;
const TH = 2;
const DEPTH = 47;
const CARD = 100;
const FOLD = Math.asin(DEPTH / (2 * PH));
const FEET = PH * Math.cos(FOLD);

// Ống kính tỉ lệ theo cỡ mô hình: phóng to mô hình (tăng mm) mà giữ nguyên độ méo phối cảnh,
// như zoom ống kính chứ không phải dí máy quay sát vào vật.
const LENS_MM = 650;

const img = (name) => `url(${staticFile(`assets/standee3d/${name}.png`)})`;

// Mỗi mô hình có "máy quay" riêng đặt ngay tâm nó (perspective-origin là góc 0×0 của holder).
function Holder({ x, y, mm, opacity = 1, children }) {
  return (
    <div
      className="qt-holder"
      style={{ left: x, top: y, perspective: LENS_MM * mm, opacity }}
    >
      {children}
    </div>
  );
}

function standStyle({ mm, rx, ry, extra }) {
  return {
    '--mm': `${mm}px`,
    '--fold': `${(FOLD * 180) / Math.PI}deg`,
    '--sin': Math.sin(FOLD),
    '--cos': Math.cos(FOLD),
    transform: `rotateX(${rx}deg) rotateY(${ry}deg)`,
    ...extra,
  };
}

const Box = ({ art, sheen }) => (
  <>
    <i className={`std3d-f std3d-out${art ? ` std3d-art-${art}` : ''}`}>
      {sheen != null && <b className="qt-sheen" style={{ '--sheen': sheen }} />}
    </i>
    <i className="std3d-f std3d-in" />
    <i className="std3d-f std3d-sl" />
    <i className="std3d-f std3d-sr" />
    <i className="std3d-f std3d-st" />
    <i className="std3d-f std3d-sb" />
  </>
);

export function Standee({ model, x, y, mm, rx, ry, opacity, sheen }) {
  return (
    <Holder x={x} y={y} mm={mm} opacity={opacity}>
      <div
        className="std3d-stand"
        style={standStyle({
          mm, rx, ry,
          extra: { '--front': img(`${model}-front`), '--back': img(`${model}-back`), '--base': img(`${model}-base`) },
        })}
      >
        <div className="std3d-node std3d-rig">
          <div className="std3d-node std3d-n-front">
            <div className="std3d-slab std3d-panel"><Box art="front" sheen={sheen} /></div>
          </div>
          <div className="std3d-node std3d-n-back">
            <div className="std3d-slab std3d-panel"><Box art="back" /></div>
          </div>
          <div className="std3d-node std3d-n-base">
            <div className="std3d-slab std3d-base"><Box /></div>
          </div>
          <div className="std3d-node std3d-n-shadow"><i className="std3d-shadow" /></div>
        </div>
      </div>
    </Holder>
  );
}

export function Card({ art, x, y, mm, rx, ry, opacity, sheen }) {
  return (
    <Holder x={x} y={y} mm={mm} opacity={opacity}>
      <div className="std3d-stand" style={standStyle({ mm, rx, ry, extra: { '--front': img(art) } })}>
        <div className="std3d-node">
          <div className="std3d-slab std3d-cardslab">
            <i className="std3d-f std3d-out std3d-art-front">
              {sheen != null && <b className="qt-sheen" style={{ '--sheen': sheen }} />}
            </i>
            <i className="std3d-f std3d-in" />
            {['ce-r', 'ce-l', 'ce-t', 'ce-b', 'cc-1', 'cc-2', 'cc-3', 'cc-4'].map((k) => (
              <i key={k} className={`std3d-f std3d-${k.slice(0, 2)} std3d-${k}`} />
            ))}
          </div>
          <div className="std3d-node std3d-n-cardshadow"><i className="std3d-shadow" /></div>
        </div>
      </div>
    </Holder>
  );
}

// ---- Chiếu một điểm trên mặt in ra toạ độ màn hình ----
// Để đặt hiệu ứng 2D (sóng NFC, vạch quét QR) đúng chỗ trên sản phẩm đang xoay, tính lại
// đúng chuỗi transform CSS ở trên. Ma trận xoay theo đặc tả CSS (trục y hướng xuống, z hướng
// về phía người xem); `a·b·p` nghĩa là transform viết "a b" trong CSS áp lên điểm p.

const rad = (d) => (d * Math.PI) / 180;
const rotX = (a, [x, y, z]) => [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];
const rotY = (a, [x, y, z]) => [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)];

function toScreen(p, { x, y, mm, rx, ry }) {
  const [px, py, pz] = rotX(rad(rx), rotY(rad(ry), p));
  const k = (LENS_MM * mm) / (LENS_MM * mm - pz);
  return { x: x + px * k, y: y + py * k, k };
}

// (u, v) là toạ độ tỉ lệ 0..1 trên ảnh mặt trước, tính từ góc trên-trái.
export function cardPoint(u, v, cam) {
  const { mm } = cam;
  return toScreen([(u - 0.5) * CARD * mm, (v - 0.5) * CARD * mm, (TH / 2) * mm], cam);
}

export function standeeFrontPoint(u, v, cam) {
  const { mm } = cam;
  let p = [(u - 0.5) * PW * mm, (v - 0.5) * PH * mm + (PH / 2) * mm, (TH / 2) * mm];
  p = rotX(FOLD, p);
  p = [p[0], p[1] - (FEET / 2) * mm, p[2]];
  return toScreen(p, cam);
}

export const STANDEE_H_MM = FEET + TH;
export const CARD_MM = CARD;
