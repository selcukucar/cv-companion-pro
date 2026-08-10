// Kullanım kılavuzu içeriği - erişilebilir, ekran okuyucu dostu
window.MANUAL_HTML = `
<article aria-label="Kullanım Kılavuzu">
  <h3>1. Uygulamaya Genel Bakış</h3>
  <p><strong>Öz Geçmiş Asistanı v4.1</strong>, profesyonel ve erişilebilir bir CV hazırlamanızı sağlayan masaüstü yazılımıdır. Verileriniz <em>yalnızca sizin bilgisayarınızda</em> saklanır; hiçbir sunucuya gönderilmez.</p>
  <ul>
    <li>PDF, Word (DOCX) ve düz metin (ATS uyumlu TXT) dışa aktarma</li>
    <li>3 profesyonel şablon (Modern, Klasik, Minimal)</li>
    <li>OpenAI (ChatGPT) veya Google Gemini ile AI özet ve ön yazı üretimi</li>
    <li>ATS uyum puanı ve iş ilanı anahtar kelime eşleştirmesi</li>
    <li>Otomatik kaydetme, çoklu taslak, Ctrl+Z ile geri alma</li>
    <li>Açık / Koyu / Yüksek Kontrast temaları</li>
    <li>Klavye kısayolları, bölüm gezgini ve ekran okuyucu önizlemesi</li>
  </ul>


  <h3>2. Hızlı Başlangıç</h3>
  <ol>
    <li><strong>Kişisel Bilgiler</strong> bölümünü doldurun (en azından Ad Soyad zorunludur).</li>
    <li><strong>Profesyonel Özet</strong> yazın veya "✨ AI ile Oluştur" butonuna basın.</li>
    <li>"+ Deneyim Ekle", "+ Eğitim Ekle" vb. butonlarıyla bloklar oluşturun.</li>
    <li>Sağ üstteki <strong>"İndir ▾"</strong> butonundan şablon seçip PDF veya Word olarak indirin.</li>
  </ol>

  <h3>3. Bölüm Bölüm Rehber</h3>

  <h4>Kişisel Bilgiler</h4>
  <p>Doğum tarihi, uyruk, askerlik, sürücü belgesi ve medeni durum <em>opsiyoneldir</em>. Türkiye dışına başvuruyorsanız bunları boş bırakmanız daha profesyoneldir. Profil fotoğrafı en fazla 5 MB olabilir; JPG/PNG desteklenir.</p>

  <h4>Profesyonel Özet</h4>
  <p>3–4 cümlelik güçlü bir tanıtım. AI kullanacaksanız Ad Soyad ve Unvan alanları dolu olmalı; beceriler ve deneyimlerinizden ne kadar çok bilgi girmişseniz AI o kadar iyi yazar.</p>

  <h4>İş Deneyimi</h4>
  <p>Görevleri her satır bir madde olacak şekilde yazın. Örnek:</p>
  <pre>Kullanıcı sayısını 6 ayda %40 artırdım
5 kişilik ekibi yönettim
CI/CD hattını kurdum</pre>
  <p><strong>Ctrl+D</strong> ile tüm deneyim açıklamaları otomatik olarak "• " ile başlar.</p>

  <h4>Eğitim, Sertifika, Proje, Ödül, Gönüllülük</h4>
  <p>Her bloğu ekleyip doldurun. Bir bloğu silmek için üzerine tıklayıp <kbd>Delete</kbd> tuşuna basın veya "Sil" butonunu kullanın. Boş bırakılan bloklar dışa aktarımda görünmez.</p>

  <h4>Beceriler & Diller & Hobiler</h4>
  <p>Becerileri ve hobileri <strong>virgülle</strong> ayırın: "JavaScript, Python, İletişim". Diller için CEFR seviyeleri (A1–C2) veya "Anadil/İleri/Orta/Başlangıç" kullanabilirsiniz.</p>

  <h4>Referanslar</h4>
  <p>Referans kişileri ekleyebilir <em>veya</em> "İstek üzerine sunulacaktır" onay kutusunu işaretleyebilirsiniz. İkisini birden kullanmayın.</p>

  <h3>4. AI Kullanımı</h3>
  <p>Üst çubuktaki <strong>"✨ AI Özet"</strong> veya Özet bölümünün yanındaki buton AI ile 3-4 cümlelik profesyonel bir özet üretir.</p>
  <h4>Sağlayıcı ve API Anahtarı</h4>
  <p>Araçlar → AI Sağlayıcı Ayarları menüsünden:</p>
  <ul>
    <li><strong>OpenAI:</strong> <code>platform.openai.com/api-keys</code> adresinden "sk-..." ile başlayan anahtar alın. Önerilen model: <em>gpt-4o-mini</em> (ucuz &amp; hızlı) veya <em>gpt-4o</em> (kaliteli).</li>
    <li><strong>Google Gemini:</strong> <code>aistudio.google.com/app/apikey</code> adresinden ücretsiz anahtar alın. Önerilen: <em>gemini-2.5-flash</em> (hızlı) veya <em>gemini-2.5-pro</em> (kaliteli).</li>
  </ul>
  <p><strong>Güvenlik:</strong> Anahtarınız <em>sadece</em> bu uygulamanın yerel veri klasöründe saklanır ve doğrudan OpenAI/Google sunucularına gönderilir; başka hiçbir yere değil.</p>

  <h3>5. Dışa Aktarma</h3>
  <h4>PDF</h4>
  <p>Chromium'un PDF motoru kullanılır. Türkçe karakterler, tırnaklar, semboller sorunsuz çıkar. Şablonlar:</p>
  <ul>
    <li><strong>Modern:</strong> Renkli başlık bandı, iki sütunlu düzen. Yaratıcı sektörler için.</li>
    <li><strong>Klasik:</strong> Serif yazı tipi, geleneksel tek sütun. Akademi, hukuk, finans için.</li>
    <li><strong>Minimal:</strong> Sade, çok boşluklu, ATS-dostu (İnsan Kaynakları taramaları için ideal).</li>
  </ul>
  <h4>Word (DOCX)</h4>
  <p>Microsoft Word, Google Docs ve LibreOffice ile uyumludur. İçerik tam olarak korunur; üzerinde düzenleme yapabilirsiniz.</p>

  <h3>6. İçe Aktarma</h3>
  <h4>PDF'den Bilgi Çekme (Ctrl+O)</h4>
  <p>Var olan bir CV PDF'inden Ad, Unvan, E-posta, Telefon ve LinkedIn otomatik çıkarılır. Karmaşık düzenli PDF'lerde tüm bilgiler bulunamayabilir; eksikleri elle tamamlayın.</p>
  <h4>JSON Yedeği</h4>
  <p>Dosya → JSON Olarak Yedekle ile tüm verinizi tek dosyada saklayın. Yeni bir bilgisayara "JSON İçe Aktar" ile tam olarak taşıyın.</p>

  <h3>7. Taslaklar</h3>
  <p>Farklı pozisyonlar için birden fazla CV sürümü tutabilirsiniz. <strong>Taslaklar</strong> butonuna basın → ad yazın → "Mevcut CV'yi Taslağa Kaydet". Daha sonra "Yükle" ile geri getirin. Otomatik kaydetme, aktif CV'yi <em>her zaman</em> saklar — taslak kaydetmezseniz de veriniz kaybolmaz.</p>

  <h3>8. Erişilebilirlik</h3>
  <ul>
    <li><strong>Ekran okuyucu:</strong> Tüm alanlar etiketli, önemli değişiklikler ARIA canlı bölge ile duyurulur.</li>
    <li><strong>Klavye:</strong> Tüm işlevler kısayollarla erişilebilir (F2 tuşuyla listeye bakın).</li>
    <li><strong>Yüksek kontrast tema:</strong> Ctrl+Shift+T ile Açık → Koyu → Yüksek Kontrast döngüsü.</li>
    <li><strong>Yazı boyutu:</strong> Ctrl+= ve Ctrl+- ile büyütüp küçültebilirsiniz.</li>
    <li><strong>Odak göstergesi:</strong> Aktif eleman her zaman görünür bir çerçeveyle işaretlenir.</li>
    <li><strong>İçeriğe atla:</strong> Tab tuşuna ilk basışta "İçeriğe atla" bağlantısı görünür.</li>
  </ul>

  <h3>9. Denetim & Otomatik Düzenleme</h3>
  <p><kbd>F7</kbd> tuşu CV'nizi tarar: eksik alanlar, geçersiz e-posta, boş bölümler için uyarı verir. <kbd>Ctrl+D</kbd> ise iş deneyimi açıklamalarını otomatik olarak madde işaretli hale getirir.</p>

  <h3>10. Sık Karşılaşılan Sorunlar</h3>
  <dl>
    <dt>AI özet üretmiyor</dt>
    <dd>API anahtarınızı ve sağlayıcı seçimini kontrol edin. OpenAI anahtarı "sk-" ile, Gemini "AIza" ile başlar. Ayrıca internet bağlantınızı doğrulayın.</dd>
    <dt>PDF'de fotoğraf çıkmıyor</dt>
    <dd>Fotoğraf 5 MB'dan büyük olamaz. PNG/JPG kullanın.</dd>
    <dt>PDF içe aktarımı eksik bilgi çekiyor</dt>
    <dd>PDF karmaşık düzendeyse (çok sütunlu, taranmış görsel) metin çıkarılamayabilir. Bilgileri elle girin.</dd>
    <dt>Word dosyası hata veriyor</dt>
    <dd>Çok eski Word sürümlerinde uyumsuzluk olabilir; Google Docs veya LibreOffice ile açın.</dd>
  </dl>

  <h3>11. İpuçları</h3>
  <ul>
    <li>Tek sayfada tutmak için deneyim açıklamalarını 3–5 madde ile sınırlayın.</li>
    <li>ATS (İnsan Kaynakları) taramaları için Minimal şablonu ya da düz metin çıktısını tercih edin.</li>
    <li>Her başvuru için deneyim açıklamalarını hedef pozisyona göre düzenleyin — taslak sistemi bunu kolaylaştırır.</li>
    <li>AI özetini kopya olarak değil, taslak olarak kullanın; kendi cümlelerinizle son halini verin.</li>
  </ul>

  <h3>12. ATS Uyum Puanı (F8)</h3>
  <p>CV'niz 100 puan üzerinden değerlendirilir. Puan; iletişim bilgilerinin tamlığı, özet uzunluğu, beceri sayısı, tarih aralıklarının eksiksizliği, ölçülebilir başarılar ve etkili eylem fiilleri gibi ölçütlere bakar. Her madde "✅" veya "❌" ile başlar ve kaç puan kazandığınızı söyler; ekran okuyucu listeyi baştan sona okuyabilir.</p>
  <ul>
    <li><strong>85–100:</strong> Mükemmel — başvuruya hazır.</li>
    <li><strong>70–84:</strong> İyi — küçük eklemelerle güçlenir.</li>
    <li><strong>50–69:</strong> Geliştirilebilir — eksik maddeleri tamamlayın.</li>
    <li><strong>50 altı:</strong> Zayıf — temel bölümler eksik.</li>
  </ul>

  <h3>13. İş İlanı Eşleştirme (F9)</h3>
  <ol>
    <li>Başvuracağınız ilanın metnini kopyalayıp pencerede açılan alana yapıştırın.</li>
    <li><strong>Analiz Et</strong> düğmesine basın. Uygulama ilandaki en önemli 40 anahtar kelimeyi çıkarır.</li>
    <li>Eşleşme oranı ve eksik kelimeler listelenir; eksik kelimeler ekran okuyucuya ayrıca cümle olarak da okutulur.</li>
    <li><strong>✨ Özeti İlana Göre Uyarla</strong> düğmesi, mevcut CV bilgilerinizi kullanarak özeti ilana göre yeniden yazar.</li>
  </ol>
  <p>Uyarı: Yalnızca gerçekten sahip olduğunuz beceri ve deneyimleri ekleyin. Sahip olmadığınız anahtar kelimeleri eklemek mülakatta sorun yaratır.</p>

  <h3>14. Ön Yazı Oluşturma (F10)</h3>
  <p>Şirket adı ve pozisyonu girin, isteğe bağlı olarak vurgulanmasını istediğiniz noktaları yazın ve <strong>Ön Yazı Oluştur</strong> düğmesine basın. Oluşan metni doğrudan düzenleyebilir, panoya kopyalayabilir veya TXT olarak kaydedebilirsiniz. Bu özellik AI anahtarı gerektirir.</p>

  <h3>15. Ekran Okuyucu Kullanıcıları İçin Özellikler</h3>
  <ul>
    <li><strong>F4 — Ekran Okuyucu Önizlemesi:</strong> CV'nizin tamamı düz metin olarak tek bir okunabilir alanda sunulur; kelime sayısı, karakter sayısı ve tahmini sayfa sayısı duyurulur. Ok tuşlarıyla satır satır okuyabilirsiniz.</li>
    <li><strong>F3 — Bölüm Gezgini:</strong> 12 bölüm arasında düğmelerle geçiş yapın. <kbd>Alt+1</kbd> … <kbd>Alt+9</kbd> ile doğrudan bölüme atlayabilirsiniz.</li>
    <li><strong>Akıllı blok etiketleri:</strong> Her deneyim/eğitim bloğu "İş Deneyimi 2 / 3: Yazılım Geliştirici, ACME" biçiminde okunur, böylece kaçıncı kayıtta olduğunuzu bilirsiniz.</li>
    <li><strong>Alt+Yukarı / Alt+Aşağı:</strong> Odaklandığınız bloğu sıralamada taşır; <kbd>Delete</kbd> siler, <kbd>Ctrl+Z</kbd> geri alır.</li>
    <li><strong>Doluluk göstergesi:</strong> Başlıktaki ilerleme çubuğu yüzde olarak okunur ve her değişiklikte güncellenir.</li>
    <li><strong>Hata duyuruları:</strong> Geçersiz e-posta veya link girdiğinizde alanın altında rol="alert" ile anında duyurulan bir mesaj oluşur; alan "geçersiz" olarak işaretlenir.</li>
    <li><strong>Odak yönetimi:</strong> Pencereler kapandığında odak, pencereyi açtığınız düğmeye geri döner. Yeni blok eklediğinizde odak doğrudan ilk alana gider.</li>
    <li><strong>Bildirimler:</strong> Kayıt, dışa aktarma ve hata mesajları hem görsel bildirim hem de canlı bölge duyurusu olarak verilir; kesintili uyarı pencereleri en aza indirilmiştir.</li>
  </ul>

  <h3>16. Metinleri Otomatik Düzenle (Ctrl+D)</h3>
  <p>Bu komut: deneyim ve gönüllülük açıklamalarını madde işaretli hâle getirir, fazla boşlukları siler, beceri ve hobilerdeki tekrarları temizler, "https://" ile başlamayan LinkedIn/website adreslerini düzeltir. İşlem sonunda ne yapıldığı duyurulur.</p>
</article>
`;

