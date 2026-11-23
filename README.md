# Öz Geçmiş Asistanı · CV Assistant

[Windows 0.12.4 önizlemesini indir](https://github.com/selcukucar/cv-companion-pro/releases) · [Electron arşivi](https://github.com/selcukucar/cv-companion-pro/tree/archive/electron-v4)

Windows 10 ve 11 ana hedeflerdir. 32 ve 64 bit Windows için AnyCPU olarak derlenir. Çalıştırmak için .NET Framework 4.8 veya üzeri gerekir. Windows 10 22H2 ve Windows 11 bu gereksinimi kutudan karşılar. Kurulum paketi gereken sürüm eksikse Microsoft indirme sayfasını açmayı teklif eder. Portable ZIP içinde de aynı sayfanın bağlantısı var. Windows 10 22H2 ve Windows 11 bu gereksinimi kutudan karşılar. Kurulum paketi gereken sürüm eksikse Microsoft indirme sayfasını açmayı teklif eder. Portable ZIP içinde de aynı sayfanın bağlantısı var.

- Kurulum EXE’si kullanıcı hesabına yüklenir ve Başlat menüsüne bir kısayol ekler. Kurulu sürüm üzerine yapılan güncelleme mevcut taslakları korur. İlk kurulum veya kaldırıp yeniden kurma sırasında önceki yerel taslaklar Windows profilinde taslaklar-onceki-*.json adıyla arşivlenir ve uygulama boş bir taslakla açılır.
- Portable ZIP’i yazılabilir bir klasöre çıkarın. OzgecmisAsistani.exe dosyasını bu klasörde açın. Taslaklar, ayarlar ve kısayollar Data klasöründe saklanır. Önceki sürümden bir taslağı taşımak için JSON yedeğini içe aktarabilirsiniz. API anahtarları Windows kullanıcı hesabında kalır. Başkalarıyla paylaşırken Releases sayfasındaki orijinal ZIP dosyasını kullanın. Kullanılmış Data klasöründe kişisel bilgiler bulunabilir.


Türkçe ve İngilizce arayüz ve çıktı başlıkları desteklenir. Ayarlar’dan dili seçip programı yeniden açın. CV alanlarına yazdığınız metin korunur.

[Microsoft .NET Framework 4.8 çalışma zamanı](https://dotnet.microsoft.com/download/dotnet-framework/net48)

[Microsoft .NET Framework 4.8 çalışma zamanı](https://dotnet.microsoft.com/download/dotnet-framework/net48)

## Klavye ile kullanım

- F1 çevrimdışı HTML kullanım kılavuzunu varsayılan tarayıcıda açar. İçindekiler bağlantılarıyla veya ekran okuyucunuzun başlık gezinmesiyle konu seçebilirsiniz.
- Yardım → Klavye kısayolları bölümünden komutların etkin tuşlarını görün, değiştirin veya varsayılana döndürün.
- Ctrl+Virgül ile yazı boyutu ve durum duyurusu ayarlarını açın. Ayarlar kullanıcı profilinde taslaklardan ayrı saklanır. Renkler Windows’un sistem ayarlarını izler.
- F3 bölüm listesine gider. Ok tuşlarıyla bölüm seçin. Enter, düzenleme penceresini açar veya boş bir bölümde Kayıt ekle düğmesine gider.
- Tab ve Shift+Tab, alanlar ve düğmeler arasında dolaşır. Kaydet ile değişiklikler yerel taslağa yazılır.
- F4 düz metin önizlemesini açar. Tüm metni kopyala düğmesiyle CV’yi panoya alabilirsiniz.
- Ctrl+F ile CV’de bir alanı veya yazdığınız metni arayın. Sonuçları ok tuşlarıyla seçip Enter ile ilgili alanı açın.
- F7, etkin taslağın içerik ve çıktı erişilebilirliği denetimini açar. Ok tuşlarıyla bulguyu seçin ve Enter ile ilgili alanı açın. Düzenleme penceresi kapanınca denetim sonuçları yenilenir. Esc ile denetimi kapatabilirsiniz.
- F9, ilan metnindeki terimleri etkin CV ile çevrimdışı karşılaştırır. İlan kaydedilmez. Sonuçlar sözcük eşleşmelerini gösterir.
- Ctrl+N yeni taslak oluşturur. Etkin taslak açılır kutusuyla taslak değiştirin.
- Ctrl+Shift+N etkin taslağın düzenlenebilir bir kopyasını oluşturur.
- Ctrl+Z, bu oturumda etkin taslaktan son silinen kaydı geri getirir.
- F6 son işlem durumunu açar.
- Ctrl+O eski Electron JSON yedeğini ayrı bir taslak olarak açar.
- Ctrl+S düz metin çıktısı ve Ctrl+Shift+S JSON yedeği oluşturur.
- Ctrl+Shift+W Word belgesi (.docx) oluşturur. Bölümler Word gezinti bölmesinde başlık olarak görünür.

- Ctrl+Shift+P, seçilebilir metin, yer imleri ve başlık etiketleri içeren A4 PDF oluşturur. PDF doğrudan uygulama tarafından üretilir.

Kurulu sürümde taslaklar `%LOCALAPPDATA%\OzgecmisAsistaniDesktop\taslaklar.json` içinde saklanır. Yedeklerde kişisel bilgiler bulunabilir. Eski yedekten gelen fotoğraf JSON içinde korunur.

PDF içe aktarma, fotoğraf düzenleme ve ATS analizi bu önizlemenin kapsamı dışındadır.

## İsteğe bağlı yapay zekâ özet önerisi

Ctrl+G ile gönderilecek metni açın. Varsayılan metin unvan ve becerilerden oluşur. Ayarlar → Yapay zekâ sağlayıcıları bölümüne OpenAI veya Gemini anahtarınızı ekleyin. Düzenleyebileceğiniz bu metin yalnızca seçtiğiniz sağlayıcıya gönderilir. Anahtarlar Windows kullanıcı hesabına bağlı DPAPI ile şifrelenir ve CV yedeğine eklenmez. API kullanımı ücretli olabilir. Öneriyi inceleyip Uygula’yı seçtiğinizde etkin taslağın profesyonel özeti değişir.

Sağlayıcınızın kullanım ve veri işleme koşulları uygulanır. [Gemini API koşulları](https://ai.google.dev/gemini-api/terms) · [OpenAI API veri denetimleri](https://developers.openai.com/api/docs/guides/your-data)

## Geri bildirim ve güncelleme

Yardım → Geri bildirim, ad, soyad ve sorun veya öneri alanlarını açar. E-posta taslağı aç düğmesi, info@selcukucar.com adresine bir taslak hazırlar. Mesajı e-posta uygulamanızda gönderirsiniz. Yardım → Güncellemeleri denetle, desktop-v ile başlayan sürümleri arar. Yayımlanmış paketin SHA-256 özeti GitHub verisinde varsa paketi seçtiğiniz konuma indirebilir. Kurulum EXE’sini kendiniz açın. Portable sürümü güncellerken uygulamayı kapatıp ZIP’i aynı klasöre çıkarın ve Data klasörünü saklayın.

## Kaynak koddan derleme

Kaynak arşivini çıkarın ve Windows PowerShell veya PowerShell 7 içinde `.\Build.ps1` çalıştırın. İlk derleme sabitlenmiş bağımlılıkları NuGet üzerinden indirir. Program ve bağımlılıkları build klasörüne çıkar. Kurulum ve portable paketleri için `.\Package.ps1 -InnoCompiler "C:\yol\ISCC.exe"` kullanın. PDFsharp MIT lisansı pakette yer alır.

CV alanları ve JSON yapısı, [Öz Geçmiş Asistanı Electron 4.1](https://github.com/selcukucar/cv-companion-pro/tree/archive/electron-v4/electron-app) kaynak kodundan uyarlanmıştır.