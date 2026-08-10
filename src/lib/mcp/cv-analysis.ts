// Pure, dependency-free CV analysis helpers shared by the MCP tools.
// Mirrors the logic of the desktop app (Öz Geçmiş Asistanı) so agents and the
// app score a CV the same way. No env reads, no I/O: safe to import anywhere.

const STOPWORDS = new Set([
  "ve","ile","için","olan","olarak","bir","bu","da","de","en","veya","gibi","the","and","for","with",
  "you","your","our","are","will","have","that","from","job","iş","ilan","ilanı","tercihen","arıyoruz",
  "aradığımız","aranır","aranan","aramaktayız","aday","adaylar","adayların","deneyim","deneyimi",
  "deneyime","sahip","bilgi","bilgisi","bilgisine","bilgisiyle","tecrübe","tecrübeli","çalışma",
  "çalışacak","yetkinlik","yetkinlikler","olmalı","olması","olmak","gerekli","gereklidir","ayrıca",
  "tüm","her","çok","daha","beklentiler","nitelikler","sorumluluklar","pozisyon","pozisyonu","şirket",
  "şirketimiz","ekip","ekibimiz","ekibine","katılacak","tarafından","konusunda","üzerinde","hakkında",
  "ability","skills","experience","years","team","work","working","role","plus","strong","good",
]);

const ACTION_VERBS = [
  "yönettim","geliştirdim","kurdum","tasarladım","artırdım","azalttım","liderlik","koordine",
  "uyguladım","oluşturdum","iyileştirdim","optimize","otomatikleştirdim","eğittim","analiz",
  "yürüttüm","sağladım","dönüştürdüm","hızlandırdım","kazandırdım",
];

const SUFFIX_RE =
  /(lerimiz|larımız|lerinde|larında|lerine|larına|leri|ları|lerde|larda|lere|lara|lerin|ların|imiz|ımız|iniz|ınız|siz|sız|de|da|te|ta|den|dan|ten|tan|ye|ya|le|la|nin|nın|nun|nün|in|ın|un|ün|si|sı|i|ı|e|a)$/u;

/** Rough Turkish stem so "TypeScript'e" and "TypeScript" match. */
function stem(word: string): string {
  const stripped = word.replace(SUFFIX_RE, "");
  return stripped.length >= 3 ? stripped : word;
}

