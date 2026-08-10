import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CV Companion Pro — Erişilebilir Öz Geçmiş Asistanı (Windows, Offline)" },
      {
        name: "description",
        content:
          "OpenAI & Gemini destekli, tamamen offline çalışan erişilebilir öz geçmiş asistanı. PDF/Word dışa aktarma, ATS uyum puanı ve ekran okuyucu desteği.",
      },
      { property: "og:title", content: "CV Companion Pro — Erişilebilir Öz Geçmiş Asistanı" },
      {
        property: "og:description",
        content:
          "Windows için tamamen offline çalışan, ekran okuyucu uyumlu öz geçmiş asistanı. AI özet, ATS puanlama ve PDF/Word çıktı.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const features = [
  {
    icon: "📄",
    title: "PDF & Word Dışa Aktarma",
    desc: "Modern, Klasik ve Minimal şablonlarla Türkçe karakter desteği eksiksiz PDF ve DOCX çıktısı.",
  },
  {
    icon: "🤖",
    title: "AI Destekli Özet & Ön Yazı",
    desc: "Kendi OpenAI veya Google Gemini API anahtarınızı girin; CV özeti ve pozisyona özel ön yazı otomatik üretsin.",
  },
  {
    icon: "✅",
    title: "ATS Uyum Puanı",
    desc: "CV'nizi 100 üzerinden puanlar; anahtar kelime, eylem fiili ve yapısal uyumu denetler, eksikleri gösterir.",
  },
  {
    icon: "🎯",
    title: "İş İlanı Eşleştirme",
    desc: "CV'nizi iş ilanı metniyle karşılaştırır; eşleşme yüzdesi, eksik anahtar kelimeler ve öneriler verir.",
  },
  {
    icon: "♿",
    title: "Ekran Okuyucu Desteği",
    desc: "Bölüm Gezgini (F3), düz metin önizleme (F4), anlık hata doğrulama ve ARIA etiketleri ile tam erişilebilirlik.",
  },
  {
    icon: "💾",
    title: "Otomatik Taslak & Geri Alma",
    desc: "Değişiklikler otomatik kaydedilir; Ctrl+Z ile yanlışlıkla silinen blokları geri alabilirsiniz.",
  },
  {
    icon: "📥",
    title: "JSON & PDF İçe Aktarma",
    desc: "Daha önce kaydettiğiniz JSON dosyasını veya PDF CV'yi içe aktarıp düzenlemeye devam edin.",
  },
  {
    icon: "🔌",
    title: "Tamamen Offline",
    desc: "Sunucu gerektirmez, internet bağlantısı gerekmez (AI özellikleri hariç). Verileriniz bilgisayarınızdan çıkmaz.",
  },
];

