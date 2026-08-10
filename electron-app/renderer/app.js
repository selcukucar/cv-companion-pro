// ============= UYGULAMA DURUMU =============
const MODELS = {
  openai: [
    { id: 'gpt-4o-mini', label: 'GPT-4o mini (Önerilen · hızlı & ucuz)' },
    { id: 'gpt-4o', label: 'GPT-4o (Daha kaliteli)' },
    { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Ekonomik)' },
  ],
  gemini: [
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Önerilen)' },
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Daha kaliteli)' },
    { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  ],
};
const AI_HELP = {
  openai: 'Anahtar: platform.openai.com/api-keys — "sk-..." ile başlar',
  gemini: 'Anahtar: aistudio.google.com/app/apikey — "AIza..." ile başlar (ücretsiz kota var)',
};

const state = {
  photo: null,
  form: {
    name: '', title: '', email: '', phone: '', linkedin: '', website: '', city: '',
    birthdate: '', nationality: '', military: '', driver: '', marital: '',
    summary: '', skills: '', hobbies: '', refRequest: false,
  },
  experiences: [], educations: [], certifications: [], projects: [],
  awards: [], volunteers: [], languages: [], references: [],
  settings: { provider: 'openai', apiKey: '', model: 'gpt-4o-mini', theme: 'light', fontScale: 1 }
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const uid = () => Math.random().toString(36).slice(2, 9);
const esc = (s) => (s == null ? '' : String(s)).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const txt = (v) => (v == null ? '' : String(v));

// Ekran okuyucu duyuruları: polite (varsayılan) ve assertive (hata/uyarı) kanalları.
// İçerik önce boşaltılır, böylece aynı mesaj tekrar okunur.
function live(msg, assertive = false) {
  const region = $(assertive ? '#live-region-assertive' : '#live-region');
  if (!region) return;
  region.textContent = '';
  setTimeout(() => { region.textContent = msg; }, 30);
}

// Görsel + işitsel bildirim (alert kesintisi olmadan)
function notify(msg, kind = 'info') {
  const wrap = $('#toast-area');
  if (wrap) {
    const t = document.createElement('div');
    t.className = 'toast toast-' + kind;
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(() => t.remove(), 6000);
  }
  live(msg, kind === 'error' || kind === 'warn');
}
function fail(msg) { notify(msg, 'error'); }

// ============= BAŞLATMA =============
window.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadFromStore();
  } catch (e) {
    fail('Kayıtlı veriler okunamadı, boş formla başlatıldı. (' + e.message + ')');
  }
  applyTheme(state.settings.theme);
  applyFontScale(state.settings.fontScale);
  bindForm();
  bindButtons();
  bindMenu();
  renderAll();
  $('#f-name').focus();
  live('Öz Geçmiş Asistanı hazır. F1 kullanım kılavuzu, F2 kısayollar, F4 ekran okuyucu önizlemesi.');
});

// Sessiz çökmeleri engelle: her hata kullanıcıya duyurulur.
window.addEventListener('error', (e) => fail('Beklenmeyen hata: ' + (e.message || 'bilinmiyor')));
window.addEventListener('unhandledrejection', (e) => fail('İşlem tamamlanamadı: ' + (e.reason?.message || e.reason || 'bilinmiyor')));

function renderAll() {
  const active = document.activeElement;
  const focusKey = active && active.closest?.('.entry')
    ? { id: active.closest('.entry').dataset.id, field: active.dataset?.fieldKey || null }
    : null;
  renderExperiences(); renderEducations(); renderCertifications();
  renderProjects(); renderAwards(); renderVolunteers();
  renderLanguages(); renderReferences(); renderSkillsPreview();
  updateProgress();
  if (focusKey) restoreFocus(focusKey);
}

function restoreFocus({ id, field }) {
  const block = document.querySelector(`.entry[data-id="${id}"]`);
  if (!block) return;
  const target = (field && block.querySelector(`[data-field-key="${field}"]`)) || block;
  target.focus({ preventScroll: false });
}

// CV doluluk oranı — ekran okuyucular için de duyurulur
function completeness() {
  const f = state.form;
  const checks = [
    !!f.name?.trim(), !!f.title?.trim(), !!f.email?.trim(), !!f.phone?.trim(), !!f.city?.trim(),
    (f.summary || '').length > 60, (f.skills || '').split(',').filter(s => s.trim()).length >= 3,
    state.experiences.length > 0, state.educations.length > 0, state.languages.length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
function updateProgress() {
  const pct = completeness();
  const bar = $('#progress-bar');
  const label = $('#progress-label');
  if (bar) {
    bar.style.width = pct + '%';
    const box = $('#progress-meter');
    if (box) { box.setAttribute('aria-valuenow', String(pct)); box.setAttribute('aria-valuetext', `CV doluluk oranı yüzde ${pct}`); }
  }
  if (label) label.textContent = pct + '%';
}

async function loadFromStore() {
  const saved = await window.api.store.get('cv');
  if (saved) {
    // migrate: ensure arrays exist
    Object.assign(state, saved);
    ['experiences','educations','certifications','projects','awards','volunteers','languages','references']
      .forEach(k => { if (!Array.isArray(state[k])) state[k] = []; });
  }
  const s = await window.api.store.get('settings');
  if (s) Object.assign(state.settings, s);
}

// ============= FORM =============
const FORM_KEYS = ['name','title','email','phone','linkedin','website','city','birthdate','nationality',
  'military','driver','marital','summary','skills','hobbies'];
let formBound = false;

// Doğrulanan alanlar: hata kutusu sayfa yüklenirken bir kez oluşturulur.
// Böylece hata görünüp kaybolduğunda düzen kaymaz (kaybolan tıklama sorunu).
const VALIDATED_KEYS = ['email', 'linkedin', 'website'];

function errorBox(k, el) {
  const msgId = `err-${k}`;
  let msg = document.getElementById(msgId);
  if (!msg) {
    msg = document.createElement('small');
    msg.id = msgId;
    msg.className = 'field-error';
    msg.setAttribute('role', 'alert');
    (el.parentElement || document.body).appendChild(msg);
  }
  return msg;
}

function validateField(k, el) {
  if (!VALIDATED_KEYS.includes(k)) return true;
  let error = '';
  const v = (el.value || '').trim();
  if (v) {
    if (k === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) error = 'Geçerli bir e-posta adresi girin. Örnek: ad@ornek.com';
    if ((k === 'linkedin' || k === 'website') && !/^https?:\/\//i.test(v)) error = 'Adres "https://" ile başlamalıdır.';
  }
  const msg = errorBox(k, el);
  msg.textContent = error;
  if (error) {
    el.setAttribute('aria-invalid', 'true');
    el.setAttribute('aria-describedby', msg.id);
  } else {
    el.removeAttribute('aria-invalid');
    el.removeAttribute('aria-describedby');
  }
  return !error;
}


function syncFormInputs() {
  for (const k of FORM_KEYS) {
    const el = $(`#f-${k}`);
    if (el) el.value = state.form[k] || '';
  }
  const rr = $('#f-ref-request');
  if (rr) rr.checked = !!state.form.refRequest;
  if (state.photo) setPhoto(state.photo); else resetPhoto();
  renderSkillsPreview();
  updateProgress();
}

function bindForm() {
  if (formBound) { syncFormInputs(); return; }
  for (const k of FORM_KEYS) {
    const el = $(`#f-${k}`);
    if (!el) continue;
    el.addEventListener('input', () => {
      state.form[k] = el.value;
      if (k === 'skills') renderSkillsPreview();
      updateProgress();
      autosave();
    });
    el.addEventListener('blur', () => validateField(k, el));
    if (VALIDATED_KEYS.includes(k)) errorBox(k, el);
  }

  const rr = $('#f-ref-request');
  if (rr) rr.addEventListener('change', () => { state.form.refRequest = rr.checked; autosave(); });
  formBound = true;
  syncFormInputs();
}

function renderSkillsPreview() {
  const wrap = $('#skills-preview'); if (!wrap) return;
  wrap.innerHTML = '';
  txt(state.form.skills).split(',').map(s => s.trim()).filter(Boolean).forEach(s => {
    const c = document.createElement('span'); c.className = 'chip'; c.textContent = s;
    wrap.appendChild(c);
  });
}

function setPhoto(dataUrl) {
  state.photo = dataUrl;
  const p = $('#photo-preview'); p.innerHTML = '';
  const img = document.createElement('img');
  img.src = dataUrl; img.alt = 'Profil fotoğrafı';
  p.appendChild(img);
}
function resetPhoto() {
  state.photo = null;
  const p = $('#photo-preview');
  if (p) p.innerHTML = '<span class="photo-placeholder">Fotoğraf yok</span>';
}

// ============= DİNAMİK BLOKLAR =============
function entrySummary(arrKey, data) {
  const pick = (...keys) => keys.map(k => txt(data[k]).trim()).filter(Boolean).join(', ');
  switch (arrKey) {
    case 'experiences': return pick('position', 'company');
    case 'educations': return pick('school', 'degree');
    case 'certifications': return pick('name', 'issuer');
    case 'projects': return pick('name', 'role');
    case 'awards': return pick('title', 'issuer');
    case 'volunteers': return pick('org', 'role');
    case 'languages': return pick('name', 'level');
    case 'references': return pick('name', 'title');
    default: return '';
  }
}

function createEntry({ type, data, fields, arrKey, index, total }) {
  const el = document.createElement('div');
  el.className = 'entry'; el.tabIndex = 0; el.dataset.id = data.id;
  const summary = entrySummary(arrKey, data);
  el.setAttribute('role', 'group');
  el.setAttribute('aria-label',
    `${type} ${index + 1} / ${total}${summary ? ': ' + summary : ' (boş)'}. Silmek için Delete, taşımak için Alt ile yukarı veya aşağı ok.`);

  const header = document.createElement('div');
  header.className = 'entry-header';
  const t = document.createElement('span');
  t.className = 'entry-title';
  t.textContent = `${type} ${index + 1}${summary ? ' — ' + summary : ''}`;
  header.appendChild(t);
  const controls = document.createElement('div'); controls.className = 'entry-controls';

  const mkBtn = (label, aria, cls, fn) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'btn btn-ghost btn-sm' + (cls ? ' ' + cls : '');
    b.textContent = label; b.setAttribute('aria-label', aria);
    b.addEventListener('click', fn);
    return b;
  };

  controls.append(
    mkBtn('↑', `${type} ${index + 1}: yukarı taşı`, '', () => moveEntry(arrKey, data.id, -1)),
    mkBtn('↓', `${type} ${index + 1}: aşağı taşı`, '', () => moveEntry(arrKey, data.id, 1)),
    mkBtn('⧉', `${type} ${index + 1}: bloğu çoğalt`, '', () => duplicateEntry(arrKey, data.id)),
    mkBtn('Sil', `${type} ${index + 1}: bloğu sil`, 'btn-danger', () => deleteEntry(arrKey, data.id)),
  );
  header.appendChild(controls);
  el.appendChild(header);

  const grid = document.createElement('div'); grid.className = 'entry-grid';
  fields.forEach(f => {
    const label = document.createElement('label');
    label.className = 'field' + (f.wide ? ' field-wide' : '');
    const span = document.createElement('span'); span.textContent = f.label; label.appendChild(span);
    const input = f.textarea ? document.createElement('textarea') : document.createElement('input');
    if (!f.textarea) input.type = f.type || 'text';
    if (f.placeholder) input.placeholder = f.placeholder;
    if (f.textarea) input.rows = f.rows || 3;
    input.dataset.fieldKey = f.key;
    input.value = data[f.key] || '';
    let renameTimer;
    input.addEventListener('input', () => {
      data[f.key] = input.value;
      autosave();
      clearTimeout(renameTimer);
      renameTimer = setTimeout(() => {
        const s = entrySummary(arrKey, data);
        t.textContent = `${type} ${index + 1}${s ? ' — ' + s : ''}`;
      }, 500);
    });
    label.appendChild(input);
    grid.appendChild(label);
  });
  el.appendChild(grid);

  el.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' && e.target === el) { deleteEntry(arrKey, data.id); return; }
    if (e.altKey && e.key === 'ArrowUp') { e.preventDefault(); moveEntry(arrKey, data.id, -1); }
    if (e.altKey && e.key === 'ArrowDown') { e.preventDefault(); moveEntry(arrKey, data.id, 1); }
  });
  return el;
}

