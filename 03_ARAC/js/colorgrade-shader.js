// Basit renk derecelendirme postprocessing pass'i (Gamma/Kontrast/Parlaklık/Doygunluk/Beyaz Dengesi).
// Kamera sekmesindeki "Görüntü Ayarları" hem CANLI önizlemede hem ekran görüntüsü/kütüphane
// küçük resimlerinde aynı sonucu versin diye EffectComposer ShaderPass olarak uygulanıyor
// (yalnızca DOM/CSS filtresi olsaydı toDataURL/toBlob çıktısına yansımazdı).
import * as THREE from 'three';

export const ColorGradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uGamma: { value: 1.0 },
    uContrast: { value: 0.0 },
    uBrightness: { value: 0.0 },
    uSaturation: { value: 0.0 },
    uTint: { value: new THREE.Vector3(1, 1, 1) },
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uGamma;
    uniform float uContrast;
    uniform float uBrightness;
    uniform float uSaturation;
    uniform vec3 uTint;
    varying vec2 vUv;
    void main(){
      vec4 texel = texture2D(tDiffuse, vUv);
      vec3 c = texel.rgb * uTint;
      c = (c - 0.5) * (1.0 + uContrast) + 0.5 + uBrightness;
      float g = dot(c, vec3(0.299, 0.587, 0.114));
      c = mix(vec3(g), c, 1.0 + uSaturation);
      c = pow(max(c, vec3(0.0)), vec3(1.0 / max(uGamma, 0.0001)));
      gl_FragColor = vec4(c, texel.a);
    }
  `,
};
