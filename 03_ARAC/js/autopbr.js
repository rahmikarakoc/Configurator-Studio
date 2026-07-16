// Auto-PBR — Base Color dokusundan prosedürel olarak Roughness/Normal/Height/AO/Metallic üretir.
// NOT: Bu bir yapay-zeka modeli DEĞİLDİR — klasik görüntü-işleme (luminance/Sobel/blur) teknikleri kullanır.
// Sonuçlar "tahmini"dir. generateAutoPBR() imzası sabit tutulmuştur; ileride gerçek bir AI servisine
// (örn. fetch('/api/autopbr', ...)) geçmek için içi değiştirilip dışı aynı kalabilir.

export const SURFACE_PRESETS = {
  generic:  { label: "Genel",     roughBase: 0.55, roughSpread: 0.35, normalStrength: 0.6, aoStrength: 0.4, metalBias: 0.0 },
  stone:    { label: "Taş",       roughBase: 0.75, roughSpread: 0.25, normalStrength: 1.1, aoStrength: 0.7, metalBias: 0.0 },
  marble:   { label: "Mermer",    roughBase: 0.35, roughSpread: 0.30, normalStrength: 0.4, aoStrength: 0.35, metalBias: 0.0 },
  wood:     { label: "Ahşap",     roughBase: 0.6,  roughSpread: 0.3,  normalStrength: 0.5, aoStrength: 0.4, metalBias: 0.0 },
  fabric:   { label: "Kumaş",     roughBase: 0.85, roughSpread: 0.15, normalStrength: 0.8, aoStrength: 0.55, metalBias: 0.0 },
  metal:    { label: "Metal",     roughBase: 0.3,  roughSpread: 0.4,  normalStrength: 0.5, aoStrength: 0.25, metalBias: 0.85 },
  concrete: { label: "Beton",     roughBase: 0.8,  roughSpread: 0.2,  normalStrength: 0.9, aoStrength: 0.6, metalBias: 0.0 },
  ceramic:  { label: "Seramik",   roughBase: 0.2,  roughSpread: 0.25, normalStrength: 0.3, aoStrength: 0.3, metalBias: 0.0 },
  plastic:  { label: "Plastik",   roughBase: 0.35, roughSpread: 0.3,  normalStrength: 0.35, aoStrength: 0.3, metalBias: 0.0 },
  leather:  { label: "Deri",      roughBase: 0.55, roughSpread: 0.3,  normalStrength: 0.7, aoStrength: 0.5, metalBias: 0.0 },
};

function toCanvas(img, w, h) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  return c;
}

function luminanceData(imgData) {
  const { data, width, height } = imgData;
  const out = new Float32Array(width * height);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    out[p] = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
  }
  return out;
}

function saturationData(imgData) {
  const { data, width, height } = imgData;
  const out = new Float32Array(width * height);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    out[p] = mx === 0 ? 0 : (mx - mn) / mx;
  }
  return out;
}

function boxBlur(src, w, h, radius) {
  if (radius <= 0) return src;
  const out = new Float32Array(w * h);
  const r = Math.max(1, Math.round(radius));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0, count = 0;
      for (let dy = -r; dy <= r; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -r; dx <= r; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= w) continue;
          sum += src[yy * w + xx];
          count++;
        }
      }
      out[y * w + x] = sum / count;
    }
  }
  return out;
}

