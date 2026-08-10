// ============================================================
// Öz Geçmiş Asistanı — Ek Özellikler (v4.1)
// app.js'ten sonra yüklenir; state, $, live, notify, fail, aiText,
// buildPlainText, openDialog gibi global yardımcıları kullanır.
// ============================================================

// ---------- Bölüm Gezgini (F3) ----------
const SECTIONS = [
  ['Kişisel Bilgiler', '#s-personal', '#f-name'],
  ['Profesyonel Özet', '#s-summary', '#f-summary'],
  ['İş Deneyimi', '#s-exp', '#btn-add-exp'],
  ['Eğitim', '#s-edu', '#btn-add-edu'],
  ['Sertifikalar', '#s-cert', '#btn-add-cert'],
  ['Projeler', '#s-proj', '#btn-add-proj'],
  ['Ödüller & Yayınlar', '#s-award', '#btn-add-award'],
  ['Gönüllü Çalışmalar', '#s-vol', '#btn-add-vol'],
  ['Beceriler', '#s-skills', '#f-skills'],
  ['Diller', '#s-langs', '#btn-add-lang'],
  ['İlgi Alanları', '#s-hobby', '#f-hobbies'],
  ['Referanslar', '#s-ref', '#btn-add-ref'],
];

function buildSectionNav() {
  const wrap = $('#sections-list');
  if (!wrap) return;
  wrap.innerHTML = '';
  SECTIONS.forEach(([label, headingSel, focusSel], i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-secondary';
    b.textContent = `${i + 1}. ${label}`;
    b.setAttribute('aria-label', `${label} bölümüne git (Alt+${i + 1 <= 9 ? i + 1 : '...'})`);
    b.addEventListener('click', () => { $('#dlg-sections').close(); gotoSection(i); });
    wrap.appendChild(b);
  });
}

function gotoSection(i) {
  const s = SECTIONS[i];
  if (!s) return;
  const [label, headingSel, focusSel] = s;
  const heading = $(headingSel);
  heading?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  const target = $(focusSel) || heading;
  if (target) {
    if (!/^(INPUT|SELECT|TEXTAREA|BUTTON|A)$/.test(target.tagName)) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }
  live(`${label} bölümü. ${SECTIONS.length} bölümden ${i + 1}.`);
}

// Alt+1..9 ile hızlı bölüm geçişi
window.addEventListener('keydown', (e) => {
  if (!e.altKey || e.ctrlKey || e.metaKey) return;
  const n = parseInt(e.key, 10);
  if (n >= 1 && n <= 9) { e.preventDefault(); gotoSection(n - 1); }
});

// ---------- Ekran Okuyucu Önizlemesi (F4) ----------
window.openPlainView = function openPlainView() {
  const box = $('#plain-content');
  if (!box) return;
  const text = buildPlainText();
  box.textContent = text;
  const words = text.split(/\s+/).filter(Boolean).length;
  const chars = text.length;
  const pages = Math.max(1, Math.ceil(words / 450));
  $('#plain-stats').textContent =
    `${words} kelime · ${chars} karakter · yaklaşık ${pages} sayfa · doluluk %${completeness()}`;
  openDialog('#dlg-plain', '#plain-content');
  live(`CV önizlemesi açıldı. ${words} kelime, yaklaşık ${pages} sayfa. Okumak için ok tuşlarını kullanın.`);
};

function bindPlainActions() {
  $('#btn-plain-copy')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(buildPlainText());
      notify('CV metni panoya kopyalandı.');
    } catch (e) { fail('Panoya kopyalanamadı: ' + e.message); }
  });
  $('#btn-plain-txt')?.addEventListener('click', () => { $('#dlg-plain').close(); exportTXT(); });
}

// ---------- ATS Puanı (F8) ----------
const ACTION_VERBS = ['yönet', 'geliştir', 'tasarla', 'kur', 'artır', 'azalt', 'iyileştir', 'liderlik',
  'koordine', 'analiz', 'uygula', 'eğit', 'otomat', 'optimiz', 'başlat', 'sonuçland', 'sun', 'raporla'];

