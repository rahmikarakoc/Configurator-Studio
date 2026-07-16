# Görsel Değiştirme Mimarisi (Material System)

> Amaç: Doku/renk değişimini **en az shader derlemesi, en az draw-call sapması ve Lumen/Nanite bütçesine saygıyla** yapmak. Doğru araç, değişimin **kapsamına** göre seçilir.

## Karar Matrisi

| Değişim tipi | Örnek | Doğru araç | Neden |
|---|---|---|---|
| Önceden tanımlı, ayrık seçenekler | "Bu koltuk 6 kumaşta gelir" | **Material Instance Constant (MIC)** + `SetMaterial` slot değişimi | Sıfır runtime maliyeti; parent'ın derlenmiş shader'ını paylaşır |
| Sürekli, kullanıcı-girdili | "İstediğin rengi/pürüzlülüğü seç" | **Material Instance Dynamic (MID)** | Runtime parametre değişimi için tek yol |
| Global, çok objeyi aynı anda etkiler | "Tema aksan rengi", "genel yıpranma" | **Material Parameter Collection (MPC)** | Tek `Set` çağrısıyla N materyal güncellenir |

## 1. Katman 1 — Master Material'lar (Parent)

Tüm sistem **5–7 adet master material** üzerine kurulur; blend mode / shading model'e göre ayrılır:

- `M_Master_Opaque` — standart PBR (metal, ahşap, plastik)
- `M_Master_Fabric` — kumaş/deri (sheen, cloth shading)
- `M_Master_Emissive` — ekran/aydınlatmalı yüzeyler
- `M_Master_Translucent` — cam/akrilik (yalnızca gerekli objelerde)

**Kritik prensip:** her şey bir instance'tır. 100 instance, tek parent → tek derlenmiş shader → esasen tek instance kadar shader belleği. Master material'da:

- Renk/doku/pürüzlülük/normal/UV tiling → **Material Parameter** (Scalar/Vector/Texture) olarak `expose` edilir.
- Özellik aç/kapa (örn. `UseTexture`, `UseDetailNormal`) → **Static Switch Parameter**. Bu, kullanılmayan dalların shader'a girmemesini sağlar; permütasyonu düşük tutmak için switch sayısını sınırlı tut.

## 2. Katman 2 — MIC (ayrık, önceden tanımlı varyantlar)

Editörde önceden hazırlanan malzeme seçenekleri (Meşe, Ceviz, Antrasit kumaş…) birer **Material Instance Constant asset**'idir. Runtime'da değişim = mesh'in ilgili material slot'una `SetMaterial(SlotIndex, MIC)`. Bu, MID parametre animasyonundan **daha ucuzdur** ve data-driven katalog için idealdir (DataTable seçeneği doğrudan bir MIC referansı tutar).

## 3. Katman 3 — MID (sürekli, kullanıcı-girdili)

Kullanıcı serbest renk/pürüzlülük seçtiğinde:

1. `Create Dynamic Material Instance` (mesh component üzerinde, ilgili slot için) → **bir kez** oluştur, **cache'le**.
2. `Set Vector Parameter Value` (BaseColor), `Set Scalar Parameter Value` (Roughness/Metallic), `Set Texture Parameter Value`.

**Performans kuralı:** MID'i Tick içinde ya da her seçimde yeniden oluşturma. Obje/slot başına bir MID üret, sakla, sadece parametresini güncelle.

## 4. Katman 4 — MPC (global değişim)

`MPC_Configurator` adında bir Material Parameter Collection; içinde global parametreler: `GlobalAccentColor`, `GlobalWearAmount`, `AmbientMood` (gündüz/gece), `GlobalRoughnessBias`.

- Master material'lar bu MPC'yi `Collection Parameter` node'uyla okur.
- Runtime'da `Set Vector/Scalar Parameter Value on Material Parameter Collection` → **tek çağrı, tüm materyaller güncellenir.** Tema aksan rengi ya da "showroom ambiyansı" gibi topluca değişen şeyler için MID ordusu yerine MPC kullan; hem kod hem GPU açısından çok daha ucuz.

## 5. Lumen Uyumu

- **Emissive katkısı:** Emissive materyaller Lumen GI'ye katkı verir; abartıldığında surface cache'i yorar. Ekran/led yüzeylerinde emissive luminance'ı kontrollü tut.
- **Surface Cache bütçesi:** Materyal *sayısını* düşük tutmak surface cache'i rahatlatır — MPC ile global değişimleri tek materyalde toplamak burada ikinci bir kazanç sağlar.
- **Blend mode:** Two-sided ve masked materyaller Lumen surface cache'te daha pahalıdır. Mümkün olan her yerde **opaque** tercih et; cam gibi zorunlu yerlerde translucent'i sınırlı kullan.
- MID/MPC ile yapılan renk/roughness değişimleri Lumen'e surface cache üzerinden otomatik yansır; ekstra bir işlem gerekmez (yalnızca birkaç frame'lik cache tazeleme gecikmesi normaldir).

## 6. Nanite Uyumu

- Nanite materyalleri **opaque** olmalı; **masked** desteklenir ama maliyetlidir (UE5.3+ ile iyileşti), **translucent Nanite değildir** (fallback'e düşer). Master material'ları Nanite meshlerde kullanırken opaque tut.
- **Kritik mimari not:** Nanite bir **cook/import-zamanı** işlemidir. `glTFRuntime` ile **runtime'da içeri alınan kullanıcı modelleri Nanite DEĞİLDİR** (procedural mesh olarak gelir). Dolayısıyla:
  - Şablonla gelen demo/örnek assetler → Nanite (yüksek poly, performanslı).
  - Kullanıcının uygulama içinde yüklediği modeller → standart mesh. Bunu dökümantasyonda net belirt; isteğe bağlı bir "mesh optimizasyon/LOD" adımı öner.

## 7. Özet Veri Akışı

```
Master Material (parent, expose edilmiş parametreler + static switch)
      ├── MIC asset'leri  → ayrık katalog seçenekleri (DataTable referansı)
      ├── MID (runtime)   → kullanıcı serbest renk/pürüzlülük (cache'li)
      └── MPC             → global tema/ambiyans (tek çağrı, toplu güncelleme)
```

## Kaynaklar
- [Dynamic Materials in UMG Widgets](https://dev.epicgames.com/community/learning/tutorials/l0PK/unreal-engine-dynamic-materials-in-umg-widgets)
- [Dynamic Material Instances — Creating PBR Materials](https://dev.epicgames.com/community/learning/courses/pxm/creating-pbr-materials/dD6/dynamic-material-instances-part-1-tweaking-materials-at-runtime)
- [Epic — Product Configurator Template](https://docs.unrealengine.com/4.27/en-US/Resources/Templates/ProductConfigurator)