// Geri alma yığını (Ctrl+Z)
const undoStack = [];
function pushUndo(action) { undoStack.push(action); if (undoStack.length > 30) undoStack.shift(); }
function undoLast() {
  const a = undoStack.pop();
  if (!a) { notify('Geri alınacak işlem yok.', 'warn'); return; }
  a.undo();
  renderAll(); autosave();
  notify(a.label + ' geri alındı.');
}

function deleteEntry(arrKey, id) {
  const arr = state[arrKey];
  const i = arr.findIndex(e => e.id === id);
  if (i < 0) return;
  const removed = arr[i];
  arr.splice(i, 1);
  pushUndo({ label: 'Silme işlemi', undo: () => state[arrKey].splice(i, 0, removed) });
  renderAll(); autosave();
  notify('Blok silindi. Geri almak için Ctrl+Z.');
}
function duplicateEntry(arrKey, id) {
  const arr = state[arrKey];
  const i = arr.findIndex(e => e.id === id);
  if (i < 0) return;
  const copy = { ...arr[i], id: uid() };
  arr.splice(i + 1, 0, copy);
  pushUndo({ label: 'Çoğaltma', undo: () => { state[arrKey] = state[arrKey].filter(e => e.id !== copy.id); } });
  renderAll(); autosave();
  notify('Blok çoğaltıldı.');
  setTimeout(() => restoreFocus({ id: copy.id, field: null }), 60);
}
function moveEntry(arrKey, id, dir) {
  const arr = state[arrKey];
  const i = arr.findIndex(e => e.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  renderAll(); autosave();
}

const FIELDS = {
  experiences: [
    { key: 'position', label: 'Pozisyon' },
    { key: 'company', label: 'Şirket' },
    { key: 'location', label: 'Konum', placeholder: 'İstanbul, TR' },
    { key: 'startDate', label: 'Başlangıç (AA/YYYY)', placeholder: '01/2020' },
    { key: 'endDate', label: 'Bitiş', placeholder: 'Devam / 12/2023' },
    { key: 'description', label: 'Görevler & Başarılar', textarea: true, wide: true, rows: 4, placeholder: 'Her satır bir madde olur.' },
  ],
  educations: [
    { key: 'school', label: 'Okul / Kurum' },
    { key: 'degree', label: 'Bölüm / Derece' },
    { key: 'gpa', label: 'Not Ortalaması', placeholder: '3.45 / 4.00' },
    { key: 'startDate', label: 'Başlangıç' },
    { key: 'endDate', label: 'Bitiş' },
    { key: 'note', label: 'Notlar (opsiyonel)', wide: true, placeholder: 'Onur derecesi, yüksek lisans tezi, vb.' },
  ],
  certifications: [
    { key: 'name', label: 'Sertifika Adı' },
    { key: 'issuer', label: 'Veren Kurum' },
    { key: 'date', label: 'Tarih', placeholder: '2024' },
    { key: 'credential', label: 'Belge No / Link', wide: true },
  ],
  projects: [
    { key: 'name', label: 'Proje Adı' },
    { key: 'role', label: 'Rolünüz' },
    { key: 'link', label: 'Link (opsiyonel)', wide: true, placeholder: 'https://github.com/...' },
    { key: 'description', label: 'Açıklama & Teknolojiler', textarea: true, wide: true, rows: 3 },
  ],
  awards: [
    { key: 'title', label: 'Başlık' },
    { key: 'issuer', label: 'Veren / Yayınlayan' },
    { key: 'date', label: 'Tarih' },
    { key: 'description', label: 'Açıklama (opsiyonel)', wide: true },
  ],
  volunteers: [
    { key: 'org', label: 'Kurum' },
    { key: 'role', label: 'Rol' },
    { key: 'startDate', label: 'Başlangıç' },
    { key: 'endDate', label: 'Bitiş' },
    { key: 'description', label: 'Açıklama', textarea: true, wide: true, rows: 3 },
  ],
  languages: [
    { key: 'name', label: 'Dil', placeholder: 'İngilizce' },
    { key: 'level', label: 'Seviye', placeholder: 'İleri (C1)' },
  ],
  references: [
    { key: 'name', label: 'Ad Soyad' },
    { key: 'title', label: 'Ünvan & Şirket' },
    { key: 'email', label: 'E-posta' },
    { key: 'phone', label: 'Telefon' },
  ],
};

function renderList(arrKey, listId, type) {
  const list = $(listId); if (!list) return;
  list.innerHTML = '';
  const total = state[arrKey].length;
  list.setAttribute('aria-label', `${type} listesi, ${total} kayıt`);
  state[arrKey].forEach((item, index) =>
    list.appendChild(createEntry({ type, data: item, fields: FIELDS[arrKey], arrKey, index, total }))
  );
  if (!total) {
    const empty = document.createElement('p');
    empty.className = 'hint'; empty.textContent = `Henüz ${type.toLowerCase()} kaydı yok.`;
    list.appendChild(empty);
  }
}
const renderExperiences = () => renderList('experiences', '#exp-list', 'İş Deneyimi');
const renderEducations = () => renderList('educations', '#edu-list', 'Eğitim');
const renderCertifications = () => renderList('certifications', '#cert-list', 'Sertifika');
const renderProjects = () => renderList('projects', '#proj-list', 'Proje');
const renderAwards = () => renderList('awards', '#award-list', 'Ödül / Yayın');
const renderVolunteers = () => renderList('volunteers', '#vol-list', 'Gönüllülük');
const renderLanguages = () => renderList('languages', '#lang-list', 'Dil');
const renderReferences = () => renderList('references', '#ref-list', 'Referans');

// ============= OTOMATIK KAYDET =============
let saveTimer;
function autosave() {
  const ind = $('#save-indicator');
  if (ind) ind.textContent = 'Yazılıyor...';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      const { settings, ...cvData } = state;
      await window.api.store.set('cv', cvData);
      if (ind) ind.textContent = 'Kaydedildi ✓';
    } catch (e) {
      if (ind) ind.textContent = 'Kaydedilemedi!';
      fail('Otomatik kayıt başarısız: ' + e.message);
    }
  }, 400);
}

