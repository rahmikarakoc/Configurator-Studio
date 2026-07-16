// Harita bazlı şiddet/yoğunluk ayar sistemi.
// Data-driven şema + tek bir generic form üretici (renderAdjustPanel) + tek bir uygulayıcı (applyAdjust).
// Orijinal yüklenen görsel HİÇBİR ZAMAN mutasyona uğramaz; her ayar değişiminde orijinalden yeniden üretilir
// (debounce'lu) ve THREE.CanvasTexture olarak materyale yeniden yüklenir. Normal/Height ayarları ise
// Canvas2D yerine Three.js'in kendi normalScale/displacementScale özelliklerini kullanır (daha ucuz, daha güvenilir).

export const ADJUST_SCHEMA = {
  map: [
    { key: "brightness", label: "Parlaklık", min: -100, max: 100, def: 0, step: 1 },
    { key: "contrast", label: "Kontrast", min: -100, max: 100, def: 0, step: 1 },
    { key: "saturation", label: "Doygunluk", min: -100, max: 100, def: 0, step: 1 },
    { key: "hue", label: "Renk Tonu", min: -180, max: 180, def: 0, step: 1, unit: "°" },
    { key: "gamma", label: "Gamma", min: 0.2, max: 2.5, def: 1, step: 0.01 },
    { key: "exposure", label: "Pozlama", min: 0.2, max: 2.5, def: 1, step: 0.01 },
    { key: "opacity", label: "Opaklık", min: 0, max: 100, def: 100, step: 1 },
    { key: "invert", label: "Tersine Çevir", type: "bool", def: false },
    { key: "tint", label: "Renk Katmanı", type: "color", def: "#ffffff" },
  ],
  roughnessMap: [
    { key: "intensity", label: "Yoğunluk", min: 0, max: 200, def: 100, step: 1, unit: "%" },
    { key: "contrast", label: "Kontrast", min: -100, max: 100, def: 0, step: 1 },
    { key: "brightness", label: "Parlaklık", min: -100, max: 100, def: 0, step: 1 },
    { key: "min", label: "Min Değer", min: 0, max: 100, def: 0, step: 1 },
    { key: "max", label: "Max Değer", min: 0, max: 100, def: 100, step: 1 },
    { key: "blur", label: "Bulanıklaştır", min: 0, max: 10, def: 0, step: 0.1, unit: "px" },
    { key: "invert", label: "Tersine Çevir", type: "bool", def: false },
  ],
  normalMap: [
    { key: "strength", label: "Şiddet", min: 0, max: 200, def: 100, step: 1, unit: "%" },
    { key: "blur", label: "Bulanıklaştır", min: 0, max: 10, def: 0, step: 0.1, unit: "px" },
    { key: "space", label: "Uzay", type: "enum", options: ["OpenGL", "DirectX"], def: "OpenGL" },
    { key: "flip", label: "Y Ters Çevir", type: "bool", def: false },
  ],
  displacementMap: [
    { key: "amount", label: "Miktar", min: 0, max: 200, def: 60, step: 1, unit: "%" },
    { key: "midLevel", label: "Orta Seviye", min: 0, max: 100, def: 50, step: 1 },
    { key: "min", label: "Min Değer", min: 0, max: 100, def: 0, step: 1 },
    { key: "max", label: "Max Değer", min: 0, max: 100, def: 100, step: 1 },
    { key: "blur", label: "Bulanıklaştır", min: 0, max: 10, def: 0, step: 0.1, unit: "px" },
    { key: "invert", label: "Tersine Çevir", type: "bool", def: false },
  ],
  aoMap: [
    { key: "strength", label: "Şiddet", min: 0, max: 200, def: 100, step: 1, unit: "%" },
    { key: "contrast", label: "Kontrast", min: -100, max: 100, def: 0, step: 1 },
    { key: "brightness", label: "Parlaklık", min: -100, max: 100, def: 0, step: 1 },
    { key: "invert", label: "Tersine Çevir", type: "bool", def: false },
  ],
  metalnessMap: [
    { key: "amount", label: "Miktar", min: 0, max: 200, def: 100, step: 1, unit: "%" },
    { key: "threshold", label: "Eşik", min: 0, max: 100, def: 0, step: 1 },
    { key: "contrast", label: "Kontrast", min: -100, max: 100, def: 0, step: 1 },
    { key: "brightness", label: "Parlaklık", min: -100, max: 100, def: 0, step: 1 },
    { key: "invert", label: "Tersine Çevir", type: "bool", def: false },
  ],
};

export function defaultParams(slotKey) {
  const schema = ADJUST_SCHEMA[slotKey] || [];
  const out = {};
  for (const f of schema) out[f.key] = f.def;
  return out;
}

