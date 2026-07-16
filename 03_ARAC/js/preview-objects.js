// UV/tiling kontrolü için tekrar eden dama deseni — malzemenin gerçek base color'ı
// yerine geçici olarak takılır (bkz. model-material-editor.html içindeki #uvToggle).
import * as THREE from 'three';

let _uvGridTex = null;
export function getUVGridTexture() {
  if (_uvGridTex) return _uvGridTex;
  const n = 8, cell = 64;
  const c = document.createElement("canvas");
  c.width = c.height = n * cell;
  const ctx = c.getContext("2d");
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? "#f2f2f2" : "#2f6fd1";
      ctx.fillRect(x * cell, y * cell, cell, cell);
    }
  }
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, c.width, c.height);
  _uvGridTex = new THREE.CanvasTexture(c);
  _uvGridTex.colorSpace = THREE.SRGBColorSpace;
  _uvGridTex.wrapS = _uvGridTex.wrapT = THREE.RepeatWrapping;
  return _uvGridTex;
}