function grayToCanvas(gray, w, h) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  const imgData = ctx.createImageData(w, h);
  for (let p = 0; p < gray.length; p++) {
    const v = Math.max(0, Math.min(255, Math.round(gray[p] * 255)));
    imgData.data[p * 4] = v;
    imgData.data[p * 4 + 1] = v;
    imgData.data[p * 4 + 2] = v;
    imgData.data[p * 4 + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
  return c;
}

function buildRoughness(luma, sat, w, h, preset, detail) {
  const out = new Float32Array(w * h);
  for (let p = 0; p < luma.length; p++) {
    const base = 1 - luma[p] * 0.6 - sat[p] * 0.2;
    out[p] = Math.max(0, Math.min(1, preset.roughBase + (base - 0.5) * preset.roughSpread * 2 * detail));
  }
  return out;
}

function buildNormalFromHeight(height, w, h, strength) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  const imgData = ctx.createImageData(w, h);
  const at = (x, y) => height[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // Sobel
      const tl = at(x - 1, y - 1), t = at(x, y - 1), tr = at(x + 1, y - 1);
      const l = at(x - 1, y), r = at(x + 1, y);
      const bl = at(x - 1, y + 1), b = at(x, y + 1), br = at(x + 1, y + 1);
      const gx = (tr + 2 * r + br) - (tl + 2 * l + bl);
      const gy = (bl + 2 * b + br) - (tl + 2 * t + tr);
      let nx = -gx * strength, ny = -gy * strength, nz = 1.0;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      nx /= len; ny /= len; nz /= len;
      const p = (y * w + x) * 4;
      imgData.data[p] = Math.round((nx * 0.5 + 0.5) * 255);
      imgData.data[p + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      imgData.data[p + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      imgData.data[p + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  return c;
}

function buildAO(luma, w, h, strength) {
  const blurred = boxBlur(luma, w, h, Math.max(1, Math.round(Math.min(w, h) * 0.01)));
  const out = new Float32Array(w * h);
  for (let p = 0; p < luma.length; p++) {
    const crevice = Math.max(0, blurred[p] - luma[p]);
    out[p] = Math.max(0, Math.min(1, 1 - crevice * strength * 3));
  }
  return out;
}

function buildMetallic(luma, sat, w, h, preset, threshold) {
  const out = new Float32Array(w * h);
  for (let p = 0; p < luma.length; p++) {
    const score = luma[p] * 0.5 + (1 - sat[p]) * 0.5;
    const v = score > threshold ? (score - threshold) / (1 - threshold) : 0;
    out[p] = Math.max(0, Math.min(1, preset.metalBias + v * (1 - preset.metalBias)));
  }
  return out;
}

/**
 * @param {HTMLImageElement|HTMLCanvasElement} baseColorSource
 * @param {object} options { surfaceType, resolution, detail(0-1), normalStrength(0-2), roughnessStrength(0-2),
 *                            aoStrength(0-2), metallicThreshold(0-1), seamless(bool), edgeFix(bool),
 *                            onProgress(fn(pct,label)) }
 * @returns {Promise<{roughness:HTMLCanvasElement, normal:HTMLCanvasElement, height:HTMLCanvasElement, ao:HTMLCanvasElement, metallic:HTMLCanvasElement}>}
 */
export async function generateAutoPBR(baseColorSource, options = {}) {
  const preset = SURFACE_PRESETS[options.surfaceType] || SURFACE_PRESETS.generic;
  const res = options.resolution || 1024;
  const detail = options.detail ?? 0.6;
  const onProgress = options.onProgress || (() => {});
  const step = async (pct, label) => {
    onProgress(pct, label);
    await new Promise((r) => requestAnimationFrame(r));
  };

  await step(5, "Doku hazırlanıyor…");
  let srcCanvas = toCanvas(baseColorSource, res, res);
  if (options.edgeFix) {
    // basit kenar yumuşatma: kenarlara 2px mirror blur
    const ctx = srcCanvas.getContext("2d");
    ctx.filter = "blur(0.6px)";
    ctx.drawImage(srcCanvas, 0, 0);
    ctx.filter = "none";
  }
  const ctx = srcCanvas.getContext("2d", { willReadFrequently: true });
  const imgData = ctx.getImageData(0, 0, res, res);

  await step(20, "Parlaklık/doygunluk analiz ediliyor…");
  const luma = luminanceData(imgData);
  const sat = saturationData(imgData);

  await step(35, "Roughness üretiliyor…");
  const roughGray = buildRoughness(luma, sat, res, res, preset, detail * (options.roughnessStrength ?? 1));
  const roughness = grayToCanvas(roughGray, res, res);

  await step(50, "Height/Displacement üretiliyor…");
  const heightBlur = boxBlur(luma, res, res, Math.round(1 + detail * 2));
  const height = grayToCanvas(heightBlur, res, res);

  await step(65, "Normal map üretiliyor (Sobel)…");
  const normalStrength = (preset.normalStrength) * (options.normalStrength ?? 1) * (1.5 + detail * 2.5);
  const normal = buildNormalFromHeight(heightBlur, res, res, normalStrength);

  await step(80, "Ambient Occlusion üretiliyor…");
  const aoGray = buildAO(luma, res, res, preset.aoStrength * (options.aoStrength ?? 1));
  const ao = grayToCanvas(aoGray, res, res);

  await step(92, "Metallic tahmin ediliyor…");
  const metalGray = buildMetallic(luma, sat, res, res, preset, options.metallicThreshold ?? 0.72);
  const metallic = grayToCanvas(metalGray, res, res);

  await step(100, "Tamamlandı");
  return { roughness, normal, height, ao, metallic };
}