/** Strips Turkish diacritics for tolerant matching. */
function fold(text: string): string {
  return text
    .replace(/ı/g, "i").replace(/İ/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u")
    .replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c");
}

/** Lowercased, stop-word filtered keyword tokens. Technical terms (.net, c#, c++) survive intact. */
export function tokenize(text: string): string[] {
  const out: string[] = [];
  (text || "")
    .toLowerCase()
    .replace(/[’']/g, " ")
    .replace(/[^\p{L}\p{N}+#.\s]/gu, " ")
    .split(/\s+/)
    .forEach((raw) => {
      const word = raw.replace(/^\.+|\.+$/g, "");
      if (word.length < 3 || STOPWORDS.has(word)) return;
      const keep = /[+#.]/.test(word) ? word : stem(word);
      if (!STOPWORDS.has(keep)) out.push(keep);
    });
  return out;
}

export type AtsCheck = { label: string; passed: boolean; points: number; hint: string };
export type AtsReport = {
  score: number;
  verdict: string;
  wordCount: number;
  checks: AtsCheck[];
  suggestions: string[];
};

/** Scores a plain-text CV out of 100 on ATS-friendliness. */
export function atsReport(cvText: string): AtsReport {
  const text = (cvText || "").trim();
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const lines = text.split(/\r?\n/).map((l) => l.trim());

  const hasEmail = /[^\s@]+@[^\s@]+\.[^\s@]+/.test(text);
  const hasPhone = /(\+?\d[\d\s()-]{7,})/.test(text);
  const bulletLines = lines.filter((l) => /^([-*•]|\d+[.)])\s+/.test(l)).length;
  const numberedAchievements = lines.filter((l) =>
    /(%\s*\d+|\d+\s*(%|percent|kişi|adet|tl|usd|eur|x))/i.test(l),
  ).length;
  const dateRanges = (text.match(/\b(19|20)\d{2}\b/g) || []).length;
  const actionVerbHits = ACTION_VERBS.filter((v) => lower.includes(v)).length;
  // Diacritic-insensitive so "EGITIM" also counts as "eğitim".
  const flat = fold(lower);
  const sectionHits = ["deneyim", "egitim", "beceri", "yetenek", "sertifika", "proje", "dil"].filter((s) =>
    flat.includes(s),
  ).length;

  const checks: AtsCheck[] = [
    { label: "E-posta adresi var", passed: hasEmail, points: 10, hint: "İletişim bölümüne bir e-posta adresi ekleyin." },
    { label: "Telefon numarası var", passed: hasPhone, points: 10, hint: "Ülke kodlu bir telefon numarası ekleyin." },
    { label: "Yeterli uzunluk (150+ kelime)", passed: words.length >= 150, points: 10, hint: "CV çok kısa; deneyim ve becerileri detaylandırın." },
    { label: "Aşırı uzun değil (900 kelimeden az)", passed: words.length < 900, points: 5, hint: "CV çok uzun; en alakalı 1-2 sayfaya indirin." },
    { label: "Standart bölüm başlıkları var (en az 4)", passed: sectionHits >= 4, points: 15, hint: "Deneyim, Eğitim, Beceriler, Diller gibi standart başlıklar kullanın." },
    { label: "Madde işaretli açıklamalar (en az 5)", passed: bulletLines >= 5, points: 15, hint: "Deneyim açıklamalarını madde işaretli satırlara bölün." },
    { label: "Ölçülebilir başarılar var (en az 2)", passed: numberedAchievements >= 2, points: 15, hint: "Başarıları sayıyla yazın: \"%30 performans artışı\" gibi." },
    { label: "Tarih aralıkları var (en az 2 yıl bilgisi)", passed: dateRanges >= 2, points: 10, hint: "Her deneyim ve eğitim için başlangıç/bitiş yılı yazın." },
    { label: "Etkili eylem fiilleri var (en az 3)", passed: actionVerbHits >= 3, points: 10, hint: "\"yönettim\", \"geliştirdim\", \"artırdım\" gibi fiillerle başlayın." },
  ];

  const score = checks.reduce((sum, c) => (c.passed ? sum + c.points : sum), 0);
  const verdict =
    score >= 85 ? "Mükemmel — başvuruya hazır"
    : score >= 70 ? "İyi — küçük eklemelerle güçlenir"
    : score >= 50 ? "Geliştirilebilir"
    : "Zayıf — temel bölümler eksik";

  return {
    score,
    verdict,
    wordCount: words.length,
    checks,
    suggestions: checks.filter((c) => !c.passed).map((c) => c.hint),
  };
}

export type JobMatch = {
  matchPercent: number;
  keywordCount: number;
  matched: string[];
  missing: string[];
  advice: string;
};

/** Compares a CV against a job posting and reports keyword coverage. */
export function matchJobPosting(cvText: string, postingText: string, limit = 30): JobMatch {
  const cvTokens = new Set(tokenize(cvText));
  const counts = new Map<string, number>();
  for (const token of tokenize(postingText)) counts.set(token, (counts.get(token) || 0) + 1);

  const keywords = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, Math.max(1, limit))
    .map(([word]) => word);

  const matched = keywords.filter((k) => cvTokens.has(k));
  const missing = keywords.filter((k) => !cvTokens.has(k));
  const matchPercent = keywords.length ? Math.round((matched.length / keywords.length) * 100) : 0;

  return {
    matchPercent,
    keywordCount: keywords.length,
    matched,
    missing,
    advice:
      missing.length === 0
        ? "İlandaki tüm önemli anahtar kelimeler CV'de geçiyor."
        : "Eksik kelimelerden yalnızca gerçekten sahip olduklarınızı, ilgili deneyim ya da beceri satırına doğal biçimde ekleyin.",
  };
}

export type FormatResult = { text: string; changes: string[] };

/** Cleans up CV text: bullet characters, spacing, link prefixes, duplicate blank lines. */
export function formatCvText(input: string): FormatResult {
  const changes: string[] = [];
  let text = (input || "").replace(/\r\n/g, "\n");

  const beforeBullets = text;
  text = text.replace(/^[ \t]*[*•·–—][ \t]+/gm, "- ");
  if (text !== beforeBullets) changes.push("Madde işaretleri tek biçime (\"- \") getirildi.");

  const beforeSpaces = text;
  text = text.replace(/[ \t]{2,}/g, " ").replace(/[ \t]+$/gm, "");
  if (text !== beforeSpaces) changes.push("Fazla boşluklar temizlendi.");

  const beforeBlank = text;
  text = text.replace(/\n{3,}/g, "\n\n");
  if (text !== beforeBlank) changes.push("Üst üste boş satırlar teke indirildi.");

  const beforePunct = text;
  text = text.replace(/\s+([,;.:!?])/g, "$1").replace(/([,;:])(?=\S)/g, "$1 ");
  if (text !== beforePunct) changes.push("Noktalama etrafındaki boşluklar düzeltildi.");

  const beforeLinks = text;
  text = text.replace(/(^|\s)((?:www\.|linkedin\.com|github\.com)[^\s]+)/gi, "$1https://$2");
  if (text !== beforeLinks) changes.push("Bağlantılar \"https://\" ile başlayacak şekilde düzeltildi.");

  text = text.trim();
  if (changes.length === 0) changes.push("Metin zaten düzenli; değişiklik yapılmadı.");
  return { text, changes };
}