// ============= DIALOG YÖNETİMİ (odak geri dönüşü) =============
let lastFocused = null;
function openDialog(sel, focusSel) {
  const dlg = $(sel);
  if (!dlg) return;
  lastFocused = document.activeElement;
  dlg.showModal();
  const target = focusSel ? dlg.querySelector(focusSel) : dlg.querySelector('h2');
  if (target) {
    if (!target.hasAttribute('tabindex') && !/^(INPUT|SELECT|TEXTAREA|BUTTON|A)$/.test(target.tagName)) {
      target.setAttribute('tabindex', '-1');
    }
    setTimeout(() => target.focus(), 40);
  }
  dlg.addEventListener('close', () => { if (lastFocused?.focus) lastFocused.focus(); }, { once: true });
}

// ============= BUTONLAR =============
function bindButtons() {
  $('#btn-theme').addEventListener('click', toggleTheme);
  $('#btn-help').addEventListener('click', openHelp);
  $('#btn-drafts').addEventListener('click', openDrafts);
  $('#btn-ai').addEventListener('click', runAI);
  $('#btn-ai-inline').addEventListener('click', runAI);
  $('#btn-export').addEventListener('click', () => openDialog('#dlg-export'));
  $('#btn-photo').addEventListener('click', selectPhoto);
  $('#btn-photo-clear').addEventListener('click', () => {
    resetPhoto(); autosave(); notify('Fotoğraf kaldırıldı.');
  });

  const addBtn = (id, arrKey, tmpl, msg) => $(id)?.addEventListener('click', () => {
    const item = { id: uid(), ...tmpl };
    state[arrKey].push(item);
    pushUndo({ label: 'Ekleme', undo: () => { state[arrKey] = state[arrKey].filter(e => e.id !== item.id); } });
    renderAll(); autosave(); notify(msg + ' Alanlar odaklandı.');
    setTimeout(() => {
      const block = document.querySelector(`.entry[data-id="${item.id}"]`);
      block?.querySelector('input, textarea')?.focus();
    }, 60);
  });
  addBtn('#btn-add-exp', 'experiences', { position:'', company:'', location:'', startDate:'', endDate:'', description:'' }, 'İş deneyimi eklendi.');
  addBtn('#btn-add-edu', 'educations', { school:'', degree:'', gpa:'', startDate:'', endDate:'', note:'' }, 'Eğitim eklendi.');
  addBtn('#btn-add-cert', 'certifications', { name:'', issuer:'', date:'', credential:'' }, 'Sertifika eklendi.');
  addBtn('#btn-add-proj', 'projects', { name:'', role:'', link:'', description:'' }, 'Proje eklendi.');
  addBtn('#btn-add-award', 'awards', { title:'', issuer:'', date:'', description:'' }, 'Ödül/yayın eklendi.');
  addBtn('#btn-add-vol', 'volunteers', { org:'', role:'', startDate:'', endDate:'', description:'' }, 'Gönüllülük eklendi.');
  addBtn('#btn-add-lang', 'languages', { name:'', level:'' }, 'Dil eklendi.');
  addBtn('#btn-add-ref', 'references', { name:'', title:'', email:'', phone:'' }, 'Referans eklendi.');

  $('#btn-export-pdf').addEventListener('click', () => { const t = getTemplate(); $('#dlg-export').close(); exportPDF(t); });
  $('#btn-export-docx').addEventListener('click', () => { const t = getTemplate(); $('#dlg-export').close(); exportDOCX(t); });
  $('#btn-export-txt')?.addEventListener('click', () => { $('#dlg-export').close(); exportTXT(); });
  $('#btn-save-ai').addEventListener('click', saveAISettings);
  $('#btn-save-draft').addEventListener('click', saveDraft);
  $('#btn-manual-print').addEventListener('click', () => window.print());

  // AI provider change
  $('#ai-provider').addEventListener('change', updateAIProviderUI);

  $$('[data-close]').forEach(b => b.addEventListener('click', (e) => e.target.closest('dialog').close()));
}
const getTemplate = () => document.querySelector('input[name="tpl"]:checked')?.value || 'modern';

async function selectPhoto() {
  const data = await window.api.openImage();
  if (!data) return;
  if (typeof data === 'object' && data.error) { fail(data.error); return; }
  setPhoto(data); autosave(); notify('Fotoğraf yüklendi.');
}

// ============= TEMA & YAZI BOYUTU =============
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  state.settings.theme = theme;
  $('#btn-theme').textContent = theme === 'dark' ? '☀️' : theme === 'hc' ? '🌓' : '🌙';
}
function toggleTheme() {
  const order = ['light', 'dark', 'hc'];
  const next = order[(order.indexOf(state.settings.theme) + 1) % order.length];
  applyTheme(next);
  window.api.store.set('settings', state.settings);
  live(`Tema: ${next === 'light' ? 'açık' : next === 'dark' ? 'koyu' : 'yüksek kontrast'}`);
}
function applyFontScale(scale) {
  const s = Math.max(0.8, Math.min(1.5, scale || 1));
  state.settings.fontScale = s;
  document.documentElement.style.fontSize = (16 * s) + 'px';
}
function bumpFont(delta) {
  applyFontScale((state.settings.fontScale || 1) + delta);
  window.api.store.set('settings', state.settings);
  live('Yazı boyutu ' + Math.round(state.settings.fontScale * 100) + '%');
}

// ============= AI =============
function updateAIProviderUI() {
  const provider = $('#ai-provider').value;
  const modelSelect = $('#ai-model');
  modelSelect.innerHTML = '';
  MODELS[provider].forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id; opt.textContent = m.label;
    modelSelect.appendChild(opt);
  });
  if (state.settings.provider === provider && state.settings.model) {
    modelSelect.value = state.settings.model;
  }
  $('#ai-help-text').textContent = AI_HELP[provider];
}

