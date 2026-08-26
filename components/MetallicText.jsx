'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hiệu ứng "metallic paint" (kim loại lỏng) cho MỘT ĐOẠN CHỮ.
 *
 * Shader lấy từ MetallicPaint của React Bits (reactbits.dev/animations/metallic-paint).
 * Bản gốc nhận `imageSrc` là ẢNH LOGO nền trắng, vẽ ra canvas VUÔNG 1000x1000 — không dùng
 * thẳng cho chữ trong câu được. Ở đây thay phần nguồn ảnh bằng: tự rasterize chính đoạn chữ
 * đó ra canvas ẩn (đúng font/cỡ/độ đậm/tracking mà CSS đang áp cho nó), rồi canvas hiển thị
 * lấy đúng khung chữ thật thay vì khung vuông.
 *
 * Chữ THẬT vẫn nằm trong HTML (chỉ bị `color: transparent` khi hiệu ứng bật) — Google, trình
 * đọc màn hình và thao tác bôi-đen-copy đều còn nguyên. Canvas là lớp trang trí, aria-hidden.
 *
 * Tự tắt (trả về chữ thường) khi: không có WebGL2, font chưa tải xong, hoặc đoạn chữ bị
 * NGẮT XUỐNG NHIỀU DÒNG — một canvas phẳng không thể phủ lên 2 mảnh chữ ở 2 dòng khác nhau.
 */

const vertexShader = `#version 300 es
precision highp float;
in vec2 a_position;
out vec2 vP;
void main(){vP=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}`;