function atsReport() {
  const f = state.form;
  const items = [];
  let score = 0;
  const add = (ok, pts, okMsg, badMsg) => {
    if (ok) { score += pts; items.push('✅ ' + okMsg + ` (+${pts})`); }
    else items.push('❌ ' + badMsg + ` (0/${pts})`);
  };

  add(!!f.name?.trim() && !!f.title?.trim(), 10, 'Ad ve unvan net şekilde girilmiş.', 'Ad Soyad ve mesleki unvan eksik.');
  add(!!f.email?.trim() && !!f.phone?.trim(), 10, 'İletişim bilgileri tam.', 'E-posta ve telefon bilgisi tamamlanmalı.');
  add((f.summary || '').length >= 120, 10, 'Anahtar kelime içeren bir özet var.', 'Özet 120 karakterden kısa; ATS anahtar kelime için özeti genişletin.');
  const skillCount = (f.skills || '').split(',').filter(s => s.trim()).length;
  add(skillCount >= 6, 15, `${skillCount} beceri listelenmiş.`, `Sadece ${skillCount} beceri var; 6-12 arası önerilir.`);
  add(state.experiences.length >= 1, 15, 'İş deneyimi bölümü dolu.', 'İş deneyimi eklenmemiş.');
  const dated = state.experiences.filter(e => e.startDate && e.endDate).length;
  add(state.experiences.length > 0 && dated === state.experiences.length, 10,
    'Tüm deneyimlerde tarih aralığı var.', 'Bazı deneyimlerde başlangıç/bitiş tarihi eksik (ATS tarihleri arar).');
  const measurable = state.experiences.filter(e => /\d/.test(e.description || '')).length;
  add(state.experiences.length > 0 && measurable >= Math.ceil(state.experiences.length / 2), 10,
    'Başarılar sayısal sonuçlarla desteklenmiş.', 'Görev açıklamalarına ölçülebilir sonuç (%, adet, süre) ekleyin.');
  const allDesc = state.experiences.map(e => (e.description || '').toLowerCase()).join(' ');
  const verbHits = ACTION_VERBS.filter(v => allDesc.includes(v)).length;
  add(verbHits >= 3, 10, `Etkili eylem fiilleri kullanılmış (${verbHits} tür).`, 'Maddelere "geliştirdim, yönettim, artırdım" gibi eylem fiilleri ekleyin.');
  add(state.educations.length >= 1, 5, 'Eğitim bilgisi girilmiş.', 'Eğitim bölümü boş.');
  add(state.languages.length >= 1, 5, 'Dil bilgisi belirtilmiş.', 'En az bir yabancı dil ekleyin.');

  const words = buildPlainText().split(/\s+/).filter(Boolean).length;
  if (words > 1200) items.push('⚠️ CV çok uzun (' + words + ' kelime). 1-2 sayfa hedefleyin.');
  if (words < 180) items.push('⚠️ CV çok kısa (' + words + ' kelime). Daha fazla detay ekleyin.');

  return { score, items, words };
}

window.openATS = function openATS() {
  const { score, items } = atsReport();
  const grade = score >= 85 ? 'Mükemmel' : score >= 70 ? 'İyi' : score >= 50 ? 'Geliştirilebilir' : 'Zayıf';
  $('#ats-score').textContent = `${score} / 100 — ${grade}`;
  const box = $('#ats-meter');
  if (box) {
    box.setAttribute('aria-valuenow', String(score));
    box.setAttribute('aria-valuetext', `ATS uyum puanı ${score} / 100, ${grade}`);
    $('#ats-bar').style.width = score + '%';
  }
  const list = $('#ats-list'); list.innerHTML = '';
  items.forEach(i => { const li = document.createElement('li'); li.textContent = i; list.appendChild(li); });
  openDialog('#dlg-ats', '#ats-score');
  live(`ATS uyum puanı ${score} bölü 100, ${grade}. ${items.length} madde listelendi.`);
};