// Ortak AI çağrısı: anahtar kontrolü, zaman aşımı ve anlaşılır hata mesajı
async function aiText(prompt, system) {
  if (!state.settings.apiKey) {
    notify('AI anahtarı ayarlanmamış. Ayarlar penceresi açılıyor.', 'warn');
    openAISettings();
    throw new Error('API anahtarı yok.');
  }
  const call = window.api.aiGenerate({
    provider: state.settings.provider,
    apiKey: state.settings.apiKey,
    model: state.settings.model,
    prompt, system,
  });
  const timeout = new Promise((_, rej) =>
    setTimeout(() => rej(new Error('AI yanıtı 60 saniyede gelmedi. Bağlantınızı veya anahtarınızı kontrol edin.')), 60000));
  const text = await Promise.race([call, timeout]);
  if (!text || !String(text).trim()) throw new Error('AI boş yanıt döndürdü, tekrar deneyin.');
  return String(text).trim();
}

async function runAI() {
  const { name, title, summary } = state.form;
  if (!name?.trim() || !title?.trim()) {
    fail('AI için en az Ad Soyad ve Mesleki Unvan gerekli.');
    $(!name?.trim() ? '#f-name' : '#f-title').focus();
    return;
  }
  const companies = state.experiences.filter(e => e.company).map(e => `${e.position || ''} @ ${e.company}`).join(', ');
  const prompt = `Bir kişi için 3-4 cümlelik profesyonel Türkçe CV özeti yaz.
Ad: ${name}
Unvan: ${title}
Deneyim: ${companies || 'Belirtilmemiş'}
Beceriler: ${state.form.skills || 'Belirtilmemiş'}
${summary ? 'Mevcut taslak: ' + summary : ''}

Sadece özet metnini döndür, başlık veya açıklama ekleme.`;

  const btn = $('#btn-ai'); btn.disabled = true; btn.setAttribute('aria-busy', 'true'); btn.textContent = '⏳ Yazılıyor...';
  live('AI özet oluşturuyor, lütfen bekleyin.');
  try {
    const text = await aiText(prompt);
    state.form.summary = text;
    $('#f-summary').value = text;
    updateProgress();
    autosave();
    notify('AI özet oluşturuldu ve Profesyonel Özet alanına yazıldı.');
    $('#f-summary').focus();
  } catch (e) {
    fail('AI hatası: ' + e.message);
  } finally {
    btn.disabled = false; btn.removeAttribute('aria-busy'); btn.textContent = '✨ AI Özet';
  }
}

function openAISettings() {
  $('#ai-provider').value = state.settings.provider || 'openai';
  updateAIProviderUI();
  $('#ai-key').value = state.settings.apiKey || '';
  if (state.settings.model) $('#ai-model').value = state.settings.model;
  openDialog('#dlg-ai', '#ai-provider');
}
async function saveAISettings() {
  state.settings.provider = $('#ai-provider').value;
  state.settings.apiKey = $('#ai-key').value.trim();
  state.settings.model = $('#ai-model').value;
  try {
    await window.api.store.set('settings', state.settings);
    $('#dlg-ai').close();
    notify('AI ayarları kaydedildi.');
  } catch (e) { fail('Ayarlar kaydedilemedi: ' + e.message); }
}

// ============= YARDIM =============
function openHelp() {
  $('#manual-content').innerHTML = window.MANUAL_HTML;
  openDialog('#dlg-help', '#manual-content');
}

// ============= TASLAKLAR =============
const ARRAY_KEYS = ['experiences','educations','certifications','projects','awards','volunteers','languages','references'];

// Gelen veriyi güvenli hale getir: eksik alanlar tamamlanır, bozuk kayıtlar atlanır.
function normalizeData(raw) {
  const data = (raw && typeof raw === 'object') ? raw : {};
  const form = { ...state.form };
  if (data.form && typeof data.form === 'object') {
    for (const k of Object.keys(form)) {
      if (k === 'refRequest') form[k] = !!data.form[k];
      else if (data.form[k] != null) form[k] = String(data.form[k]);
    }
  }
  const out = { form, photo: typeof data.photo === 'string' ? data.photo : null };
  for (const k of ARRAY_KEYS) {
    const arr = Array.isArray(data[k]) ? data[k] : [];
    out[k] = arr.filter(x => x && typeof x === 'object').map(x => {
      const item = { id: x.id || uid() };
      (FIELDS[k] || []).forEach(f => { item[f.key] = x[f.key] != null ? String(x[f.key]) : ''; });
      return item;
    });
  }
  return out;
}

function applyLoadedData(raw) {
  const clean = normalizeData(raw);
  state.form = clean.form;
  state.photo = clean.photo;
  ARRAY_KEYS.forEach(k => { state[k] = clean[k]; });
  syncFormInputs();
  renderAll();
  autosave();
}

async function openDrafts() {
  let drafts = [];
  try { drafts = (await window.api.store.get('drafts')) || []; }
  catch (e) { fail('Taslaklar okunamadı: ' + e.message); }
  const list = $('#drafts-list'); list.innerHTML = '';
  if (!drafts.length) {
    list.innerHTML = '<li style="justify-content:center;color:var(--text-muted)">Henüz taslak yok</li>';
  } else {
    drafts.forEach(d => {
      const li = document.createElement('li');
      const info = document.createElement('div');
      const n = document.createElement('span'); n.className = 'draft-name'; n.textContent = d.name;
      const dt = document.createElement('span'); dt.className = 'draft-date'; dt.textContent = new Date(d.date).toLocaleString('tr-TR');
      info.append(n, dt); li.appendChild(info);
      const btns = document.createElement('div');
      const load = document.createElement('button'); load.className = 'btn btn-secondary btn-sm'; load.textContent = 'Yükle';
      load.setAttribute('aria-label', `${d.name} taslağını yükle`);
      load.addEventListener('click', () => loadDraft(d.id));
      const del = document.createElement('button'); del.className = 'btn btn-ghost btn-sm btn-danger'; del.textContent = 'Sil';
      del.setAttribute('aria-label', `${d.name} taslağını sil`);
      del.addEventListener('click', () => deleteDraft(d.id));
      btns.append(load, del); li.appendChild(btns);
      list.appendChild(li);
    });
  }
  if (!$('#dlg-drafts').open) openDialog('#dlg-drafts', '#draft-name');
  live(`Taslak listesi, ${drafts.length} kayıt.`);
}
function currentSnapshot() {
  const { settings, ...rest } = state;
  return JSON.parse(JSON.stringify(rest));
}
async function saveDraft() {
  try {
    const name = $('#draft-name').value.trim() || `Taslak ${new Date().toLocaleDateString('tr-TR')}`;
    const drafts = (await window.api.store.get('drafts')) || [];
    drafts.push({ id: uid(), name, date: Date.now(), data: currentSnapshot() });
    await window.api.store.set('drafts', drafts);
    $('#draft-name').value = '';
    await openDrafts();
    notify(`"${name}" taslağı kaydedildi.`);
  } catch (e) { fail('Taslak kaydedilemedi: ' + e.message); }
}
async function loadDraft(id) {
  try {
    const drafts = (await window.api.store.get('drafts')) || [];
    const d = drafts.find(x => x.id === id);
    if (!d) { fail('Taslak bulunamadı.'); return; }
    applyLoadedData(d.data);
    $('#dlg-drafts').close();
    notify(`"${d.name}" taslağı yüklendi.`);
  } catch (e) { fail('Taslak yüklenemedi: ' + e.message); }
}
async function deleteDraft(id) {
  if (!confirm('Bu taslağı silmek istiyor musunuz? Bu işlem geri alınamaz.')) return;
  try {
    const drafts = ((await window.api.store.get('drafts')) || []).filter(d => d.id !== id);
    await window.api.store.set('drafts', drafts);
    await openDrafts();
    notify('Taslak silindi.');
  } catch (e) { fail('Taslak silinemedi: ' + e.message); }
}

// ============= JSON YEDEK =============
async function exportJSON() {
  try {
    const payload = { app: 'ozgecmis-asistani', version: 4.1, exportedAt: new Date().toISOString(), ...currentSnapshot() };
    const filename = `${(state.form.name || 'CV').replace(/\s+/g, '_')}_yedek.json`;
    const r = await window.api.save({
      defaultName: filename,
      filters: [{ name: 'JSON', extensions: ['json'] }],
      dataText: JSON.stringify(payload, null, 2),
    });
    if (!r) return;
    if (r.error) { fail('Kaydetme hatası: ' + r.error); return; }
    notify('JSON yedeği kaydedildi: ' + r);
  } catch (e) { fail('Yedekleme hatası: ' + e.message); }
}
async function importJSON() {
  const r = await window.api.openJson();
  if (!r) return;
  if (r.error) { fail(r.error); return; }
  if (!confirm('Mevcut CV verileri değiştirilecek. Devam edilsin mi?')) return;
  try {
    applyLoadedData(r.data);
    notify('JSON yedeği yüklendi.');
  } catch (e) { fail('Yükleme hatası: ' + e.message); }
}

