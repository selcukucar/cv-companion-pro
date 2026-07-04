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
const live = (msg) => { $('#live-region').textContent = msg; };
const uid = () => Math.random().toString(36).slice(2, 9);
const esc = (s) => (s == null ? '' : String(s)).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ============= BAŞLATMA =============
window.addEventListener('DOMContentLoaded', async () => {
  await loadFromStore();
  applyTheme(state.settings.theme);
  applyFontScale(state.settings.fontScale);
  bindForm();
  bindButtons();
  bindMenu();
  renderAll();
  $('#f-name').focus();
  live('Uygulama hazır. F1 tuşu ile kullanım kılavuzunu açabilirsiniz.');
});

function renderAll() {
  renderExperiences(); renderEducations(); renderCertifications();
  renderProjects(); renderAwards(); renderVolunteers();
  renderLanguages(); renderReferences(); renderSkillsPreview();
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
function bindForm() {
  const map = ['name','title','email','phone','linkedin','website','city','birthdate','nationality',
    'military','driver','marital','summary','skills','hobbies'];
  for (const k of map) {
    const el = $(`#f-${k}`);
    if (!el) continue;
    el.value = state.form[k] || '';
    el.addEventListener('input', () => {
      state.form[k] = el.value;
      if (k === 'skills') renderSkillsPreview();
      autosave();
    });
  }
  const rr = $('#f-ref-request');
  rr.checked = !!state.form.refRequest;
  rr.addEventListener('change', () => { state.form.refRequest = rr.checked; autosave(); });
  if (state.photo) setPhoto(state.photo);
}

function renderSkillsPreview() {
  const wrap = $('#skills-preview'); wrap.innerHTML = '';
  state.form.skills.split(',').map(s => s.trim()).filter(Boolean).forEach(s => {
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

// ============= DİNAMİK BLOKLAR =============
function createEntry({ type, data, fields, arrKey }) {
  const el = document.createElement('div');
  el.className = 'entry'; el.tabIndex = 0; el.dataset.id = data.id;
  el.setAttribute('role', 'group'); el.setAttribute('aria-label', `${type} bloğu`);

  const header = document.createElement('div');
  header.className = 'entry-header';
  header.innerHTML = `<span class="entry-title">${esc(type)}</span>`;
  const controls = document.createElement('div'); controls.className = 'entry-controls';

  const up = document.createElement('button');
  up.type = 'button'; up.className = 'btn btn-ghost btn-sm'; up.textContent = '↑';
  up.setAttribute('aria-label', 'Yukarı taşı');
  up.addEventListener('click', () => moveEntry(arrKey, data.id, -1));
  const down = document.createElement('button');
  down.type = 'button'; down.className = 'btn btn-ghost btn-sm'; down.textContent = '↓';
  down.setAttribute('aria-label', 'Aşağı taşı');
  down.addEventListener('click', () => moveEntry(arrKey, data.id, 1));
  const del = document.createElement('button');
  del.type = 'button'; del.className = 'btn btn-ghost btn-sm btn-danger'; del.textContent = 'Sil';
  del.setAttribute('aria-label', `${type} bloğunu sil`);
  del.addEventListener('click', () => { if (confirm('Bu bloğu silmek istiyor musunuz?')) deleteEntry(arrKey, data.id); });
  controls.append(up, down, del);
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
    input.value = data[f.key] || '';
    input.addEventListener('input', () => { data[f.key] = input.value; autosave(); });
    label.appendChild(input);
    grid.appendChild(label);
  });
  el.appendChild(grid);

  el.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' && e.target === el) {
      if (confirm('Bu bloğu silmek istiyor musunuz?')) deleteEntry(arrKey, data.id);
    }
  });
  return el;
}

function deleteEntry(arrKey, id) {
  state[arrKey] = state[arrKey].filter(e => e.id !== id);
  renderAll(); autosave(); live('Blok silindi.');
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
  const list = $(listId); list.innerHTML = '';
  state[arrKey].forEach(item =>
    list.appendChild(createEntry({ type, data: item, fields: FIELDS[arrKey], arrKey }))
  );
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
  $('#save-indicator').textContent = 'Yazılıyor...';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const { settings, ...cvData } = state;
    await window.api.store.set('cv', cvData);
    $('#save-indicator').textContent = 'Kaydedildi ✓';
  }, 400);
}