const fragmentShader = `#version 300 es
precision highp float;
in vec2 vP;
out vec4 oC;
uniform sampler2D u_tex;
uniform float u_time,u_ratio,u_imgRatio,u_seed,u_scale,u_refract,u_blur,u_liquid;
uniform float u_bright,u_contrast,u_angle,u_fresnel,u_sharp,u_wave,u_noise,u_chroma;
uniform float u_distort,u_contour;
uniform vec3 u_lightColor,u_darkColor,u_tint;

vec3 sC,sM;

vec3 pW(vec3 v){
  vec3 i=floor(v),f=fract(v),s=sign(fract(v*.5)-.5),h=fract(sM*i+i.yzx),c=f*(f-1.);
  return s*c*((h*16.-4.)*c-1.);
}

vec3 aF(vec3 b,vec3 c){return pW(b+c.zxy-pW(b.zxy+c.yzx)+pW(b.yzx+c.xyz));}
vec3 lM(vec3 s,vec3 p){return(p+aF(s,p))*.5;}

vec2 fA(){
  vec2 c=vP-.5;
  c.x*=u_ratio>u_imgRatio?u_ratio/u_imgRatio:1.;
  c.y*=u_ratio>u_imgRatio?1.:u_imgRatio/u_ratio;
  return vec2(c.x+.5,.5-c.y);
}

vec2 rot(vec2 p,float r){float c=cos(r),s=sin(r);return vec2(p.x*c+p.y*s,p.y*c-p.x*s);}

float bM(vec2 c,float t){
  vec2 l=smoothstep(vec2(0.),vec2(t),c),u=smoothstep(vec2(0.),vec2(t),1.-c);
  return l.x*l.y*u.x*u.y;
}

float mG(float hi,float lo,float t,float sh,float cv){
  sh*=(2.-u_sharp);
  float ci=smoothstep(.15,.85,cv),r=lo;
  float e1=.08/u_scale;
  r=mix(r,hi,smoothstep(0.,sh*1.5,t));
  r=mix(r,lo,smoothstep(e1-sh,e1+sh,t));
  float e2=e1+.05/u_scale*(1.-ci*.35);
  r=mix(r,hi,smoothstep(e2-sh,e2+sh,t));
  float e3=e2+.025/u_scale*(1.-ci*.45);
  r=mix(r,lo,smoothstep(e3-sh,e3+sh,t));
  float e4=e1+.1/u_scale;
  r=mix(r,hi,smoothstep(e4-sh,e4+sh,t));
  float rm=1.-e4,gT=clamp((t-e4)/rm,0.,1.);
  r=mix(r,mix(hi,lo,smoothstep(0.,1.,gT)),smoothstep(e4-sh*.5,e4+sh*.5,t));
  return r;
}

void main(){
  sC=fract(vec3(.7548,.5698,.4154)*(u_seed+17.31))+.5;
  sM=fract(sC.zxy-sC.yzx*1.618);
  vec2 sc=vec2(vP.x*u_ratio,1.-vP.y);
  float angleRad=u_angle*3.14159/180.;
  sc=rot(sc-.5,angleRad)+.5;
  sc=clamp(sc,0.,1.);
  float sl=sc.x-sc.y,an=u_time*.001;
  vec2 iC=fA();
  vec4 texSample=texture(u_tex,iC);
  float dp=texSample.r;
  float shapeMask=texSample.a;
  vec3 hi=u_lightColor*u_bright;
  vec3 lo=u_darkColor*(2.-u_bright);
  lo.b+=smoothstep(.6,1.4,sc.x+sc.y)*.08;
  vec2 fC=sc-.5;
  float rd=length(fC+vec2(0.,sl*.15));
  vec2 ag=rot(fC,(.22-sl*.18)*3.14159);
  float cv=1.-pow(rd*1.65,1.15);
  cv*=pow(sc.y,.35);
  float vs=shapeMask;
  vs*=bM(iC,.01);
  float fr=pow(1.-cv,u_fresnel)*.3;
  vs=min(vs+fr*vs,1.);
  float mT=an*.0625;
  vec3 wO=vec3(-1.05,1.35,1.55);
  vec3 wA=aF(vec3(31.,73.,56.),mT+wO)*.22*u_wave;
  vec3 wB=aF(vec3(24.,64.,42.),mT-wO.yzx)*.22*u_wave;
  vec2 nC=sc*45.*u_noise;
  nC+=aF(sC.zxy,an*.17*sC.yzx-sc.yxy*.35).xy*18.*u_wave;
  vec3 tC=vec3(.00041,.00053,.00076)*mT+wB*nC.x+wA*nC.y;
  tC=lM(sC,tC);
  tC=lM(sC+1.618,tC);
  float tb=sin(tC.x*3.14159)*.5+.5;
  tb=tb*2.-1.;
  float noiseVal=pW(vec3(sc*8.+an,an*.5)).x;
  float edgeFactor=smoothstep(0.,.5,dp)*smoothstep(1.,.5,dp);
  float lD=dp+(1.-dp)*u_liquid*tb;
  lD+=noiseVal*u_distort*.15*edgeFactor;
  float rB=clamp(1.-cv,0.,1.);
  float fl=ag.x+sl;
  fl+=noiseVal*sl*u_distort*edgeFactor;
  fl*=mix(1.,1.-dp*.5,u_contour);
  fl-=dp*u_contour*.8;
  float eI=smoothstep(0.,1.,lD)*smoothstep(1.,0.,lD);
  fl-=tb*sl*1.8*eI;
  float cA=cv*clamp(pow(sc.y,.12),.25,1.);
  fl*=.12+(1.05-lD)*cA;
  fl*=smoothstep(1.,.65,lD);
  float vA1=smoothstep(.08,.18,sc.y)*smoothstep(.38,.18,sc.y);
  float vA2=smoothstep(.08,.18,1.-sc.y)*smoothstep(.38,.18,1.-sc.y);
  fl+=vA1*.16+vA2*.025;
  fl*=.45+pow(sc.y,2.)*.55;
  fl*=u_scale;
  fl-=an;
  float rO=rB+cv*tb*.025;
  float vM1=smoothstep(-.12,.18,sc.y)*smoothstep(.48,.08,sc.y);
  float cM1=smoothstep(.35,.55,cv)*smoothstep(.95,.35,cv);
  rO+=vM1*cM1*4.5;
  rO-=sl;
  float bO=rB*1.25;
  float vM2=smoothstep(-.02,.35,sc.y)*smoothstep(.75,.08,sc.y);
  float cM2=smoothstep(.35,.55,cv)*smoothstep(.75,.35,cv);
  bO+=vM2*cM2*.9;
  bO-=lD*.18;
  rO*=u_refract*u_chroma;
  bO*=u_refract*u_chroma;
  float sf=u_blur;
  float rP=fract(fl+rO);
  float rC=mG(hi.r,lo.r,rP,sf+.018+u_refract*cv*.025,cv);
  float gP=fract(fl);
  float gC=mG(hi.g,lo.g,gP,sf+.008/max(.01,1.-sl),cv);
  float bP=fract(fl-bO);
  float bC=mG(hi.b,lo.b,bP,sf+.008,cv);
  vec3 col=vec3(rC,gC,bC);
  col=(col-.5)*u_contrast+.5;
  col=clamp(col,0.,1.);
  col=mix(col,1.-min(vec3(1.),(1.-col)/max(u_tint,vec3(.001))),length(u_tint-1.)*.5);
  col=clamp(col,0.,1.);
  oC=vec4(col*vs,vs);
}`;