// ============= DÜZ METİN (ATS / ekran okuyucu) =============
function buildPlainText() {
  const f = state.form;
  const L = [];
  const head = (t) => { L.push('', t.toUpperCase(), '='.repeat(t.length)); };
  L.push(f.name || 'İsimsiz CV');
  if (f.title) L.push(f.title);
  const contact = [f.email, f.phone, f.city, f.linkedin, f.website].filter(Boolean);
  if (contact.length) L.push(contact.join(' | '));
  const extra = [
    f.birthdate && 'Doğum: ' + f.birthdate,
    f.nationality && 'Uyruk: ' + f.nationality,
    f.military && 'Askerlik: ' + f.military,
    f.driver && 'Sürücü belgesi: ' + f.driver,
    f.marital && 'Medeni durum: ' + f.marital,
  ].filter(Boolean);
  if (extra.length) L.push(extra.join(' | '));
  if (f.summary) { head('Profesyonel Özet'); L.push(f.summary); }
  if (state.experiences.length) {
    head('İş Deneyimi');
    state.experiences.forEach(e => {
      L.push(`${e.position || ''}${e.company ? ' — ' + e.company : ''}${e.location ? ', ' + e.location : ''}`.trim());
      if (e.startDate || e.endDate) L.push(`  Tarih: ${e.startDate || '?'} - ${e.endDate || 'Devam'}`);
      txt(e.description).split('\n').map(s => s.replace(/^[-•*]\s*/, '').trim()).filter(Boolean)
        .forEach(l => L.push('  - ' + l));
    });
  }
  if (state.educations.length) {
    head('Eğitim');
    state.educations.forEach(e => {
      L.push(`${e.school || ''}${e.degree ? ' — ' + e.degree : ''}`.trim());
      const d = [e.startDate && e.startDate + ' - ' + (e.endDate || 'Devam'), e.gpa && 'Ortalama: ' + e.gpa, e.note].filter(Boolean);
      if (d.length) L.push('  ' + d.join(' | '));
    });
  }
  const simple = [
    ['Sertifikalar & Kurslar', state.certifications, c => [c.name, c.issuer, c.date, c.credential]],
    ['Projeler', state.projects, p => [p.name, p.role, p.link, p.description]],
    ['Ödüller & Yayınlar', state.awards, a => [a.title, a.issuer, a.date, a.description]],
    ['Gönüllü Çalışmalar', state.volunteers, v => [v.org, v.role, `${v.startDate || ''} - ${v.endDate || ''}`, v.description]],
    ['Diller', state.languages, l => [l.name, l.level]],
    ['Referanslar', state.references, r => [r.name, r.title, r.email, r.phone]],
  ];
  simple.forEach(([title, arr, fn]) => {
    if (!arr.length) return;
    head(title);
    arr.forEach(x => L.push('- ' + fn(x).map(v => txt(v).trim()).filter(Boolean).join(' | ')));
  });
  if (f.skills) { head('Beceriler'); L.push(f.skills.split(',').map(s => s.trim()).filter(Boolean).join(', ')); }
  if (f.hobbies) { head('İlgi Alanları'); L.push(f.hobbies.split(',').map(s => s.trim()).filter(Boolean).join(', ')); }
  if (f.refRequest) L.push('', 'Referanslar istek üzerine sunulacaktır.');
  return L.join('\n');
}

async function exportTXT() {
  try {
    const filename = `${(state.form.name || 'CV').replace(/\s+/g, '_')}.txt`;
    const r = await window.api.save({
      defaultName: filename,
      filters: [{ name: 'Metin', extensions: ['txt'] }],
      dataText: buildPlainText(),
    });
    if (!r) return;
    if (r.error) { fail('TXT kaydetme hatası: ' + r.error); return; }
    notify('Düz metin (ATS uyumlu) CV kaydedildi.');
  } catch (e) { fail('TXT hatası: ' + e.message); }
}

