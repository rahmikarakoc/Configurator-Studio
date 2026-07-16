# Data-Driven Core (Setup Utility + DataTable/JSON)

> Amaç: Kullanıcının **tek satır Blueprint açmadan**, sadece veri düzenleyerek yeni ürün/varyasyon/fiyat tanımlayabilmesi. "Sıfır kod" vaadi burada satılır.

## 1. Veri Modeli (Blueprint Struct — C++ yok)

Fab "Content" kuralı C++'ı yasakladığı için Row Struct'ları **User-Defined Struct (Blueprint Struct)** olarak tanımla. DataTable'lar BP struct'larını destekler.

```
F_Product
 ├─ ProductID (Name)                    // benzersiz anahtar
 ├─ DisplayName (Text)
 ├─ Mesh (SoftObjectPtr<StaticMesh>)    // soft ref → bellek dostu
 ├─ BasePrice (float)
 └─ Slots (Array<F_VariantSlot>)

F_VariantSlot
 ├─ SlotName (Text)                     // "Kumaş", "Ayak", "Kol"
 ├─ TargetMaterialSlot (int)            // mesh'in hangi material index'i
 ├─ Options (Array<F_MaterialOption>)
 └─ DefaultOptionIndex (int)

F_MaterialOption
 ├─ OptionName (Text)
 ├─ Material (SoftObjectPtr<MaterialInterface>)  // MIC referansı
 ├─ Thumbnail (SoftObjectPtr<Texture2D>)
 └─ PriceDelta (float)
```

## 2. DataTable mı, JSON mu, DataAsset mı? (mimari tercih)

| Kaynak | Güçlü yanı | Kullanım |
|---|---|---|
| **DataTable** | Editörde tablo/grid ile hızlı yazım, tip güvenli, asset referansları doğrudan | Tasarımcının UE içinde çalıştığı ana senaryo |
| **JSON** | Harici pipeline, toplu içe aktarma, PIM/e-ticaret entegrasyonu | Yüzlerce ürünün dışarıdan beslenmesi; UE `Import from JSON` ile DataTable'a çevrilir |
| **Primary Data Asset** | EUW'den programatik ekleme/düzenleme BP'de en kolay olan | "Setup Utility"nin veriyi kod olmadan yazması |

**Önerilen mimari:** Çalışma-zamanı doğruluk kaynağı bir **DataTable** (ya da eşdeğer DataAsset); toplu yazım için **JSON import**; interaktif "no-code" ekleme için **Setup Utility**'nin bir **DataAsset dizisine** yazması. (DataTable'a editör-zamanında BP ile satır eklemek sınırlıdır; DataAsset dizisi EUW'den düzenlemeye daha yatkındır — mimar kararı: veriyi DataAsset'te tut, isteyen JSON/DataTable ile besleyebilsin.)

## 3. Setup Utility (Editor Utility Widget)

Editörde açılan bir **EUW** — kullanıcı formu doldurur, "Ekle"ye basar, veri yazılır:

1. **Ürün ekle:** Static Mesh seç → isim, base fiyat gir.
2. **Slot ekle:** her material slot için "Kumaş/Ayak…" adı + hedef material index.
3. **Seçenek ekle:** her slota MIC + thumbnail + fiyat farkı ekle; varsayılanı işaretle.
4. **Kaydet:** EUW, hedef DataAsset'in ürün dizisine yeni satırı ekler (`Editor Scripting Utilities` ile asset'i al, diziyi değiştir, `Mark Dirty` + `Save`). Alternatif: **JSON export/import** butonu (toplu ve yedeklenebilir).
5. **Doğrulama:** eksik mesh, çakışan ProductID, varsayılan seçeneği olmayan slot uyarısı.
6. **Bonus "tek tık":** seçili mesh'in material slot'larından slotları otomatik türet (hızlı kurulum).

## 4. Runtime Akışı (data → UI + fiyat, tamamen üretilmiş)

```
BeginPlay
  → ConfiguratorManager (BP Actor / GameInstance Subsystem) veriyi okur
  → Ürün listesi + slot/seçenek UI'ı DİNAMİK üretilir (butonlar datadan spawn'lanır)
Kullanıcı bir seçenek seçince
  → ayrık seçenek: SetMaterial(slot, MIC)   |  serbest: MID param  |  global: MPC
  → RunningPrice = BasePrice + Σ(seçili PriceDelta)  → UI güncellenir
Çıktı
  → seçili optionID'ler + toplam fiyat → JSON olarak export (teklif / e-ticaret)
  → konfigürasyon SaveGame veya JSON ile kaydet/yükle
```

Bu akışın kritik değeri: **UI ve fiyat hardcode değil, veriden üretilir.** Yeni ürün = yeni satır; ne Blueprint ne UMG'ye dokunulur. "Data-driven core" tam olarak budur.

## İlgili Sistem
Seçilen materyal referansları (`F_MaterialOption.Material`) doğrudan [01_Material-System.md](01_Material-System.md)'de tanımlanan MIC asset'lerine işaret eder — iki sistem bu referansla birbirine bağlanır.