// Kênh R của texture là "độ sâu" — điểm càng nằm sâu trong lòng nét chữ thì càng tối. Shader
// dùng nó để uốn dải sáng theo hình chữ (nếu không thì các dải kim loại chỉ là sọc thẳng đè
// lên một cái khuôn phẳng).
//
// Bản gốc giải phương trình Laplace 200 vòng NGAY TRÊN ảnh gốc (tới 1000x1000 px). Ở đây
// không làm vậy được: mặt nạ phải sắc nét bằng đúng canvas hiển thị (nếu không mép nét chữ
// nhoè hẳn ra khi phóng lên), mà giải Laplace ở độ phân giải đó thì tốn hàng chục triệu phép
// tính, treo luồng chính cả giây. Nên tách đôi:
//   - kênh ALPHA (quyết định hình nét chữ) lấy từ bản rasterize ĐỘ PHÂN GIẢI ĐẦY ĐỦ;
//   - kênh ĐỘ SÂU giải trên một lưới thu nhỏ rồi nội suy tuyến tính phóng ngược lên.
// Được cả hai: nét chữ sắc, phần tính nặng chỉ chạy trên vài chục nghìn ô.
const MAX_DEPTH_CELLS = 36000;

function solveDepth(alphaGrid, width, height) {
  const size = width * height;
  const inside = new Uint8Array(size);
  const boundary = new Uint8Array(size);

  for (let i = 0; i < size; i++) inside[i] = alphaGrid[i] > 0.1 ? 1 : 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (!inside[idx]) continue;
      if (
        x === 0 || x === width - 1 || y === 0 || y === height - 1 ||
        !inside[idx - 1] || !inside[idx + 1] ||
        !inside[idx - width] || !inside[idx + width]
      ) {
        boundary[idx] = 1;
      }
    }
  }

  const u = new Float32Array(size);
  const C = 0.01;
  const omega = 1.85;
  // Mỗi vòng lặp thông tin chỉ lan vào trong 1 ô, nên bề dày nét (tính bằng ô) quyết định số
  // vòng cần thiết. Chặn trên 200 để lưới to bất thường cũng không treo luồng chính.
  const iterations = Math.min(200, Math.max(40, Math.round(height * 0.75)));

  for (let iter = 0; iter < iterations; iter++) {
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (!inside[idx] || boundary[idx]) continue;
        const sum =
          (inside[idx + 1] ? u[idx + 1] : 0) +
          (inside[idx - 1] ? u[idx - 1] : 0) +
          (inside[idx + width] ? u[idx + width] : 0) +
          (inside[idx - width] ? u[idx - width] : 0);
        u[idx] = omega * ((C + sum) / 4) + (1 - omega) * u[idx];
      }
    }
  }

  let maxVal = 0;
  for (let i = 0; i < size; i++) if (u[i] > maxVal) maxVal = u[i];
  if (maxVal === 0) maxVal = 1;
  for (let i = 0; i < size; i++) u[i] /= maxVal;
  return u;
}