// ============= PDF EXPORT (Chromium printToPDF) =============
function buildResumeHtml(template) {
  const f = state.form;
  const contactBits = [
    f.email && `<a href="mailto:${esc(f.email)}">${esc(f.email)}</a>`,
    f.phone && esc(f.phone),
    f.city && esc(f.city),
  ].filter(Boolean).join(' &nbsp;•&nbsp; ');
  const links = [
    f.linkedin && `<a href="${esc(f.linkedin)}">${esc(f.linkedin)}</a>`,
    f.website && `<a href="${esc(f.website)}">${esc(f.website)}</a>`,
  ].filter(Boolean).join('<br>');

  const detailBits = [
    f.birthdate && `Doğum: ${esc(new Date(f.birthdate).toLocaleDateString('tr-TR'))}`,
    f.nationality && esc(f.nationality),
    f.military && `Askerlik: ${esc(f.military)}`,
    f.driver && `Ehliyet: ${esc(f.driver)}`,
    f.marital && esc(f.marital),
  ].filter(Boolean).join(' &nbsp;•&nbsp; ');

  const section = (title, body) => body ? `<section><h2>${esc(title)}</h2>${body}</section>` : '';

  const expHtml = state.experiences.filter(e => e.company || e.position).map(e => `
    <div class="item">
      <div class="item-head">
        <strong>${esc(e.position || '')}${e.position && e.company ? ' — ' : ''}${esc(e.company || '')}</strong>
        <span class="dates">${esc([e.startDate, e.endDate].filter(Boolean).join(' — '))}</span>
      </div>
      ${e.location ? `<div class="muted small">${esc(e.location)}</div>` : ''}
      ${e.description ? `<ul>${e.description.split('\n').filter(l=>l.trim()).map(l => `<li>${esc(l.replace(/^[-•*]\s*/, ''))}</li>`).join('')}</ul>` : ''}
    </div>`).join('');

  const eduHtml = state.educations.filter(e => e.school || e.degree).map(e => `
    <div class="item">
      <div class="item-head">
        <strong>${esc(e.school || '')}</strong>
        <span class="dates">${esc([e.startDate, e.endDate].filter(Boolean).join(' — '))}</span>
      </div>
      <div>${esc(e.degree || '')}${e.gpa ? ` — GNO: ${esc(e.gpa)}` : ''}</div>
      ${e.note ? `<div class="muted small">${esc(e.note)}</div>` : ''}
    </div>`).join('');

  const certHtml = state.certifications.filter(c => c.name).map(c => `
    <div class="item">
      <div class="item-head"><strong>${esc(c.name)}</strong><span class="dates">${esc(c.date || '')}</span></div>
      <div>${esc(c.issuer || '')}${c.credential ? ` — ${esc(c.credential)}` : ''}</div>
    </div>`).join('');

  const projHtml = state.projects.filter(p => p.name).map(p => `
    <div class="item">
      <div class="item-head"><strong>${esc(p.name)}</strong>${p.role ? `<span class="dates">${esc(p.role)}</span>` : ''}</div>
      ${p.link ? `<div class="small"><a href="${esc(p.link)}">${esc(p.link)}</a></div>` : ''}
      ${p.description ? `<div>${esc(p.description)}</div>` : ''}
    </div>`).join('');

  const awardHtml = state.awards.filter(a => a.title).map(a => `
    <div class="item">
      <div class="item-head"><strong>${esc(a.title)}</strong><span class="dates">${esc(a.date || '')}</span></div>
      <div>${esc(a.issuer || '')}</div>
      ${a.description ? `<div class="small">${esc(a.description)}</div>` : ''}
    </div>`).join('');

  const volHtml = state.volunteers.filter(v => v.org || v.role).map(v => `
    <div class="item">
      <div class="item-head"><strong>${esc(v.role || '')}${v.role && v.org ? ' — ' : ''}${esc(v.org || '')}</strong>
        <span class="dates">${esc([v.startDate, v.endDate].filter(Boolean).join(' — '))}</span></div>
      ${v.description ? `<div class="small">${esc(v.description)}</div>` : ''}
    </div>`).join('');

  const skills = f.skills.split(',').map(s => s.trim()).filter(Boolean);
  const skillsHtml = skills.length ? `<div class="chips">${skills.map(s => `<span class="chip">${esc(s)}</span>`).join('')}</div>` : '';

  const langHtml = state.languages.filter(l => l.name).map(l =>
    `<div>${esc(l.name)}${l.level ? ` — <span class="muted">${esc(l.level)}</span>` : ''}</div>`
  ).join('');

  const hobbies = (f.hobbies || '').split(',').map(s => s.trim()).filter(Boolean);
  const hobbyHtml = hobbies.length ? `<div>${hobbies.map(esc).join(' • ')}</div>` : '';

  let refHtml = '';
  if (f.refRequest) refHtml = '<div class="muted"><em>İstek üzerine sunulacaktır.</em></div>';
  else {
    refHtml = state.references.filter(r => r.name).map(r => `
      <div class="item">
        <strong>${esc(r.name)}</strong>
        ${r.title ? `<div>${esc(r.title)}</div>` : ''}
        <div class="small muted">${[r.email, r.phone].filter(Boolean).map(esc).join(' • ')}</div>
      </div>`).join('');
  }

  const styles = {
    modern: `
      body { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; color: #1a1d24; }
      .header { background: linear-gradient(135deg, #2563eb, #1e40af); color: #fff; padding: 24px 32px; margin: -16px -16px 20px; display: flex; align-items: center; gap: 20px; }
      .header img { width: 88px; height: 88px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(255,255,255,.4); }
      .header h1 { margin: 0 0 4px; font-size: 24pt; }
      .header .title { font-size: 13pt; opacity: .95; }
      h2 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 4px; font-size: 13pt; margin: 18px 0 10px; text-transform: uppercase; letter-spacing: .5px; }
      a { color: #2563eb; }
    `,
    classic: `
      body { font-family: 'Georgia', 'Times New Roman', serif; color: #111; }
      .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; display: block; }
      .header img { width: 80px; height: 80px; border-radius: 4px; object-fit: cover; float: right; margin-left: 10px; }
      .header h1 { margin: 0; font-size: 22pt; }
      .header .title { font-style: italic; font-size: 12pt; }
      h2 { border-bottom: 1px solid #000; font-size: 12pt; margin: 16px 0 8px; text-transform: uppercase; }
      a { color: #000; text-decoration: underline; }
    `,
    minimal: `
      body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #222; }
      .header { padding-bottom: 16px; margin-bottom: 20px; display: flex; align-items: center; gap: 20px; }
      .header img { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; }
      .header h1 { margin: 0; font-size: 22pt; font-weight: 300; }
      .header .title { color: #666; font-size: 12pt; }
      h2 { color: #333; font-size: 11pt; margin: 20px 0 8px; text-transform: uppercase; letter-spacing: 2px; font-weight: 500; }
      a { color: #444; }
    `,
  }[template];

  return `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><title>${esc(f.name || 'CV')}</title>
<style>
  @page { margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 16px; font-size: 10.5pt; line-height: 1.45; }
  .contact { text-align: ${template === 'classic' ? 'center' : 'left'}; margin-bottom: 6px; font-size: 10pt; }
  .details { text-align: ${template === 'classic' ? 'center' : 'left'}; margin-bottom: 14px; font-size: 9.5pt; color: #555; }
  section { margin-bottom: 10px; page-break-inside: avoid; }
  .item { margin-bottom: 10px; page-break-inside: avoid; }
  .item-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .dates { color: #666; font-size: 9.5pt; font-style: italic; white-space: nowrap; }
  .muted { color: #666; }
  .small { font-size: 9.5pt; }
  ul { margin: 4px 0 4px 20px; padding: 0; }
  li { margin-bottom: 2px; }
  .chips { display: flex; flex-wrap: wrap; gap: 5px; }
  .chip { border: 1px solid #ccc; padding: 2px 10px; border-radius: 999px; font-size: 9.5pt; background: #f7f7f9; }
  a { text-decoration: none; }
  ${styles}
</style></head><body>
  <div class="header">
    ${state.photo ? `<img src="${state.photo}" alt="">` : ''}
    <div>
      <h1>${esc(f.name || '')}</h1>
      ${f.title ? `<div class="title">${esc(f.title)}</div>` : ''}
    </div>
  </div>
  ${contactBits ? `<div class="contact">${contactBits}</div>` : ''}
  ${links ? `<div class="contact">${links}</div>` : ''}
  ${detailBits ? `<div class="details">${detailBits}</div>` : ''}

  ${section('Profesyonel Özet', f.summary?.trim() ? `<p>${esc(f.summary)}</p>` : '')}
  ${section('İş Deneyimi', expHtml)}
  ${section('Eğitim', eduHtml)}
  ${section('Sertifikalar & Kurslar', certHtml)}
  ${section('Projeler', projHtml)}
  ${section('Ödüller & Yayınlar', awardHtml)}
  ${section('Gönüllü Çalışmalar', volHtml)}
  ${section('Beceriler', skillsHtml)}
  ${section('Diller', langHtml)}
  ${section('İlgi Alanları', hobbyHtml)}
  ${section('Referanslar', refHtml)}
</body></html>`;
}

function exportGuard() {
  if (!state.form.name?.trim()) {
    fail('Dışa aktarmadan önce Ad Soyad alanını doldurun.');
    $('#f-name').focus();
    return false;
  }
  return true;
}

async function exportPDF(template) {
  if (!exportGuard()) return;
  try {
    live('PDF hazırlanıyor, lütfen bekleyin.');
    const html = buildResumeHtml(template);
    const filename = `${(state.form.name || 'CV').replace(/\s+/g, '_')}.pdf`;
    const r = await window.api.renderPdf({ html, defaultName: filename });
    if (!r) { live('PDF kaydetme iptal edildi.'); return; }
    if (r.error) { fail('PDF oluşturma hatası: ' + r.error); return; }
    notify('PDF kaydedildi: ' + r);
  } catch (e) {
    fail('PDF hatası: ' + e.message);
  }
}