// ---------- İş İlanı Eşleştirme (F9) ----------
const STOPWORDS = new Set(['ve','ile','için','olan','olarak','bir','bu','da','de','en','veya','gibi','the','and','for','with','you','your','our','are','will','have','that','from','job','iş','ilan','ilanı','tercihen','arıyoruz','aradığımız','aranır','aranan','aramaktayız','aday','adaylar','adayların','deneyim','deneyimi','deneyime','sahip','bilgi','bilgisi','bilgisine','bilgisiyle','tecrübe','tecrübeli','çalışma','çalışacak','yetkinlik','yetkinlikler','olmalı','olması','olmak','gerekli','gereklidir','ayrıca','tüm','her','çok','daha','beklentiler','nitelikler','sorumluluklar','pozisyon','pozisyonu','şirket','şirketimiz','ekip','ekibimiz','ekibine','katılacak','tarafından','konusunda','üzerinde','hakkında','ability','skills','experience','years','team','work','working','role','plus','strong','good']);

// Türkçe eklerin ayıklanması için kaba bir kök bulucu: "typescript'e" → "typescript"
function stripSuffix(w) {
  return w.replace(/(lerimiz|larımız|lerinde|larında|lerine|larına|leri|ları|lerde|larda|lere|lara|lerin|ların|imiz|ımız|iniz|ınız|siz|sız|de|da|te|ta|den|dan|ten|tan|ye|ya|le|la|nin|nın|nun|nün|in|ın|un|ün|si|sı|i|ı|e|a)$/u, '');
}