function buildTexture(canvas) {
  const width = canvas.width;
  const height = canvas.height;
  const full = canvas.getContext('2d').getImageData(0, 0, width, height).data;

  // Lưới thu nhỏ để giải độ sâu. Dùng chính drawImage của trình duyệt để hạ mẫu (đã lọc sẵn)
  // thay vì tự lấy mẫu điểm — nét mảnh mà lấy mẫu điểm thì đứt quãng thành từng chấm.
  const k = Math.min(1, Math.sqrt(MAX_DEPTH_CELLS / (width * height)));
  const dw = Math.max(2, Math.round(width * k));
  const dh = Math.max(2, Math.round(height * k));

  const small = document.createElement('canvas');
  small.width = dw;
  small.height = dh;
  const sctx = small.getContext('2d', { willReadFrequently: true });
  sctx.drawImage(canvas, 0, 0, dw, dh);
  const sdata = sctx.getImageData(0, 0, dw, dh).data;

  const alphaGrid = new Float32Array(dw * dh);
  for (let i = 0; i < dw * dh; i++) alphaGrid[i] = sdata[i * 4 + 3] / 255;

  const depth = solveDepth(alphaGrid, dw, dh);

  const out = new Uint8Array(width * height * 4);
  const fx = (dw - 1) / Math.max(1, width - 1);
  const fy = (dh - 1) / Math.max(1, height - 1);

  for (let y = 0; y < height; y++) {
    const sy = y * fy;
    const y0 = Math.floor(sy);
    const y1 = Math.min(dh - 1, y0 + 1);
    const ty = sy - y0;
    for (let x = 0; x < width; x++) {
      const sx = x * fx;
      const x0 = Math.floor(sx);
      const x1 = Math.min(dw - 1, x0 + 1);
      const tx = sx - x0;

      const d =
        depth[y0 * dw + x0] * (1 - tx) * (1 - ty) +
        depth[y0 * dw + x1] * tx * (1 - ty) +
        depth[y1 * dw + x0] * (1 - tx) * ty +
        depth[y1 * dw + x1] * tx * ty;

      const i = y * width + x;
      const gray = Math.round(255 * (1 - d * d));
      out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = gray;
      out[i * 4 + 3] = full[i * 4 + 3];
    }
  }

  return { data: out, width, height };
}

// Trần độ phân giải bản rasterize. Phần nặng (giải Laplace) KHÔNG tỉ lệ với con số này —
// nó chạy trên lưới thu nhỏ riêng, xem MAX_DEPTH_CELLS ở trên — nên chỗ này chỉ cần đủ rộng
// để nét chữ sắc trên màn hình 2x, và chặn lại cho chữ khổng lồ ở footer khỏi ngốn bộ nhớ.
const MAX_RASTER_PIXELS = 1400000;

/**
 * Vẽ đoạn chữ ra canvas ẩn theo đúng khung mà nó đang chiếm trên trang.
 *
 * Không dựa vào việc số đo font của Canvas 2D trùng khít với hộp dòng của trình duyệt (chúng
 * lệch nhau vài phần trăm tuỳ font/hệ điều hành). Thay vào đó CO GIÃN chữ vẽ ra cho vừa đúng
 * `rect` đo được từ DOM — nhờ vậy lớp kim loại luôn chồng khít lên vị trí chữ thật.
 */