// ============= DOCX EXPORT =============
async function exportDOCX(template) {
  if (!exportGuard()) return;
  if (!window.docx) { fail('Word motoru yüklenemedi. Uygulamayı yeniden başlatın.'); return; }
  try {
    live('Word belgesi hazırlanıyor, lütfen bekleyin.');
    const D = window.docx;
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ExternalHyperlink } = D;
    const color = template === 'modern' ? '2563EB' : template === 'classic' ? '000000' : '333333';

    const heading = (t) => new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: t.toUpperCase(), bold: true, color, size: 26 })],
      spacing: { before: 280, after: 140 },
      border: template !== 'minimal' ? { bottom: { color, space: 1, style: 'single', size: 6 } } : undefined,
    });
    const p = (opts) => new Paragraph(opts);
    const run = (text, o = {}) => new TextRun({ text, ...o });
    const bulletPara = (text) => new Paragraph({ text: '• ' + text, spacing: { after: 40 }, indent: { left: 200 } });

    const children = [];
    children.push(p({ children: [run(state.form.name || '', { bold: true, size: 44 })], alignment: AlignmentType.CENTER }));
    if (state.form.title) children.push(p({ children: [run(state.form.title, { size: 26, color: '555555' })], alignment: AlignmentType.CENTER, spacing: { after: 120 } }));

    const contactParts = [state.form.email, state.form.phone, state.form.city].filter(Boolean);
    if (contactParts.length) children.push(p({ children: [run(contactParts.join(' • '), { size: 20 })], alignment: AlignmentType.CENTER }));
    for (const url of [state.form.linkedin, state.form.website].filter(Boolean)) {
      children.push(p({
        children: [new ExternalHyperlink({ children: [run(url, { style: 'Hyperlink', size: 20 })], link: url })],
        alignment: AlignmentType.CENTER
      }));
    }
    const details = [
      state.form.birthdate && `Doğum: ${new Date(state.form.birthdate).toLocaleDateString('tr-TR')}`,
      state.form.nationality, state.form.military && `Askerlik: ${state.form.military}`,
      state.form.driver && `Ehliyet: ${state.form.driver}`, state.form.marital,
    ].filter(Boolean).join(' • ');
    if (details) children.push(p({ children: [run(details, { size: 18, color: '777777' })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }));

    if (state.form.summary?.trim()) {
      children.push(heading('Profesyonel Özet'));
      children.push(p({ children: [run(state.form.summary, { size: 22 })] }));
    }

    const addExp = (title, arr, fmt) => {
      const filtered = arr.filter(fmt.filter);
      if (!filtered.length) return;
      children.push(heading(title));
      filtered.forEach(item => fmt.render(item, { children, p, run, bulletPara }));
    };

    addExp('İş Deneyimi', state.experiences, {
      filter: e => e.company || e.position,
      render: (e, { children, p, run, bulletPara }) => {
        children.push(p({ children: [run(`${e.position || ''}${e.position && e.company ? ' — ' : ''}${e.company || ''}`, { bold: true, size: 24 })] }));
        const meta = [[e.startDate, e.endDate].filter(Boolean).join(' — '), e.location].filter(Boolean).join(' • ');
        if (meta) children.push(p({ children: [run(meta, { italics: true, size: 20, color: '666666' })] }));
        (e.description || '').split('\n').filter(l => l.trim()).forEach(l => children.push(bulletPara(l.replace(/^[-•*]\s*/, ''))));
        children.push(p({ children: [run('')] }));
      }
    });

    addExp('Eğitim', state.educations, {
      filter: e => e.school || e.degree,
      render: (e, { children, p, run }) => {
        children.push(p({ children: [run(e.school || '', { bold: true, size: 22 })] }));
        const parts = [e.degree, [e.startDate, e.endDate].filter(Boolean).join(' — '), e.gpa && `GNO: ${e.gpa}`].filter(Boolean).join(' • ');
        if (parts) children.push(p({ children: [run(parts, { size: 20, color: '666666' })] }));
        if (e.note) children.push(p({ children: [run(e.note, { size: 20 })] }));
      }
    });

    addExp('Sertifikalar & Kurslar', state.certifications, {
      filter: c => c.name,
      render: (c, { children, p, run }) => {
        children.push(p({ children: [
          run(c.name, { bold: true, size: 22 }),
          run(`  ${c.issuer || ''}${c.date ? ' — ' + c.date : ''}`, { size: 20, color: '666666' })
        ] }));
        if (c.credential) children.push(p({ children: [run(c.credential, { size: 18, color: '888888' })] }));
      }
    });

    addExp('Projeler', state.projects, {
      filter: p2 => p2.name,
      render: (pr, { children, p, run }) => {
        children.push(p({ children: [run(pr.name, { bold: true, size: 22 }), run(pr.role ? `  (${pr.role})` : '', { size: 20, color: '666666' })] }));
        if (pr.link) children.push(p({ children: [run(pr.link, { size: 18, color: '2563EB' })] }));
        if (pr.description) children.push(p({ children: [run(pr.description, { size: 20 })] }));
      }
    });

    addExp('Ödüller & Yayınlar', state.awards, {
      filter: a => a.title,
      render: (a, { children, p, run }) => {
        children.push(p({ children: [run(a.title, { bold: true, size: 22 }), run(`  ${a.issuer || ''}${a.date ? ' — ' + a.date : ''}`, { size: 20, color: '666666' })] }));
        if (a.description) children.push(p({ children: [run(a.description, { size: 20 })] }));
      }
    });

    addExp('Gönüllü Çalışmalar', state.volunteers, {
      filter: v => v.org || v.role,
      render: (v, { children, p, run }) => {
        children.push(p({ children: [run(`${v.role || ''}${v.role && v.org ? ' — ' : ''}${v.org || ''}`, { bold: true, size: 22 })] }));
        const dates = [v.startDate, v.endDate].filter(Boolean).join(' — ');
        if (dates) children.push(p({ children: [run(dates, { italics: true, size: 20, color: '666666' })] }));
        if (v.description) children.push(p({ children: [run(v.description, { size: 20 })] }));
      }
    });

    const skills = txt(state.form.skills).split(',').map(s => s.trim()).filter(Boolean);
    if (skills.length) { children.push(heading('Beceriler')); children.push(p({ children: [run(skills.join(' • '), { size: 22 })] })); }

    if (state.languages.filter(l => l.name).length) {
      children.push(heading('Diller'));
      state.languages.filter(l => l.name).forEach(l =>
        children.push(p({ children: [run(`${l.name}${l.level ? ' — ' + l.level : ''}`, { size: 22 })] }))
      );
    }

    const hobbies = (state.form.hobbies || '').split(',').map(s => s.trim()).filter(Boolean);
    if (hobbies.length) { children.push(heading('İlgi Alanları')); children.push(p({ children: [run(hobbies.join(' • '), { size: 22 })] })); }

    if (state.form.refRequest) {
      children.push(heading('Referanslar'));
      children.push(p({ children: [run('İstek üzerine sunulacaktır.', { italics: true, size: 22 })] }));
    } else if (state.references.filter(r => r.name).length) {
      children.push(heading('Referanslar'));
      state.references.filter(r => r.name).forEach(r => {
        children.push(p({ children: [run(r.name, { bold: true, size: 22 })] }));
        if (r.title) children.push(p({ children: [run(r.title, { size: 20 })] }));
        const c = [r.email, r.phone].filter(Boolean).join(' • ');
        if (c) children.push(p({ children: [run(c, { size: 18, color: '666666' })] }));
      });
    }

    const doc = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(doc);
    const buf = await blob.arrayBuffer();
    // Chunked base64 (large files)
    const bytes = new Uint8Array(buf);
    let b64 = '';
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      b64 += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
    }
    b64 = btoa(b64);
    const filename = `${(state.form.name || 'CV').replace(/\s+/g, '_')}.docx`;
    const r = await window.api.save({
      defaultName: filename,
      filters: [{ name: 'Word', extensions: ['docx'] }],
      dataBase64: b64
    });
    if (r?.error) { fail('DOCX kaydetme hatası: ' + r.error); return; }
    if (r) notify('Word belgesi kaydedildi: ' + r);
    else live('Word kaydetme iptal edildi.');
  } catch (e) {
    fail('DOCX oluşturma hatası: ' + e.message);
  }
}

// ============= MENÜ =============
function bindMenu() {
  window.api.onMenu('new', () => { openDrafts(); setTimeout(() => $('#draft-name').focus(), 80); });
  window.api.onMenu('drafts', openDrafts);
  window.api.onMenu('import', importPDF);
  window.api.onMenu('import-json', importJSON);
  window.api.onMenu('export-json', exportJSON);
  window.api.onMenu('save-pdf', () => openDialog('#dlg-export'));
  window.api.onMenu('save-docx', () => openDialog('#dlg-export'));
  window.api.onMenu('save-txt', exportTXT);
  window.api.onMenu('ai', runAI);
  window.api.onMenu('ai-settings', openAISettings);
  window.api.onMenu('check', runCheck);
  window.api.onMenu('autofix', autofix);
  window.api.onMenu('theme', toggleTheme);
  window.api.onMenu('font-inc', () => bumpFont(0.1));
  window.api.onMenu('font-dec', () => bumpFont(-0.1));
  window.api.onMenu('help', openHelp);
  window.api.onMenu('shortcuts', () => openDialog('#dlg-shortcuts'));
  window.api.onMenu('plain', () => window.openPlainView?.());
  window.api.onMenu('ats', () => window.openATS?.());
  window.api.onMenu('jobmatch', () => window.openJobMatch?.());
  window.api.onMenu('cover', () => window.openCover?.());
}