function tokenize(text) {
  const out = [];
  (text || '').toLowerCase()
    .replace(/[’']/g, ' ')
    .replace(/[^\p{L}\p{N}+#.\s]/gu, ' ')
    .split(/\s+/)
    .forEach(raw => {
      const w = raw.replace(/^\.+|\.+$/g, '');
      if (w.length < 3 || STOPWORDS.has(w)) return;
      // ".net", "c#", "c++" gibi teknik terimler olduğu gibi kalır
      const keep = /[+#.]/.test(w) ? w : (stripSuffix(w).length >= 3 ? stripSuffix(w) : w);
      if (!STOPWORDS.has(keep)) out.push(keep);
    });
  return out;
}


function runJobMatch() {
  const posting = $('#job-text').value.trim();
  if (posting.length < 40) { fail('Analiz için iş ilanı metnini yapıştırın (en az 40 karakter).'); $('#job-text').focus(); return; }
  const cvTokens = new Set(tokenize(buildPlainText()));
  const counts = new Map();
  tokenize(posting).forEach(w => counts.set(w, (counts.get(w) || 0) + 1));
  const keywords = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40).map(([w]) => w);
  const matched = keywords.filter(w => cvTokens.has(w));
  const missing = keywords.filter(w => !cvTokens.has(w));
  const pct = keywords.length ? Math.round((matched.length / keywords.length) * 100) : 0;

  $('#job-score').textContent = `Eşleşme: %${pct} (${matched.length}/${keywords.length} anahtar kelime)`;
  const render = (sel, arr, empty) => {
    const box = $(sel); box.innerHTML = '';
    if (!arr.length) { box.textContent = empty; return; }
    arr.forEach(w => { const c = document.createElement('span'); c.className = 'chip'; c.textContent = w; box.appendChild(c); });
  };
  render('#job-matched', matched, 'Eşleşen anahtar kelime yok.');
  render('#job-missing', missing, 'Eksik anahtar kelime yok, harika!');
  $('#job-missing-text').textContent = missing.length
    ? `Eksik kelimeler: ${missing.join(', ')}.`
    : 'Eksik anahtar kelime bulunmuyor.';
  live(`İş ilanı eşleşmesi yüzde ${pct}. ${missing.length} eksik anahtar kelime var.`);
  notify(`Eşleşme oranı %${pct}.`);
}

window.openJobMatch = function openJobMatch() {
  openDialog('#dlg-jobmatch', '#job-text');
};

async function tailorSummaryToJob() {
  const posting = $('#job-text').value.trim();
  if (posting.length < 40) { fail('Önce iş ilanı metnini yapıştırın.'); return; }
  const btn = $('#btn-job-ai');
  btn.disabled = true; btn.setAttribute('aria-busy', 'true');
  live('AI, özetinizi iş ilanına göre uyarlıyor.');
  try {
    const text = await aiText(
`Aşağıdaki iş ilanına göre adayın CV özetini yeniden yaz. İlandaki anahtar kelimeleri doğal biçimde kullan, abartma, uydurma bilgi ekleme. 3-4 cümle, Türkçe.

İŞ İLANI:
${posting.slice(0, 4000)}

ADAYIN MEVCUT CV BİLGİLERİ:
${buildPlainText().slice(0, 4000)}

Sadece yeni özet metnini döndür.`);
    state.form.summary = text;
    $('#f-summary').value = text;
    autosave(); updateProgress();
    notify('Özet iş ilanına göre güncellendi.');
  } catch (e) {
    fail('AI hatası: ' + e.message);
  } finally {
    btn.disabled = false; btn.removeAttribute('aria-busy');
  }
}

// ---------- Ön Yazı / Niyet Mektubu (F10) ----------
window.openCover = function openCover() {
  openDialog('#dlg-cover', '#cover-company');
};

async function generateCover() {
  const company = $('#cover-company').value.trim();
  const position = $('#cover-position').value.trim();
  const notes = $('#cover-notes').value.trim();
  if (!company || !position) { fail('Şirket adı ve pozisyon zorunludur.'); $(company ? '#cover-position' : '#cover-company').focus(); return; }
  const btn = $('#btn-cover-generate');
  btn.disabled = true; btn.setAttribute('aria-busy', 'true');
  live('Ön yazı oluşturuluyor, lütfen bekleyin.');
  try {
    const text = await aiText(
`Aşağıdaki bilgilerle Türkçe, profesyonel bir ön yazı (niyet mektubu) yaz.
Şirket: ${company}
Pozisyon: ${position}
Ek notlar: ${notes || 'yok'}

ADAYIN CV BİLGİLERİ:
${buildPlainText().slice(0, 4000)}

Kurallar: 250-350 kelime, samimi ama profesyonel ton, uydurma bilgi yok, "Sayın İnsan Kaynakları Yetkilisi" ile başla, imza satırıyla bitir. Sadece mektup metnini döndür.`,
      'Sen Türkçe profesyonel ön yazı (cover letter) yazarısın. Kısa, etkili, işveren odaklı yazarsın.');
    $('#cover-output').value = text;
    notify('Ön yazı oluşturuldu.');
    $('#cover-output').focus();
  } catch (e) {
    fail('AI hatası: ' + e.message);
  } finally {
    btn.disabled = false; btn.removeAttribute('aria-busy');
  }
}

async function saveCover() {
  const text = $('#cover-output').value.trim();
  if (!text) { fail('Kaydedilecek ön yazı metni yok.'); return; }
  const company = ($('#cover-company').value.trim() || 'onyazi').replace(/\s+/g, '_');
  try {
    const r = await window.api.save({
      defaultName: `On_Yazi_${company}.txt`,
      filters: [{ name: 'Metin', extensions: ['txt'] }],
      dataText: text,
    });
    if (!r) return;
    if (r.error) { fail('Kaydetme hatası: ' + r.error); return; }
    notify('Ön yazı kaydedildi: ' + r);
  } catch (e) { fail('Kaydetme hatası: ' + e.message); }
}

// ---------- Bağlamalar ----------
window.addEventListener('DOMContentLoaded', () => {
  buildSectionNav();
  bindPlainActions();
  $('#btn-plain')?.addEventListener('click', () => window.openPlainView());
  $('#btn-ats')?.addEventListener('click', () => window.openATS());
  $('#btn-jobmatch')?.addEventListener('click', () => window.openJobMatch());
  $('#btn-cover')?.addEventListener('click', () => window.openCover());
  $('#btn-job-run')?.addEventListener('click', runJobMatch);
  $('#btn-job-ai')?.addEventListener('click', tailorSummaryToJob);
  $('#btn-cover-generate')?.addEventListener('click', generateCover);
  $('#btn-cover-save')?.addEventListener('click', saveCover);
  $('#btn-cover-copy')?.addEventListener('click', async () => {
    const t = $('#cover-output').value.trim();
    if (!t) { fail('Kopyalanacak metin yok.'); return; }
    try { await navigator.clipboard.writeText(t); notify('Ön yazı panoya kopyalandı.'); }
    catch (e) { fail('Panoya kopyalanamadı: ' + e.message); }
  });
});
