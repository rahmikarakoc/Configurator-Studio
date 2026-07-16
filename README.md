# UE5 Configurator UI Designer

Sektörden bağımsız, data-driven bir ürün konfigüratörü — Unreal Engine 5, tamamen Blueprint (C++ yok), Epic Games **Fab** üzerinde premium şablon olarak satılacak.

**Hedef sektörler:** mobilya, teknoloji ürünleri, sanat galerileri (modüler, tek koda bağlı değil).
**İki kullanım şekli:** (1) firma/şahıslar için çalışan bitmiş bir program, (2) Fab üzerinden geliştiricilere satılan bir Blueprint şablonu.

## Klasör Yapısı

```
01_MIMARI/
  01_Material-System.md          → MIC / MID / MPC mimarisi, Lumen & Nanite uyumu
  02_Data-Driven-Core.md         → DataTable/JSON veri modeli + Setup Utility (no-code)
  03_Fab-Dokuman-Pazarlama.md    → Fab kuralları, README iskeleti, satış vurguları
```

## Teknik Kararlar (özet)
- **UI stili:** Minimal / profesyonel stüdyo (ilk tasarım yönü)
- **Fab biçimi:** Blueprint şablonu — C++ yok
- **Runtime 3D import:** glTFRuntime (ücretsiz, MIT) — glTF + FBX
- **Materyal sistemi:** 5–7 master material + MIC (ayrık seçenek) + MID (serbest renk/pürüzlülük) + MPC (global tema)
- **Veri:** Blueprint Struct + DataAsset/DataTable + JSON import/export; EUW tabanlı "Setup Utility" ile no-code ürün ekleme

## Kısıt
Bu ortamda gerçek Unreal Engine çalıştırılamıyor/derlenemiyor. Üretilen şey: mimari döküman, UI mockup (HTML/interaktif), Blueprint mantığı ve node akışı dökümantasyonu, Fab pazarlama metinleri. Gerçek `.uasset`/Blueprint kurulumu kullanıcı tarafından Unreal Editor'de yapılır.

## Sıradaki Adım
Minimal/profesyonel stüdyo UI stilinin interaktif mockup'ı (viewport + model/ışık/malzeme/varyant panelleri) — hem UMG'de birebir referans olacak hem Fab görselleri için kullanılabilecek.