// ============= DENETİM =============
function runCheck() {
  const items = [];
  const f = state.form;
  if (!f.name?.trim()) items.push('❌ Ad Soyad alanı boş — dışa aktarma için zorunlu.');
  if (!f.title?.trim()) items.push('⚠️ Mesleki unvan girilmemiş.');
  if (!f.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) items.push('⚠️ Geçerli bir e-posta girin.');
  if (!f.phone?.trim()) items.push('⚠️ Telefon bilgisi eksik.');
  if (f.linkedin && !/^https?:\/\//i.test(f.linkedin)) items.push('⚠️ LinkedIn linki "https://" ile başlamalı.');
  if (f.website && !/^https?:\/\//i.test(f.website)) items.push('⚠️ Website linki "https://" ile başlamalı.');
  if (!f.linkedin?.trim()) items.push('💡 LinkedIn linki eklemek profesyonelliği artırır.');
  if (!f.summary?.trim()) items.push('💡 Profesyonel özet ekleyin (AI ile oluşturabilirsiniz).');
  else if (f.summary.length < 60) items.push('💡 Özet çok kısa; 3-4 cümle önerilir.');
  else if (f.summary.length > 800) items.push('⚠️ Özet çok uzun; 4-5 cümleye indirin.');
  if (!state.experiences.length) items.push('⚠️ Hiç iş deneyimi eklenmemiş.');
  if (!state.educations.length) items.push('⚠️ Eğitim bilgisi eklenmemiş.');
  state.experiences.forEach((e, i) => {
    if (!e.position?.trim() || !e.company?.trim()) items.push(`⚠️ İş deneyimi ${i + 1}: pozisyon veya şirket eksik.`);
    if (!txt(e.description).trim()) items.push(`💡 İş deneyimi ${i + 1}: görev/başarı maddesi yazılmamış.`);
    else if (!/\d/.test(e.description)) items.push(`💡 İş deneyimi ${i + 1}: ölçülebilir sonuç (yüzde, sayı) ekleyin.`);
  });
  state.educations.forEach((e, i) => {
    if (!e.school?.trim()) items.push(`⚠️ Eğitim ${i + 1}: okul adı eksik.`);
  });
  if (!f.skills?.trim()) items.push('💡 Beceriler bölümü boş.');
  else if (f.skills.split(',').filter(s => s.trim()).length < 3) items.push('💡 En az 3-5 beceri eklemeniz önerilir.');
  if (!state.languages.length) items.push('💡 En az bir dil ekleyin.');
  if (!state.photo) items.push('💡 Profil fotoğrafı eklemek etkiyi artırır (yurtdışı başvuruları için opsiyonel).');
  if (f.refRequest && state.references.length) items.push('⚠️ "İstek üzerine" seçili ama referans da eklenmiş — birini seçin.');
  const dupSkills = (() => {
    const arr = txt(f.skills).split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    return arr.length !== new Set(arr).size;
  })();
  if (dupSkills) items.push('⚠️ Beceriler listesinde tekrar eden kayıtlar var.');

  const pct = completeness();
  const head = `Doluluk oranı: %${pct}. ${items.length ? items.length + ' iyileştirme önerisi bulundu.' : ''}`;
  if (!items.length) items.push('✅ Harika! CV\'niz eksiksiz ve profesyonel görünüyor.');

  const list = $('#check-list'); list.innerHTML = '';
  const hdr = document.createElement('li'); hdr.textContent = head; hdr.style.fontWeight = '700';
  list.appendChild(hdr);
  items.forEach(i => { const li = document.createElement('li'); li.textContent = i; list.appendChild(li); });
  openDialog('#dlg-check', '#check-list');
  live(`${head} Liste okunmaya hazır.`);
}

// ============= OTOMATIK DÜZELT =============
function autofix() {
  const clean = (s) => txt(s).split('\n').map(l => l.trim()).filter(Boolean)
    .map(l => '• ' + l.replace(/^[-•*·]\s*/, '')).join('\n');
  const trimAll = (o, keys) => keys.forEach(k => { if (typeof o[k] === 'string') o[k] = o[k].trim().replace(/\s{2,}/g, ' '); });

  state.experiences.forEach(e => { e.description = clean(e.description); trimAll(e, ['position','company','location','startDate','endDate']); });
  state.volunteers.forEach(v => { v.description = clean(v.description); trimAll(v, ['org','role','startDate','endDate']); });
  state.projects.forEach(p => trimAll(p, ['name','role','link','description']));
  FORM_KEYS.forEach(k => { if (typeof state.form[k] === 'string' && k !== 'summary') state.form[k] = state.form[k].trim(); });
  // Beceri ve hobilerdeki tekrar/boşlukları temizle
  const uniqList = (s) => [...new Set(txt(s).split(',').map(x => x.trim()).filter(Boolean))].join(', ');
  state.form.skills = uniqList(state.form.skills);
  state.form.hobbies = uniqList(state.form.hobbies);
  // Eksik https:// ekle
  ['linkedin','website'].forEach(k => {
    const v = txt(state.form[k]).trim();
    if (v && !/^https?:\/\//i.test(v)) state.form[k] = 'https://' + v.replace(/^\/+/, '');
  });

  syncFormInputs(); renderAll(); autosave();
  notify('Metinler düzenlendi: maddeler işaretlendi, tekrarlar ve fazla boşluklar temizlendi, linkler düzeltildi.');
}

// ============= PDF İÇE AKTAR =============
async function importPDF() {
  let result;
  try { result = await window.api.extractPdfText(); }
  catch (e) { fail('PDF okunamadı: ' + e.message); return; }
  if (!result) return;
  if (result.error) { fail('PDF okuma hatası: ' + result.error); return; }
  const text = txt(result.text);
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (!lines.length) {
    fail('PDF\'de metin bulunamadı. Dosya taranmış bir görsel olabilir; bu durumda bilgileri elle girmeniz gerekir.');
    return;
  }
  const found = [];
  const set = (k, v) => { if (v && !txt(state.form[k]).trim()) { state.form[k] = v; found.push(k); } };

  set('name', lines[0]);
  if (lines[1] && lines[1].length < 80 && !/@|\d{4}/.test(lines[1])) set('title', lines[1]);
  set('email', text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0]);
  set('phone', text.match(/(\+?\d[\d\s\-()]{8,})/)?.[0]?.trim());
  set('linkedin', text.match(/https?:\/\/(?:www\.)?linkedin\.com\/[^\s]+/i)?.[0]);
  set('website', text.match(/https?:\/\/(?:www\.)?github\.com\/[^\s]+/i)?.[0]);

  // Beceriler bölümünü yakala
  const skillsBlock = text.match(/(?:BECER[İI]LER|YETK[İI]NL[İI]KLER|SKILLS)\s*:?\s*\n([\s\S]{0,400}?)(?:\n\s*\n|$)/i);
  if (skillsBlock && !txt(state.form.skills).trim()) {
    const parsed = skillsBlock[1].split(/[,•\n·|]/).map(s => s.trim()).filter(s => s.length > 1 && s.length < 40);
    if (parsed.length) { state.form.skills = [...new Set(parsed)].join(', '); found.push('skills'); }
  }
  // Özet bölümünü yakala
  const sumBlock = text.match(/(?:ÖZET|HAKKIMDA|PROF[İI]L|SUMMARY)\s*:?\s*\n([\s\S]{40,700}?)(?:\n\s*\n|$)/i);
  if (sumBlock && !txt(state.form.summary).trim()) {
    state.form.summary = sumBlock[1].replace(/\s*\n\s*/g, ' ').trim();
    found.push('summary');
  }

  syncFormInputs(); autosave();
  notify(found.length
    ? `PDF'den ${found.length} alan dolduruldu. Kalan bölümleri elle tamamlayın.`
    : 'PDF okundu ancak dolu alanlar korunduğu için değişiklik yapılmadı.');
}

// ============= GLOBAL KISAYOLLAR =============
window.addEventListener('keydown', (e) => {
  const key = e.key;
  if ((e.ctrlKey || e.metaKey) && key.toLowerCase() === 'z' && !/^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName)) {
    e.preventDefault(); undoLast(); return;
  }
  if (key === 'F3') { e.preventDefault(); openDialog('#dlg-sections', 'button'); return; }
  if (key === 'F4') { e.preventDefault(); window.openPlainView?.(); return; }
  if (key === 'F8') { e.preventDefault(); window.openATS?.(); return; }
  if (key === 'F9') { e.preventDefault(); window.openJobMatch?.(); return; }
  if (key === 'F10') { e.preventDefault(); window.openCover?.(); return; }
  if (key === 'F1') { e.preventDefault(); openHelp(); return; }
  if (key === 'F2') { e.preventDefault(); openDialog('#dlg-shortcuts'); return; }
  if (key === 'F7') { e.preventDefault(); runCheck(); }
});
