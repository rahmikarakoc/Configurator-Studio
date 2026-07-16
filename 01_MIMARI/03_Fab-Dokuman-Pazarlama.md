# Fab Pazarlama & Dökümantasyon

> Fab'da **premium** algısı; temiz mühendislik + net dökümantasyon + doğru teknik vurgularla oluşur.

## Fab Kuralları (ürünü şekillendiren ön koşullar)

- Content ürünü **C++ içeremez** (sadece Blueprint) — bkz. `01_Material-System.md` / `02_Data-Driven-Core.md`'de tüm sistemin BP-only kurgulanma nedeni budur.
- Tek bir *Pack* alt-klasörü, ürün adıyla; içinde tüm asset'ler.
- İsimlendirme İngilizce, alfanumerik, tutarlı.
- Kullanılmayan asset/dizin yok; **redirector'lar temizlenmiş** olmalı.
- Dosya boyutu ≤15GB (üzerinde Fab ekibi inceler).
- **Generatif AI kullanımı beyan edilmeli** (varsa).
- 2025 itibarıyla satıcılar Trader/Non-Trader kimlik beyanı yapmalı (AB alıcıları için).
- Gelir payı: **%88 satıcıda kalır.**

## README.md İskeleti

```markdown
# [Ürün Adı] — Data-Driven Product Configurator for UE5

> Sektörden bağımsız, tamamen Blueprint, veri-odaklı ürün konfigüratörü.

## ✨ Highlights
- 100% Blueprint — **no C++ required**
- Data-Driven: DataTable / JSON ile ürün-varyasyon-fiyat, **sıfır kod**
- **Lumen & Nanite ready** material mimarisi (MIC / MID / MPC)
- Runtime model import (glTF/FBX) — son kullanıcı kendi modelini yükler
- Çoklu, production-ready UI temaları
- Modüler & sector-agnostic: mobilya · teknoloji · sanat galerisi
- Pricing & configuration **JSON export** (e-ticaret entegrasyonu)

## 📦 Requirements
- Unreal Engine 5.x
- Plugins: glTFRuntime (opsiyonel, runtime import için)
- Platforms: Windows (Pixel Streaming uyumlu)

## 🚀 Quick Start (5 dk)
1. Projeyi aç → `L_Demo` sahnesini çalıştır
2. `EUW_SetupUtility`'yi aç → yeni ürün ekle
3. Play → yeni ürün UI'da otomatik görünür

## 🏗 Architecture
[Diyagram: DataTable → Manager → UI + Material System (MIC/MID/MPC)]

## 📚 Documentation
- Setup Utility Guide
- DataTable Schema Reference
- Material System (master material / yeni seçenek ekleme)
- UI Customization / Theming
- Lighting Presets
- Pricing & Export
- Packaging & Distribution
- Performance (Lumen/Nanite notları)

## ❓ FAQ / Troubleshooting
## 🛟 Support · Changelog · License
```

## Satın Almayı Etkileyen Teknik Vurgular

Alıcı iki profildir; her ikisine ayrı ayrı konuş:

### Tasarımcı / stüdyo (kod bilmez)
- "No C++, no coding — sadece bir tabloyu doldur."
- "Kendi modelini yükle" (runtime import) — kendi kataloğunu dakikalar içinde kur.
- Hazır, şık UI temaları — hemen sunuma hazır.
- Örnek sahneler + video + demo.

### Geliştirici (entegre edecek)
- **Lumen & Nanite ready**, MIC/MID/MPC ile *doğru* material mimarisi (performans kanıtı).
- Temiz, yorumlanmış Blueprint'ler; tutarlı isimlendirme; **redirector yok**; tek *Pack* dizini (Fab uyumu = kalite sinyali).
- Data-driven & modüler → kendi projesine genişletmesi kolay.
- JSON export → mevcut e-ticaret/PIM sistemine bağlanabilir.
- Cross-platform + **Pixel Streaming** (web'de konfigüratör).

**Premium algı kuralı:** ekran görüntüleri/videoda hem *sonucu* (güzel render) hem *arkasını* (temiz DataTable, Setup Utility, node grafiği) göster — alıcı "bu profesyonelce yapılmış" desin.

## Kaynaklar
- [Fab — Asset File Format & Structure Requirements](https://dev.epicgames.com/documentation/fab/asset-file-format-and-structure-requirements-in-fab?lang=en-US)
- [Fab launch / revenue share duyurusu](https://www.unrealengine.com/en-US/blog/fab-epics-new-unified-content-marketplace-launches-today)
- [Fab Documentation (ana sayfa)](https://dev.epicgames.com/documentation/fab/fab-documentation)