function rasterizeText(text, font, letterSpacing, rect, padRatio, dpr) {
  const measure = document.createElement('canvas').getContext('2d');
  measure.font = font;
  // letterSpacing của Canvas 2D chưa có ở mọi trình duyệt; thiếu nó thì bước co giãn ngang
  // bên dưới bù lại phần sai lệch (chữ chỉ hơi bè ra, không lệch khung).
  if ('letterSpacing' in measure) measure.letterSpacing = letterSpacing;
  const m = measure.measureText(text);
  const ascent = m.fontBoundingBoxAscent || m.actualBoundingBoxAscent;
  const descent = m.fontBoundingBoxDescent || m.actualBoundingBoxDescent;
  if (!m.width || !(ascent + descent)) return null;

  // Chừa lề quanh chữ: hiệu ứng có phần loang ra ngoài nét, và chính shader cũng làm mờ dần
  // 1% sát mép texture (hàm bM) — sát quá thì nét chữ ngoài cùng bị cụt.
  const pad = rect.height * padRatio;
  const boxW = rect.width + pad * 2;
  const boxH = rect.height + pad * 2;

  const res = Math.min(dpr, Math.sqrt(MAX_RASTER_PIXELS / (boxW * boxH)));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(2, Math.round(boxW * res));
  canvas.height = Math.max(2, Math.round(boxH * res));

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.font = font;
  if ('letterSpacing' in ctx) ctx.letterSpacing = letterSpacing;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#000';

  const sx = (rect.width / m.width) * res;
  const sy = (rect.height / (ascent + descent)) * res;
  ctx.translate(pad * res, pad * res);
  ctx.scale(sx, sy);
  ctx.fillText(text, 0, ascent);

  return { canvas, pad, boxW, boxH };
}

/**
 * Bộ màu dùng chung cho cả 3 chỗ đang gắn hiệu ứng (logo header, logo footer, tiêu đề hero).
 *
 * Mặc định của React Bits là chrome trắng-đen kèm tint hồng — đặt lên nền TRẮNG của site này
 * thì nửa sáng của kim loại tan vào nền, chữ nhìn như bị khuyết. Nên kéo vùng sáng xuống màu
 * thép nhạt, vùng tối về đúng màu mực của site (--ink), và tint ngả nhẹ sang xanh của --accent.
 */
export const inkMetal = {
  // Vùng SÁNG của kim loại chỉ tới màu thép chứ không lên trắng: nền trang là trắng, để
  // hi = #fff như mặc định của React Bits thì đúng những mảng sáng nhất của chữ tan vào nền,
  // chữ nhìn ra viền rỗng chứ không ra chữ. brightness < 1 kéo cả dải xuống tối, đủ để "Review"
  // đứng cạnh "QuickTap" (màu --ink đặc) mà không bị lép.
  lightColor: '#b3bdcd',
  darkColor: '#111113',
  // Ngả nhẹ sang xanh của --accent. Để #ffffff là tắt hẳn phần ngả màu.
  tintColor: '#dbe8ff',
  brightness: 0.6,
  contrast: 1.6,
  liquid: 0.6,
  // Mặc định (chroma 2) tán ra viền cam/lục rõ rệt quanh nét — hợp logo lớn, nhưng ở cỡ chữ
  // logo thì chỉ nhìn ra chữ bị nhoè màu. Siết lại còn đủ để thấy chất kim loại.
  chromaticSpread: 0.45,
  patternSharpness: 1.5,
  blur: 0.01,
  speed: 0.22,
};

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255]
    : [1, 1, 1];
}