function hexToRgb(hex) {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

// Base Color: CSS filter (brightness/contrast/saturate/hue-rotate/invert) + manuel gamma/exposure/tint/opacity geçişi.
function processBaseColor(srcCanvas, p) {
  const w = srcCanvas.width, h = srcCanvas.height;
  const out = document.createElement("canvas");
  out.width = w; out.height = h;
  const ctx = out.getContext("2d");
  const b = 100 + p.brightness, c = 100 + p.contrast, s = 100 + p.saturation;
  ctx.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%) hue-rotate(${p.hue}deg) invert(${p.invert ? 1 : 0})`;
  ctx.drawImage(srcCanvas, 0, 0);
  ctx.filter = "none";
  if (p.gamma !== 1 || p.exposure !== 1 || p.tint !== "#ffffff" || p.opacity !== 100) {
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    const [tr, tg, tb] = hexToRgb(p.tint);
    const invGamma = 1 / p.gamma;
    const alpha = p.opacity / 100;
    for (let i = 0; i < d.length; i += 4) {
      for (let ch = 0; ch < 3; ch++) {
        let v = d[i + ch] / 255;
        v = Math.pow(Math.max(v, 0), invGamma) * p.exposure;
        v *= (ch === 0 ? tr : ch === 1 ? tg : tb) / 255;
        d[i + ch] = Math.max(0, Math.min(255, Math.round(v * 255)));
      }
      d[i + 3] = Math.round(d[i + 3] * alpha);
    }
    ctx.putImageData(imgData, 0, 0);
  }
  return out;
}

// Gri-tonlamalı haritalar (roughness/ao/metalness): contrast/brightness/min-max/invert + opsiyonel blur.
function processGrayscale(srcCanvas, p, { channelMix = false } = {}) {
  const w = srcCanvas.width, h = srcCanvas.height;
  const tmp = document.createElement("canvas");
  tmp.width = w; tmp.height = h;
  const tctx = tmp.getContext("2d");
  if (p.blur > 0) tctx.filter = `blur(${p.blur}px)`;
  tctx.drawImage(srcCanvas, 0, 0);
  tctx.filter = "none";
  const imgData = tctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  const contrastF = (100 + (p.contrast || 0)) / 100;
  const brightF = (p.brightness || 0) / 100;
  const min = (p.min ?? 0) / 100, max = (p.max ?? 100) / 100;
  const invert = !!p.invert;
  const intensity = (p.intensity ?? p.amount ?? p.strength ?? 100) / 100;
  const threshold = (p.threshold || 0) / 100;
  for (let i = 0; i < d.length; i += 4) {
    let v = d[i] / 255; // zaten gri varsayılan (R kanalı)
    if (invert) v = 1 - v;
    v = (v - 0.5) * contrastF + 0.5 + brightF;
    v = Math.max(0, Math.min(1, v));
    v = min + (max - min) * v;
    if (threshold > 0) v = v > threshold ? (v - threshold) / (1 - threshold) : 0;
    v = Math.max(0, Math.min(1, v * intensity));
    const px = Math.round(v * 255);
    d[i] = px; d[i + 1] = px; d[i + 2] = px;
  }
  tctx.putImageData(imgData, 0, 0);
  return tmp;
}

/**
 * @param {string} slotKey  TEX_SLOTS anahtarı (map/roughnessMap/normalMap/heightMap/aoMap/metalnessMap)
 * @param {HTMLCanvasElement|HTMLImageElement} originalSource
 * @param {object} params  ADJUST_SCHEMA'daki alanlara karşılık gelen değerler
 * @returns {HTMLCanvasElement}
 */
export function applyAdjust(slotKey, originalSource, params) {
  const src = originalSource instanceof HTMLCanvasElement ? originalSource : toCanvasEl(originalSource);
  if (slotKey === "map") return processBaseColor(src, params);
  if (slotKey === "roughnessMap" || slotKey === "aoMap" || slotKey === "metalnessMap" || slotKey === "displacementMap") {
    return processGrayscale(src, params);
  }
  return src; // normalMap: piksel işleme yerine material.normalScale kullanılır (bkz. applyNormalMaterialParams)
}

function toCanvasEl(img) {
  const c = document.createElement("canvas");
  c.width = img.width; c.height = img.height;
  c.getContext("2d").drawImage(img, 0, 0);
  return c;
}

// Normal map: piksel yeniden işleme yerine Three.js'in ucuz/gerçek-zamanlı material özellikleri.
export function applyNormalMaterialParams(material, params) {
  const s = (params.strength ?? 100) / 100;
  const flip = params.flip ? -1 : 1;
  const dxFix = params.space === "DirectX" ? -1 : 1;
  material.normalScale.set(s, s * flip * dxFix);
}

export function applyHeightMaterialParams(material, params) {
  const amount = (params.amount ?? 60) / 100;
  material.displacementScale = amount * 0.15; // sahne birimine göre ölçülü, aşırı deformasyonu önler
  material.displacementBias = -((params.midLevel ?? 50) / 100) * material.displacementScale;
}

export function debounce(fn, ms) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