const shortcuts = [
  { key: "F1", desc: "Kullanım kılavuzu" },
  { key: "F3", desc: "Bölüm gezgini (ekran okuyucu)" },
  { key: "F4", desc: "Düz metin önizleme" },
  { key: "F8", desc: "ATS uyum puanı" },
  { key: "F9", desc: "İş ilanı eşleştirme" },
  { key: "F10", desc: "AI ön yazı oluştur" },
  { key: "Alt+1–9", desc: "Bölümler arası hızlı geçiş" },
  { key: "Ctrl+Z", desc: "Geri al" },
];

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <header className="border-b border-border bg-gradient-to-b from-secondary/50 to-background">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground">
            🖥️ Windows · Offline · v4.1
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            CV Companion Pro
          </h1>
          <p className="mt-2 text-lg font-medium text-muted-foreground">
            Erişilebilir Öz Geçmiş Asistanı
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
            OpenAI & Gemini destekli, tamamen offline çalışan masaüstü uygulaması.
            Ekran okuyucu uyumlu arayüz, ATS puanlama, iş ilanı eşleştirme ve
            yüksek kaliteli PDF/Word çıktısı — hepsi tek bir Windows uygulamasında.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm">
            <span className="rounded-lg border border-border bg-card px-4 py-2 text-foreground">
              ✅ Sunucu gerekmez
            </span>
            <span className="rounded-lg border border-border bg-card px-4 py-2 text-foreground">
              ✅ Kayıt gerekmez
            </span>
            <span className="rounded-lg border border-border bg-card px-4 py-2 text-foreground">
              ✅ Verileriniz bilgisayarınızda kalır
            </span>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 py-16" aria-labelledby="features-heading">
        <h2 id="features-heading" className="text-2xl font-bold text-foreground">
          Özellikler
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-card p-6 text-card-foreground transition-shadow hover:shadow-md"
            >
              <div className="text-3xl" aria-hidden="true">
                {f.icon}
              </div>
              <h3 className="mt-3 text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Shortcuts */}
      <section className="border-y border-border bg-secondary/30" aria-labelledby="shortcuts-heading">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 id="shortcuts-heading" className="text-2xl font-bold text-foreground">
            Klavye Kısayolları
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Klavye odaklı ve ekran okuyucu uyumlu çalışma için tasarlanmıştır.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {shortcuts.map((s) => (
              <div
                key={s.key}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
              >
                <kbd className="rounded-md border border-border bg-secondary px-3 py-1 text-sm font-semibold text-foreground">
                  {s.key}
                </kbd>
                <span className="text-sm text-muted-foreground">{s.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to use */}
      <section className="mx-auto max-w-5xl px-6 py-16" aria-labelledby="how-heading">
        <h2 id="how-heading" className="text-2xl font-bold text-foreground">
          Nasıl Kullanılır?
        </h2>
        <ol className="mt-8 space-y-5">
          {[
            {
              step: "1",
              title: "Uygulamayı indirin",
              desc: "Windows için paketlenmiş .zip dosyasını indirin ve bir klasöre çıkarın.",
            },
            {
              step: "2",
              title: "Çalıştırın",
              desc: "OzgecmisAsistani.exe dosyasını çift tıklayın. Kurulum gerektirmez, internet gerekmez.",
            },
            {
              step: "3",
              title: "Bilgilerinizi girin",
              desc: "Kişisel bilgiler, deneyim, eğitim, beceriler ve diğer bölümleri doldurun. Otomatik kaydedilir.",
            },
            {
              step: "4",
              title: "AI kullanın (opsiyonel)",
              desc: "Ayarlar'dan OpenAI veya Gemini seçin, API anahtarınızı girin. AI özet ve ön yazı üretebilir.",
            },
            {
              step: "5",
              title: "Dışa aktarın",
              desc: "PDF, Word veya JSON olarak kaydedin. ATS puanı (F8) ile uyumu kontrol edin.",
            },
          ].map((s) => (
            <li key={s.step} className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {s.step}
              </span>
              <div>
                <h3 className="text-base font-semibold text-foreground">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Offline note */}
      <section className="border-t border-border bg-card" aria-labelledby="offline-heading">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 id="offline-heading" className="text-2xl font-bold text-foreground">
            Neden Offline?
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">Gizlilik</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Öz geçmişiniz hassas kişisel veriler içerir. Hiçbir sunucuya yüklenmez; tüm veriler
                bilgisayarınızda yerel olarak saklanır.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Bağımsızlık</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Sunucu çalışmıyor veya internet yok diye uygulamanız durmaz. Bir kez indirince
                sonsuza dek çalışır.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Hız</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Ağ gecikmesi yok. Form doldurma, önizleme ve dışa aktarma anında gerçekleşir.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-8 text-center text-sm text-muted-foreground">
          <p>CV Companion Pro — Erişilebilir Öz Geçmiş Asistanı · v4.1</p>
          <p className="mt-2">
            GitHub:{" "}
            <a
              href="https://github.com/selcukucar/cv-companion-pro"
              className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
            >
              selcukucar/cv-companion-pro
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