// ============= BUTONLAR =============
function bindButtons() {
  $('#btn-theme').addEventListener('click', toggleTheme);
  $('#btn-help').addEventListener('click', openHelp);
  $('#btn-drafts').addEventListener('click', openDrafts);
  $('#btn-ai').addEventListener('click', runAI);
  $('#btn-ai-inline').addEventListener('click', runAI);
  $('#btn-export').addEventListener('click', () => $('#dlg-export').showModal());
  $('#btn-photo').addEventListener('click', selectPhoto);
  $('#btn-photo-clear').addEventListener('click', () => {
    state.photo = null;
    $('#photo-preview').innerHTML = '<span class="photo-placeholder">Fotoğraf yok</span>';
    autosave();
  });

  const addBtn = (id, arrKey, tmpl, msg) => $(id).addEventListener('click', () => {
    state[arrKey].push({ id: uid(), ...tmpl });
    renderAll(); autosave(); live(msg);
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
  $('#btn-save-ai').addEventListener('click', saveAISettings);
  $('#btn-save-draft').addEventListener('click', saveDraft);
  $('#btn-manual-print').addEventListener('click', () => window.print());

  // AI provider change
  $('#ai-provider').addEventListener('change', updateAIProviderUI);

  $$('[data-close]').forEach(b => b.addEventListener('click', (e) => e.target.closest('dialog').close()));
}
const getTemplate = () => document.querySelector('input[name="tpl"]:checked').value;

async function selectPhoto() {
  const data = await window.api.openImage();
  if (!data) return;
  if (typeof data === 'object' && data.error) { alert(data.error); return; }
  setPhoto(data); autosave(); live('Fotoğraf yüklendi.');
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

async function runAI() {
  if (!state.settings.apiKey) {
    if (confirm('AI anahtarı ayarlanmamış. Şimdi ayarlamak ister misiniz?')) openAISettings();
    return;
  }
  const { name, title, summary } = state.form;
  if (!name || !title) { alert('AI için en az Ad Soyad ve Mesleki Unvan gerekli.'); return; }
  const companies = state.experiences.filter(e => e.company).map(e => `${e.position || ''} @ ${e.company}`).join(', ');
  const skills = state.form.skills;
  const prompt = `Bir kişi için 3-4 cümlelik profesyonel Türkçe CV özeti yaz.
Ad: ${name}
Unvan: ${title}
Deneyim: ${companies || 'Belirtilmemiş'}
Beceriler: ${skills || 'Belirtilmemiş'}
${summary ? 'Mevcut taslak: ' + summary : ''}

Sadece özet metnini döndür, başlık veya açıklama ekleme.`;

  const btn = $('#btn-ai'); btn.disabled = true; btn.textContent = '⏳ Yazılıyor...';
  live('AI özet oluşturuyor...');
  try {
    const text = await window.api.aiGenerate({
      provider: state.settings.provider,
      apiKey: state.settings.apiKey,
      model: state.settings.model,
      prompt
    });
    state.form.summary = text.trim();
    $('#f-summary').value = state.form.summary;
    autosave();
    live('AI özet oluşturuldu.');
  } catch (e) {
    alert('AI hatası: ' + e.message);
    live('AI hatası oluştu.');
  } finally {
    btn.disabled = false; btn.textContent = '✨ AI Özet';
  }
}

function openAISettings() {
  $('#ai-provider').value = state.settings.provider || 'openai';
  updateAIProviderUI();
  $('#ai-key').value = state.settings.apiKey || '';
  if (state.settings.model) $('#ai-model').value = state.settings.model;
  $('#dlg-ai').showModal();
}
async function saveAISettings() {
  state.settings.provider = $('#ai-provider').value;
  state.settings.apiKey = $('#ai-key').value.trim();
  state.settings.model = $('#ai-model').value;
  await window.api.store.set('settings', state.settings);
  $('#dlg-ai').close();
  live('AI ayarları kaydedildi.');
}

// ============= YARDIM =============
function openHelp() {
  $('#manual-content').innerHTML = window.MANUAL_HTML;
  $('#dlg-help').showModal();
  setTimeout(() => $('#manual-content').focus(), 50);
}

// ============= TASLAKLAR =============
async function openDrafts() {
  const drafts = (await window.api.store.get('drafts')) || [];
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
      load.addEventListener('click', () => loadDraft(d.id));
      const del = document.createElement('button'); del.className = 'btn btn-ghost btn-sm btn-danger'; del.textContent = 'Sil';
      del.addEventListener('click', () => deleteDraft(d.id));
      btns.append(load, del); li.appendChild(btns);
      list.appendChild(li);
    });
  }
  $('#dlg-drafts').showModal();
}
function currentSnapshot() {
  const { settings, ...rest } = state;
  return JSON.parse(JSON.stringify(rest));
}
async function saveDraft() {
  const name = $('#draft-name').value.trim() || `Taslak ${new Date().toLocaleDateString('tr-TR')}`;
  const drafts = (await window.api.store.get('drafts')) || [];
  drafts.push({ id: uid(), name, date: Date.now(), data: currentSnapshot() });
  await window.api.store.set('drafts', drafts);
  $('#draft-name').value = '';
  openDrafts();
  live('Taslak kaydedildi.');
}
async function loadDraft(id) {
  const drafts = (await window.api.store.get('drafts')) || [];
  const d = drafts.find(x => x.id === id);
  if (!d) return;
  Object.assign(state, d.data);
  ['experiences','educations','certifications','projects','awards','volunteers','languages','references']
    .forEach(k => { if (!Array.isArray(state[k])) state[k] = []; });
  bindForm(); renderAll();
  if (state.photo) setPhoto(state.photo); else $('#photo-preview').innerHTML = '<span class="photo-placeholder">Fotoğraf yok</span>';
  $('#dlg-drafts').close();
  autosave();
  live(`"${d.name}" taslağı yüklendi.`);
}
async function deleteDraft(id) {
  if (!confirm('Bu taslağı silmek istiyor musunuz?')) return;
  const drafts = ((await window.api.store.get('drafts')) || []).filter(d => d.id !== id);
  await window.api.store.set('drafts', drafts);
  openDrafts();
}

