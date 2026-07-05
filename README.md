# Öz Geçmiş Asistanı v4.0

Profesyonel, erişilebilir ve tamamen çevrimdışı çalışan masaüstü CV (öz geçmiş) hazırlama uygulaması. **Electron + JavaScript** ile geliştirilmiştir. Verileriniz yalnızca sizin bilgisayarınızda saklanır.

![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Version](https://img.shields.io/badge/version-4.0.0-orange)

## ✨ Özellikler

- 📝 **Kapsamlı CV alanları:** Kişisel bilgiler, özet, deneyim, eğitim, sertifika, proje, ödül, gönüllülük, beceriler, diller, hobiler, referanslar
- 🎨 **3 Profesyonel Şablon:** Modern, Klasik, Minimal (ATS uyumlu)
- 🤖 **Çoklu AI Sağlayıcı Desteği:** OpenAI (GPT-4o/mini) veya Google Gemini (2.5 Flash/Pro) ile otomatik profesyonel özet
- 📄 **Yüksek Kaliteli Dışa Aktarma:** PDF (Türkçe karakter tam desteği) ve Word (DOCX)
- 📥 **İçe Aktarma:** Mevcut PDF CV'lerden bilgi çekme + JSON yedekleme/geri yükleme
- 💾 **Çoklu Taslak:** Farklı pozisyonlar için birden çok CV sürümü, otomatik kaydetme
- ♿ **Erişilebilirlik:** Ekran okuyucu desteği, ARIA canlı bildirimler, tam klavye navigasyonu, "İçeriğe atla" bağlantısı
- 🌗 **Tema Seçenekleri:** Açık / Koyu / Yüksek Kontrast
- 🔒 **Gizlilik Odaklı:** Tüm veriler yerelde; API anahtarları yalnızca seçtiğiniz sağlayıcıya gider
- ⌨️ **Klavye Kısayolları:** F1 yardım, Ctrl+S PDF, Ctrl+Shift+S Word, Ctrl+G AI özet, F7 denetim ve daha fazlası

## 📸 Ekran Görüntüleri

> Ekran görüntülerini `docs/screenshots/` klasörüne ekleyip buraya bağlayabilirsiniz.

## 🚀 Kurulum

### Hazır Sürümü İndir

[Releases](../../releases) sayfasından işletim sisteminize uygun sürümü indirin:

- **Windows:** `OzgecmisAsistani-win32-x64.zip` — arşivi açın, `OzgecmisAsistani.exe` çalıştırın
- **macOS:** `OzgecmisAsistani-darwin-x64.zip`
- **Linux:** `OzgecmisAsistani-linux-x64.tar.gz`

### Kaynak Koddan Çalıştır

```bash
git clone https://github.com/<KULLANICI_ADI>/<REPO_ADI>.git
cd <REPO_ADI>/electron-app
npm install
npm start
```

### Kendi Kurulum Paketinizi Oluşturun

```bash
cd electron-app
npm run build:win        # Windows .exe için
# veya farklı platform:
npx @electron/packager . "OzgecmisAsistani" --platform=darwin --arch=x64 --out=dist --overwrite
```

## 🤖 AI Kurulumu (Opsiyonel)

Uygulama içinde **Araçlar → AI Sağlayıcı Ayarları** menüsünden:

- **OpenAI:** [platform.openai.com/api-keys](https://platform.openai.com/api-keys) adresinden `sk-...` anahtarı alın
- **Google Gemini:** [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) adresinden ücretsiz anahtar alın

API anahtarları yalnızca yerel bilgisayarınızda saklanır.

## ⌨️ Klavye Kısayolları

| Kısayol | İşlev |
|---------|-------|
| `F1` | Kullanım kılavuzu |
| `F2` | Kısayol listesi |
| `F7` | Erişilebilirlik & içerik denetimi |
| `Ctrl+N` | Yeni taslak |
| `Ctrl+T` | Taslakları yönet |
| `Ctrl+S` | PDF olarak kaydet |
| `Ctrl+Shift+S` | Word olarak kaydet |
| `Ctrl+O` | PDF'den bilgi çek |
| `Ctrl+G` | AI ile özet oluştur |
| `Ctrl+D` | Metinleri otomatik düzenle |
| `Ctrl+Shift+T` | Tema değiştir |
| `Ctrl+=` / `Ctrl+-` | Yazı boyutu büyüt / küçült |

## 🛠️ Teknoloji Yığını

- **Electron 33** — çapraz platform masaüstü çatısı
- **JavaScript (Vanilla)** — çerçeve bağımlılığı yok, hızlı ve hafif
- **electron-store** — yerel veri saklama
- **docx** — Word (DOCX) üretimi
- **pdf-parse** — PDF'den metin çıkarma
- **Chromium printToPDF** — tam Unicode destekli PDF üretimi
- **GitHub Actions** — otomatik çapraz platform build & release

## 📦 Otomatik Build & Release

Bu proje, `v*` biçiminde bir etiket (tag) push edildiğinde GitHub Actions ile Windows, macOS ve Linux için otomatik olarak paketlenir ve GitHub Releases sayfasında yayınlanır.

Yeni bir sürüm çıkarmak için:

```bash
git tag v4.0.1
git push origin v4.0.1
```

Ayrıca **Actions** sekmesinden "Build & Release Electron App" workflow'unu elle de tetikleyebilirsiniz.

## 🤝 Katkıda Bulunma

Katkılar memnuniyetle karşılanır!

1. Bu depoyu fork edin
2. Yeni bir dal oluşturun (`git checkout -b ozellik/yeni-ozellik`)
3. Değişikliklerinizi commit'leyin (`git commit -m 'Yeni özellik: ...'`)
4. Dalınıza push edin (`git push origin ozellik/yeni-ozellik`)
5. Pull Request açın

Hata bildirimleri ve öneriler için lütfen [Issues](../../issues) sekmesini kullanın.

## 📄 Lisans

Bu proje **MIT lisansı** ile lisanslanmıştır. Ayrıntılar için [LICENSE](LICENSE) dosyasına bakın.

## 🙏 Teşekkür

- Erişilebilirlik geri bildirimleri için tüm kullanıcılara
- Açık kaynak topluluğuna

---

**Sorun mu yaşıyorsunuz?** [Issue açın](../../issues/new) — Türkçe destek verilmektedir.