export default function MetallicText({
  text,
  className = '',
  seed = 42,
  scale = 4,
  refraction = 0.01,
  blur = 0.015,
  liquid = 0.75,
  speed = 0.3,
  brightness = 2,
  contrast = 0.5,
  angle = 0,
  fresnel = 1,
  lightColor = '#ffffff',
  darkColor = '#000000',
  patternSharpness = 1,
  waveAmplitude = 1,
  noiseScale = 0.5,
  chromaticSpread = 2,
  distortion = 1,
  contour = 0.2,
  tintColor = '#feb3ff',
  // Lề quanh chữ, tính theo chiều cao dòng chữ.
  padRatio = 0.14,
}) {
  const hostRef = useRef(null);
  const textRef = useRef(null);
  const canvasRef = useRef(null);
  const glRef = useRef(null);
  const uniformsRef = useRef({});
  const textureRef = useRef(null);
  const rafRef = useRef(0);
  const timeRef = useRef(0);
  const lastRef = useRef(0);
  const speedRef = useRef(speed);
  const drawRef = useRef(null);

  // Khung canvas (px CSS) so với hộp chữ: null = hiệu ứng chưa/không bật, chỉ hiện chữ thường.
  const [box, setBox] = useState(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => { speedRef.current = speed; }, [speed]);

  // ----- Dựng WebGL + nạp mặt nạ chữ -----
  const build = useCallback(() => {
    const host = hostRef.current;
    const textEl = textRef.current;
    const canvas = canvasRef.current;
    if (!host || !textEl || !canvas) return;

    // Chữ bị ngắt xuống nhiều dòng thì một canvas phẳng không phủ nổi — trả về chữ thường.
    // Phải đo lúc host còn là `display: inline` (chưa bật), nếu không chính việc bật hiệu
    // ứng (inline-block, nowrap) sẽ che mất chuyện nó vốn xuống dòng.
    const rects = textEl.getClientRects();
    if (rects.length !== 1) { setBox(null); return; }

    const rect = rects[0];
    if (rect.width < 4 || rect.height < 4) { setBox(null); return; }

    const cs = getComputedStyle(textEl);
    const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize}/1 ${cs.fontFamily}`;
    const spacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const raster = rasterizeText(text, font, spacing, rect, padRatio, dpr);
    if (!raster) { setBox(null); return; }

    const gl = glRef.current;
    if (!gl) { setBox(null); return; }

    const tex = buildTexture(raster.canvas);

    // Canvas hiển thị lấy ĐÚNG số pixel của mặt nạ (không làm tròn riêng theo dpr): lệch một
    // chút thôi là texture bị lấy mẫu lại và mép nét chữ nhoè ra.
    canvas.width = tex.width;
    canvas.height = tex.height;
    gl.viewport(0, 0, canvas.width, canvas.height);

    if (textureRef.current) gl.deleteTexture(textureRef.current);
    const glTex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, glTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, tex.width, tex.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, tex.data);
    textureRef.current = glTex;

    const u = uniformsRef.current;
    gl.uniform1i(u.u_tex, 0);
    // Mặt nạ được cắt đúng bằng khung canvas nên hai tỉ lệ bằng nhau — hàm fA() trong shader
    // thành ánh xạ 1:1, chữ phủ kín khung thay vì bị letterbox như bản logo vuông.
    gl.uniform1f(u.u_imgRatio, tex.width / tex.height);
    gl.uniform1f(u.u_ratio, tex.width / tex.height);

    setBox({ pad: raster.pad, w: raster.boxW, h: raster.boxH });
  }, [text, padRatio]);

  // ----- Khởi tạo context (một lần) -----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: true });
    if (!gl) return;

    const compile = (src, type) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    };

    const vs = compile(vertexShader, gl.VERTEX_SHADER);
    const fs = compile(fragmentShader, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog));
      return;
    }

    const uniforms = {};
    const count = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i++) {
      const info = gl.getActiveUniform(prog, i);
      if (info) uniforms[info.name] = gl.getUniformLocation(prog, info.name);
    }

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.useProgram(prog);
    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    glRef.current = gl;
    uniformsRef.current = uniforms;

    return () => {
      if (textureRef.current) gl.deleteTexture(textureRef.current);
      glRef.current = null;
    };
  }, []);

  // ----- Dựng lại mặt nạ khi font tải xong / khi khung chữ đổi kích thước -----
  useEffect(() => {
    if (!glRef.current) return;
    let cancelled = false;
    let timer = 0;

    const run = () => { if (!cancelled) build(); };

    // Phải đợi font thật: đo và rasterize lúc trình duyệt còn đang dùng font dự phòng thì
    // mặt nạ mang hình chữ của font khác, lệch hẳn khỏi chữ hiện trên trang.
    const fonts = document.fonts;
    if (fonts && fonts.status !== 'loaded') fonts.ready.then(run);
    else run();

    // Đổi bề ngang (xoay máy, kéo cửa sổ) làm khung chữ đổi theo — và có thể khiến đoạn chữ
    // bắt đầu/thôi xuống dòng. Trả về `display:inline` trước rồi đo lại ở khung hình sau,
    // để phép kiểm tra xuống dòng ở trên nhìn thấy đúng dòng chảy tự nhiên.
    const onResize = () => {
      clearTimeout(timer);
      setBox(null);
      timer = setTimeout(() => requestAnimationFrame(run), 150);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
  }, [build]);

  // ----- Tham số shader -----
  useEffect(() => {
    const gl = glRef.current;
    const u = uniformsRef.current;
    if (!gl) return;

    gl.uniform1f(u.u_seed, seed);
    gl.uniform1f(u.u_scale, scale);
    gl.uniform1f(u.u_refract, refraction);
    gl.uniform1f(u.u_blur, blur);
    gl.uniform1f(u.u_liquid, liquid);
    gl.uniform1f(u.u_bright, brightness);
    gl.uniform1f(u.u_contrast, contrast);
    gl.uniform1f(u.u_angle, angle);
    gl.uniform1f(u.u_fresnel, fresnel);
    gl.uniform1f(u.u_sharp, patternSharpness);
    gl.uniform1f(u.u_wave, waveAmplitude);
    gl.uniform1f(u.u_noise, noiseScale);
    gl.uniform1f(u.u_chroma, chromaticSpread);
    gl.uniform1f(u.u_distort, distortion);
    gl.uniform1f(u.u_contour, contour);

    const light = hexToRgb(lightColor);
    const dark = hexToRgb(darkColor);
    const tint = hexToRgb(tintColor);
    gl.uniform3f(u.u_lightColor, light[0], light[1], light[2]);
    gl.uniform3f(u.u_darkColor, dark[0], dark[1], dark[2]);
    gl.uniform3f(u.u_tint, tint[0], tint[1], tint[2]);

    // Vẽ lại ngay cả khi vòng lặp đang dừng (khuất màn hình / tắt chuyển động).
    if (drawRef.current) drawRef.current();
  }, [seed, scale, refraction, blur, liquid, brightness, contrast, angle, fresnel,
      lightColor, darkColor, patternSharpness, waveAmplitude, noiseScale,
      chromaticSpread, distortion, contour, tintColor, box]);

  // ----- Chỉ chạy vòng lặp khi khối chữ đang nằm trong màn hình -----
  useEffect(() => {
    const host = hostRef.current;
    if (!host || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: '80px' }
    );
    io.observe(host);
    return () => io.disconnect();
  }, []);

  // ----- Vòng lặp vẽ -----
  useEffect(() => {
    const gl = glRef.current;
    const u = uniformsRef.current;
    if (!gl || !box) return;

    const draw = () => {
      gl.uniform1f(u.u_time, timeRef.current);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    drawRef.current = draw;

    // Tôn trọng "giảm chuyển động": vẫn hiện lớp kim loại nhưng đứng yên một khung hình,
    // thay vì tắt hẳn hiệu ứng (chữ vẫn đẹp, chỉ không nhấp nháy).
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !visible) { draw(); return () => { drawRef.current = null; }; }

    const loop = (t) => {
      const delta = t - lastRef.current;
      lastRef.current = t;
      timeRef.current += delta * speedRef.current;
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      drawRef.current = null;
    };
  }, [box, visible]);

  const active = box !== null;

  return (
    <span
      ref={hostRef}
      className={`metallic-text${active ? ' is-on' : ''}${className ? ` ${className}` : ''}`}
    >
      {/* Canvas nằm TRONG chính span chữ, không phải anh em cạnh nó: span chữ mới là mốc
          đúng để đặt lớp kim loại. Wrapper bên ngoài khi bật hiệu ứng là inline-block nên
          cao theo line-height — cao hơn hộp chữ vài px và lệch tâm — lấy nó làm mốc thì
          "Review" nằm nhích lên so với "QuickTap" ngay bên cạnh. */}
      <span ref={textRef} className="metallic-text-ink">
        {text}
        <canvas
          ref={canvasRef}
          className="metallic-text-canvas"
          aria-hidden="true"
          style={active ? { left: `${-box.pad}px`, top: `${-box.pad}px`, width: `${box.w}px`, height: `${box.h}px` } : undefined}
        />
      </span>
    </span>
  );
}