// ============= JSON YEDEK =============
async function exportJSON() {
  const data = JSON.stringify(currentSnapshot(), null, 2);
  const filename = `${(state.form.name || 'CV').replace(/\s+/g, '_')}_yedek.json`;
  const r = await window.api.save({
    defaultName: filename,
    filters: [{ name: 'JSON', extensions: ['json'] }],
    dataText: data
  });
  if (r && !r.error) live('JSON yedeği kaydedildi.');
  else if (r?.error) alert('Kaydetme hatası: ' + r.error);
}
async function importJSON() {
  const r = await window.api.openJson();
  if (!r) return;
  if (r.error) { alert(r.error); return; }
  if (!confirm('Mevcut CV verileri değiştirilecek. Devam edilsin mi?')) return;
  try {
    Object.assign(state, r.data);
    ['experiences','educations','certifications','projects','awards','volunteers','languages','references']
      .forEach(k => { if (!Array.isArray(state[k])) state[k] = []; });
    bindForm(); renderAll();
    if (state.photo) setPhoto(state.photo); else $('#photo-preview').innerHTML = '<span class="photo-placeholder">Fotoğraf yok</span>';
    autosave();
    live('JSON yedeği yüklendi.');
  } catch (e) { alert('Yükleme hatası: ' + e.message); }
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

async function exportPDF(template) {
  try {
    const html = buildResumeHtml(template);
    const filename = `${(state.form.name || 'CV').replace(/\s+/g, '_')}.pdf`;
    const r = await window.api.renderPdf({ html, defaultName: filename });
    if (!r) return; // canceled
    if (r.error) { alert('PDF oluşturma hatası: ' + r.error); return; }
    live('PDF kaydedildi.');
  } catch (e) {
    alert('PDF hatası: ' + e.message);
  }
}

// ============= DOCX EXPORT =============
async function exportDOCX(template) {
  try {
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

    const skills = state.form.skills.split(',').map(s => s.trim()).filter(Boolean);
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
    if (r?.error) { alert('DOCX kaydetme hatası: ' + r.error); return; }
    if (r) live('Word belgesi kaydedildi.');
  } catch (e) {
    alert('DOCX oluşturma hatası: ' + e.message);
  }
}

// ============= MENÜ =============
function bindMenu() {
  window.api.onMenu('new', () => { openDrafts(); $('#draft-name').focus(); });
  window.api.onMenu('drafts', openDrafts);
  window.api.onMenu('import', importPDF);
  window.api.onMenu('import-json', importJSON);
  window.api.onMenu('export-json', exportJSON);
  window.api.onMenu('save-pdf', () => $('#dlg-export').showModal());
  window.api.onMenu('save-docx', () => $('#dlg-export').showModal());
  window.api.onMenu('ai', runAI);
  window.api.onMenu('ai-settings', openAISettings);
  window.api.onMenu('check', runCheck);
  window.api.onMenu('autofix', autofix);
  window.api.onMenu('theme', toggleTheme);
  window.api.onMenu('font-inc', () => bumpFont(0.1));
  window.api.onMenu('font-dec', () => bumpFont(-0.1));
  window.api.onMenu('help', openHelp);
  window.api.onMenu('shortcuts', () => $('#dlg-shortcuts').showModal());
}

// ============= DENETİM =============
function runCheck() {
  const items = [];
  if (!state.form.name?.trim()) items.push('❌ Ad Soyad alanı boş.');
  if (!state.form.title?.trim()) items.push('⚠️ Mesleki unvan girilmemiş.');
  if (!state.form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.form.email)) items.push('⚠️ Geçerli bir e-posta girin.');
  if (!state.form.phone?.trim()) items.push('⚠️ Telefon bilgisi eksik.');
  if (state.form.linkedin && !/^https?:\/\//i.test(state.form.linkedin)) items.push('⚠️ LinkedIn linki "https://" ile başlamalı.');
  if (state.form.website && !/^https?:\/\//i.test(state.form.website)) items.push('⚠️ Website linki "https://" ile başlamalı.');
  if (!state.form.linkedin?.trim()) items.push('💡 LinkedIn linki eklemek profesyonelliği artırır.');
  if (!state.form.summary?.trim()) items.push('💡 Profesyonel özet ekleyin (AI ile oluşturabilirsiniz).');
  else if (state.form.summary.length < 60) items.push('💡 Özet çok kısa; 3-4 cümle önerilir.');
  if (!state.experiences.length) items.push('⚠️ Hiç iş deneyimi eklenmemiş.');
  if (!state.educations.length) items.push('⚠️ Eğitim bilgisi eklenmemiş.');
  if (!state.form.skills?.trim()) items.push('💡 Beceriler bölümü boş.');
  else if (state.form.skills.split(',').filter(s => s.trim()).length < 3) items.push('💡 En az 3-5 beceri eklemeniz önerilir.');
  if (!state.languages.length) items.push('💡 En az bir dil ekleyin.');
  if (!state.photo) items.push('💡 Profil fotoğrafı eklemek etkiyi artırır (yurtdışı başvuruları için opsiyonel).');
  if (state.form.refRequest && state.references.length) items.push('⚠️ "İstek üzerine" seçili ama referans da eklenmiş — birini seçin.');
  if (!items.length) items.push('✅ Harika! CV\'niz eksiksiz ve profesyonel görünüyor.');

  const list = $('#check-list'); list.innerHTML = '';
  items.forEach(i => { const li = document.createElement('li'); li.textContent = i; list.appendChild(li); });
  $('#dlg-check').showModal();
  live(`Denetim tamamlandı, ${items.length} madde.`);
}

// ============= OTOMATIK DÜZELT =============
function autofix() {
  for (const e of state.experiences) {
    e.description = e.description.split('\n')
      .map(l => l.trim()).filter(Boolean)
      .map(l => '• ' + l.replace(/^[-•*]\s*/, '')).join('\n');
  }
  renderExperiences(); autosave();
  live('Metinler madde işaretli hale getirildi.');
}

// ============= PDF İÇE AKTAR =============
async function importPDF() {
  const result = await window.api.extractPdfText();
  if (!result) return;
  if (result.error) { alert('PDF okuma hatası: ' + result.error); return; }
  const text = result.text;
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (!lines.length) { alert('PDF\'de metin bulunamadı. Muhtemelen taranmış görsel PDF.'); return; }
  state.form.name = state.form.name || lines[0];
  if (lines[1] && lines[1].length < 80) state.form.title = state.form.title || lines[1];
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  if (emailMatch) state.form.email = state.form.email || emailMatch[0];
  const phoneMatch = text.match(/(\+?\d[\d\s\-()]{8,})/);
  if (phoneMatch) state.form.phone = state.form.phone || phoneMatch[0].trim();
  const liMatch = text.match(/https?:\/\/(?:www\.)?linkedin\.com\/[^\s]+/i);
  if (liMatch) state.form.linkedin = state.form.linkedin || liMatch[0];
  const ghMatch = text.match(/https?:\/\/(?:www\.)?github\.com\/[^\s]+/i);
  if (ghMatch) state.form.website = state.form.website || ghMatch[0];
  ['name','title','email','phone','linkedin','website'].forEach(k => { const el = $(`#f-${k}`); if (el) el.value = state.form[k] || ''; });
  autosave();
  alert('PDF\'den temel bilgiler çekildi. Diğer alanları elle tamamlayın.');
  live('PDF\'den bilgiler çekildi.');
}
