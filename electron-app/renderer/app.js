// ============= UYGULAMA DURUMU =============
const state = {
  photo: null,
  form: {
    name: '', title: '', email: '', phone: '', linkedin: '', website: '', city: '', summary: '', skills: ''
  },
  experiences: [], // {company, position, startDate, endDate, description}
  educations: [],  // {school, degree, startDate, endDate}
  languages: [],   // {name, level}
  settings: { apiKey: '', model: 'google/gemini-2.5-flash', theme: 'light' }
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const live = (msg) => { $('#live-region').textContent = msg; };
const uid = () => Math.random().toString(36).slice(2, 9);

// ============= BAŞLATMA =============
window.addEventListener('DOMContentLoaded', async () => {
  await loadFromStore();
  applyTheme(state.settings.theme);
  bindForm();
  bindButtons();
  bindMenu();
  renderExperiences(); renderEducations(); renderLanguages(); renderSkillsPreview();
  $('#f-name').focus();
  live('Uygulama hazır. Ad Soyad alanına odaklanıldı.');
});

async function loadFromStore() {
  const saved = await window.api.store.get('cv');
  if (saved) Object.assign(state, saved);
  const s = await window.api.store.get('settings');
  if (s) Object.assign(state.settings, s);
}

// ============= FORM BAĞLAMA =============
function bindForm() {
  const map = ['name','title','email','phone','linkedin','website','city','summary','skills'];
  for (const k of map) {
    const el = $(`#f-${k}`);
    el.value = state.form[k] || '';
    el.addEventListener('input', () => {
      state.form[k] = el.value;
      if (k === 'skills') renderSkillsPreview();
      autosave();
    });
  }
  if (state.photo) setPhoto(state.photo);
}

function renderSkillsPreview() {
  const wrap = $('#skills-preview');
  wrap.innerHTML = '';
  const items = state.form.skills.split(',').map(s => s.trim()).filter(Boolean);
  items.forEach(s => {
    const c = document.createElement('span');
    c.className = 'chip'; c.textContent = s;
    wrap.appendChild(c);
  });
}

// ============= FOTOĞRAF =============
function setPhoto(dataUrl) {
  state.photo = dataUrl;
  const p = $('#photo-preview');
  p.innerHTML = '';
  const img = document.createElement('img');
  img.src = dataUrl; img.alt = 'Profil fotoğrafı';
  p.appendChild(img);
}

// ============= DİNAMİK BLOKLAR =============
function createEntry({ type, data, fields }) {
  const el = document.createElement('div');
  el.className = 'entry';
  el.tabIndex = 0;
  el.dataset.id = data.id;
  el.setAttribute('role', 'group');
  el.setAttribute('aria-label', `${type} bloğu`);

  const header = document.createElement('div');
  header.className = 'entry-header';
  header.innerHTML = `<span class="entry-title">${type}</span>`;
  const del = document.createElement('button');
  del.type = 'button'; del.className = 'btn btn-ghost btn-sm btn-danger';
  del.textContent = 'Sil';
  del.setAttribute('aria-label', `${type} bloğunu sil`);
  del.addEventListener('click', () => deleteEntry(data.id));
  header.appendChild(del);
  el.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'entry-grid';
  fields.forEach(f => {
    const label = document.createElement('label');
    label.className = 'field' + (f.wide ? ' field-wide' : '');
    label.innerHTML = `<span>${f.label}</span>`;
    const input = f.textarea ? document.createElement('textarea') : document.createElement('input');
    if (!f.textarea) input.type = f.type || 'text';
    if (f.placeholder) input.placeholder = f.placeholder;
    input.value = data[f.key] || '';
    input.addEventListener('input', () => { data[f.key] = input.value; autosave(); });
    label.appendChild(input);
    grid.appendChild(label);
  });
  el.appendChild(grid);

  el.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' && e.target === el) {
      if (confirm('Bu bloğu silmek istiyor musunuz?')) deleteEntry(data.id);
    }
  });
  return el;
}

function deleteEntry(id) {
  state.experiences = state.experiences.filter(e => e.id !== id);
  state.educations = state.educations.filter(e => e.id !== id);
  state.languages = state.languages.filter(e => e.id !== id);
  renderExperiences(); renderEducations(); renderLanguages();
  autosave();
  live('Blok silindi.');
}

function renderExperiences() {
  const list = $('#exp-list'); list.innerHTML = '';
  state.experiences.forEach(exp => {
    list.appendChild(createEntry({
      type: 'İş Deneyimi', data: exp,
      fields: [
        { key: 'company', label: 'Şirket' },
        { key: 'position', label: 'Pozisyon' },
        { key: 'startDate', label: 'Başlangıç (AA/YYYY)', placeholder: '01/2020' },
        { key: 'endDate', label: 'Bitiş (AA/YYYY / Devam)', placeholder: 'Devam' },
        { key: 'description', label: 'Görevler ve Başarılar', textarea: true, wide: true, placeholder: 'Her satır madde olur.' },
      ]
    }));
  });
}

function renderEducations() {
  const list = $('#edu-list'); list.innerHTML = '';
  state.educations.forEach(edu => {
    list.appendChild(createEntry({
      type: 'Eğitim', data: edu,
      fields: [
        { key: 'school', label: 'Okul / Kurum' },
        { key: 'degree', label: 'Bölüm / Derece' },
        { key: 'startDate', label: 'Başlangıç', placeholder: '2015' },
        { key: 'endDate', label: 'Bitiş', placeholder: '2019' },
      ]
    }));
  });
}

function renderLanguages() {
  const list = $('#lang-list'); list.innerHTML = '';
  state.languages.forEach(lang => {
    list.appendChild(createEntry({
      type: 'Dil', data: lang,
      fields: [
        { key: 'name', label: 'Dil', placeholder: 'İngilizce' },
        { key: 'level', label: 'Seviye', placeholder: 'İleri (C1)' },
      ]
    }));
  });
}

// ============= OTOMATIK KAYDET =============
let saveTimer;
function autosave() {
  $('#save-indicator').textContent = 'Yazılıyor...';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    await window.api.store.set('cv', {
      photo: state.photo, form: state.form,
      experiences: state.experiences, educations: state.educations, languages: state.languages
    });
    $('#save-indicator').textContent = 'Kaydedildi ✓';
  }, 400);
}

// ============= BUTON BAĞLAMA =============
function bindButtons() {
  $('#btn-theme').addEventListener('click', toggleTheme);
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
  $('#btn-add-exp').addEventListener('click', () => {
    state.experiences.push({ id: uid(), company: '', position: '', startDate: '', endDate: '', description: '' });
    renderExperiences(); autosave(); live('İş deneyimi eklendi.');
  });
  $('#btn-add-edu').addEventListener('click', () => {
    state.educations.push({ id: uid(), school: '', degree: '', startDate: '', endDate: '' });
    renderEducations(); autosave(); live('Eğitim eklendi.');
  });
  $('#btn-add-lang').addEventListener('click', () => {
    state.languages.push({ id: uid(), name: '', level: '' });
    renderLanguages(); autosave(); live('Dil eklendi.');
  });

  $('#btn-export-pdf').addEventListener('click', () => { const tpl = getTemplate(); $('#dlg-export').close(); exportPDF(tpl); });
  $('#btn-export-docx').addEventListener('click', () => { const tpl = getTemplate(); $('#dlg-export').close(); exportDOCX(tpl); });
  $('#btn-save-ai').addEventListener('click', saveAISettings);
  $('#btn-save-draft').addEventListener('click', saveDraft);

  $$('[data-close]').forEach(b => b.addEventListener('click', (e) => e.target.closest('dialog').close()));
}
const getTemplate = () => document.querySelector('input[name="tpl"]:checked').value;

async function selectPhoto() {
  const data = await window.api.openImage();
  if (data) { setPhoto(data); autosave(); live('Fotoğraf yüklendi.'); }
}

// ============= TEMA =============
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

// ============= AI =============
async function runAI() {
  if (!state.settings.apiKey) {
    if (confirm('AI anahtarı ayarlanmamış. Şimdi ayarlamak ister misiniz?')) openAISettings();
    return;
  }
  const { name, title, summary } = state.form;
  if (!name || !title) { alert('AI için en az Ad Soyad ve Mesleki Unvan gerekli.'); return; }
  const companies = state.experiences.filter(e => e.company).map(e => `${e.position} @ ${e.company}`).join(', ');
  const skills = state.form.skills;
  const prompt = `Bir kişi için 3-4 cümlelik profesyonel Türkçe CV özeti yaz.
Ad: ${name}
Unvan: ${title}
Deneyim: ${companies || 'Belirtilmemiş'}
Beceriler: ${skills || 'Belirtilmemiş'}
${summary ? 'Mevcut taslak: ' + summary : ''}

Sadece özet metnini döndür, başlık veya açıklama ekleme.`;

  $('#btn-ai').disabled = true; $('#btn-ai').textContent = '⏳ Yazılıyor...';
  live('AI özet oluşturuyor...');
  try {
    const text = await window.api.aiGenerate({
      apiKey: state.settings.apiKey, model: state.settings.model, prompt
    });
    state.form.summary = text.trim();
    $('#f-summary').value = state.form.summary;
    autosave();
    live('AI özet oluşturuldu.');
  } catch (e) {
    alert('AI hatası: ' + e.message);
  } finally {
    $('#btn-ai').disabled = false; $('#btn-ai').textContent = '✨ AI Özet';
  }
}

function openAISettings() {
  $('#ai-key').value = state.settings.apiKey || '';
  $('#ai-model').value = state.settings.model;
  $('#dlg-ai').showModal();
}
async function saveAISettings() {
  state.settings.apiKey = $('#ai-key').value.trim();
  state.settings.model = $('#ai-model').value;
  await window.api.store.set('settings', state.settings);
  $('#dlg-ai').close();
  live('AI ayarları kaydedildi.');
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
      li.innerHTML = `<div><span class="draft-name"></span><span class="draft-date"></span></div>`;
      li.querySelector('.draft-name').textContent = d.name;
      li.querySelector('.draft-date').textContent = new Date(d.date).toLocaleString('tr-TR');
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
async function saveDraft() {
  const name = $('#draft-name').value.trim() || `Taslak ${new Date().toLocaleDateString('tr-TR')}`;
  const drafts = (await window.api.store.get('drafts')) || [];
  drafts.push({
    id: uid(), name, date: Date.now(),
    data: { photo: state.photo, form: state.form, experiences: state.experiences, educations: state.educations, languages: state.languages }
  });
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
  bindForm(); renderExperiences(); renderEducations(); renderLanguages(); renderSkillsPreview();
  if (state.photo) setPhoto(state.photo); else { state.photo = null; $('#photo-preview').innerHTML = '<span class="photo-placeholder">Fotoğraf yok</span>'; }
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

// ============= PDF EXPORT (jsPDF, 3 şablon) =============
async function exportPDF(template) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;
  let y = M;

  const colors = {
    modern: { primary: [37, 99, 235], text: [26, 29, 36], muted: [107, 114, 128] },
    classic: { primary: [0, 0, 0], text: [0, 0, 0], muted: [80, 80, 80] },
    minimal: { primary: [50, 50, 50], text: [30, 30, 30], muted: [130, 130, 130] },
  }[template];

  const setColor = (c) => doc.setTextColor(c[0], c[1], c[2]);
  const line = (x1, y1, x2, y2) => doc.line(x1, y1, x2, y2);
  const checkPage = (needed = 60) => {
    if (y + needed > H - M) { doc.addPage(); y = M; }
  };

  // BAŞLIK
  if (template === 'modern') {
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, W, 90, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22); doc.setFont('helvetica', 'bold');
    doc.text(state.form.name || '', M, 42);
    doc.setFontSize(13); doc.setFont('helvetica', 'normal');
    doc.text(state.form.title || '', M, 65);
    if (state.photo) {
      try { doc.addImage(state.photo, 'JPEG', W - M - 70, 15, 60, 60); } catch {}
    }
    y = 115;
  } else {
    if (state.photo) {
      try { doc.addImage(state.photo, 'JPEG', W - M - 60, M, 55, 65); } catch {}
    }
    setColor(colors.text);
    doc.setFontSize(template === 'classic' ? 20 : 24);
    doc.setFont('helvetica', template === 'minimal' ? 'normal' : 'bold');
    doc.text(state.form.name || '', M, y + 8); y += 28;
    doc.setFontSize(12); doc.setFont('helvetica', 'normal');
    setColor(colors.muted);
    doc.text(state.form.title || '', M, y); y += 18;
    if (template === 'classic') { doc.setDrawColor(0); line(M, y, W - M, y); y += 12; }
    else y += 6;
  }

  // İLETİŞİM
  setColor(colors.muted);
  doc.setFontSize(10);
  const contacts = [state.form.email, state.form.phone, state.form.city].filter(Boolean).join('  •  ');
  if (contacts) { doc.text(contacts, M, y); y += 14; }
  const links = [state.form.linkedin, state.form.website].filter(Boolean);
  if (links.length) {
    setColor(colors.primary);
    for (const link of links) {
      doc.textWithLink(link, M, y, { url: link });
      y += 12;
    }
  }
  y += 8;

  const sectionTitle = (t) => {
    checkPage(40);
    setColor(colors.primary);
    doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text(t.toUpperCase(), M, y);
    if (template !== 'minimal') { doc.setDrawColor(...colors.primary); line(M, y + 4, W - M, y + 4); }
    y += 20;
    setColor(colors.text); doc.setFont('helvetica', 'normal');
  };

  const wrap = (text, maxW, fontSize = 11) => {
    doc.setFontSize(fontSize);
    return doc.splitTextToSize(text, maxW);
  };

  // ÖZET
  if (state.form.summary?.trim()) {
    sectionTitle('Profesyonel Özet');
    const lines = wrap(state.form.summary, W - 2 * M);
    doc.setFontSize(11);
    lines.forEach(l => { checkPage(16); doc.text(l, M, y); y += 14; });
    y += 8;
  }

  // DENEYİM
  const validExps = state.experiences.filter(e => e.company || e.position);
  if (validExps.length) {
    sectionTitle('İş Deneyimi');
    for (const e of validExps) {
      checkPage(60);
      setColor(colors.text); doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
      doc.text(`${e.position || ''}${e.position && e.company ? ' — ' : ''}${e.company || ''}`, M, y);
      y += 14;
      setColor(colors.muted); doc.setFont('helvetica', 'italic'); doc.setFontSize(10);
      const dates = [e.startDate, e.endDate].filter(Boolean).join(' — ');
      if (dates) { doc.text(dates, M, y); y += 12; }
      setColor(colors.text); doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
      const bullets = (e.description || '').split('\n').filter(l => l.trim());
      for (const b of bullets) {
        const clean = b.replace(/^[-•*]\s*/, '');
        const wrapped = wrap('• ' + clean, W - 2 * M - 10);
        wrapped.forEach(l => { checkPage(14); doc.text(l, M + 8, y); y += 13; });
      }
      y += 8;
    }
  }

  // EĞİTİM
  const validEdus = state.educations.filter(e => e.school || e.degree);
  if (validEdus.length) {
    sectionTitle('Eğitim');
    for (const e of validEdus) {
      checkPage(30);
      setColor(colors.text); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
      doc.text(`${e.school || ''}`, M, y); y += 13;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); setColor(colors.muted);
      const parts = [e.degree, [e.startDate, e.endDate].filter(Boolean).join(' — ')].filter(Boolean).join('  •  ');
      if (parts) { doc.text(parts, M, y); y += 12; }
      y += 6;
    }
  }

  // BECERİLER
  const skills = state.form.skills.split(',').map(s => s.trim()).filter(Boolean);
  if (skills.length) {
    sectionTitle('Beceriler');
    setColor(colors.text); doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
    const lines = wrap(skills.join(' • '), W - 2 * M);
    lines.forEach(l => { checkPage(14); doc.text(l, M, y); y += 14; });
    y += 6;
  }

  // DİLLER
  const validLangs = state.languages.filter(l => l.name);
  if (validLangs.length) {
    sectionTitle('Diller');
    setColor(colors.text); doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
    for (const l of validLangs) {
      checkPage(14);
      doc.text(`${l.name}${l.level ? ' — ' + l.level : ''}`, M, y); y += 13;
    }
  }

  const blob = doc.output('blob');
  const buf = await blob.arrayBuffer();
  const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
  const filename = `${(state.form.name || 'CV').replace(/\s+/g, '_')}.pdf`;
  await window.api.save({
    defaultName: filename,
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
    dataBase64: b64
  });
  live('PDF kaydedildi.');
}

// ============= DOCX EXPORT =============
async function exportDOCX(template) {
  const D = window.docx;
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ExternalHyperlink, ImageRun } = D;

  const heading = (t) => new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text: t, bold: true, color: template === 'modern' ? '2563EB' : '000000' })],
    spacing: { before: 240, after: 120 }
  });

  const children = [];
  // Ad + unvan
  children.push(new Paragraph({
    children: [new TextRun({ text: state.form.name || '', bold: true, size: 40 })],
    alignment: AlignmentType.CENTER
  }));
  if (state.form.title) children.push(new Paragraph({
    children: [new TextRun({ text: state.form.title, size: 24, color: '555555' })],
    alignment: AlignmentType.CENTER, spacing: { after: 120 }
  }));

  const contactParts = [state.form.email, state.form.phone, state.form.city].filter(Boolean);
  if (contactParts.length) children.push(new Paragraph({
    children: [new TextRun({ text: contactParts.join(' • '), size: 20 })],
    alignment: AlignmentType.CENTER
  }));
  if (state.form.linkedin) children.push(new Paragraph({
    children: [new ExternalHyperlink({ children: [new TextRun({ text: state.form.linkedin, style: 'Hyperlink', size: 20 })], link: state.form.linkedin })],
    alignment: AlignmentType.CENTER
  }));
  if (state.form.website) children.push(new Paragraph({
    children: [new ExternalHyperlink({ children: [new TextRun({ text: state.form.website, style: 'Hyperlink', size: 20 })], link: state.form.website })],
    alignment: AlignmentType.CENTER, spacing: { after: 240 }
  }));

  if (state.form.summary?.trim()) {
    children.push(heading('Profesyonel Özet'));
    children.push(new Paragraph({ children: [new TextRun({ text: state.form.summary, size: 22 })] }));
  }

  const validExps = state.experiences.filter(e => e.company || e.position);
  if (validExps.length) {
    children.push(heading('İş Deneyimi'));
    for (const e of validExps) {
      children.push(new Paragraph({
        children: [new TextRun({ text: `${e.position || ''}${e.position && e.company ? ' — ' : ''}${e.company || ''}`, bold: true, size: 24 })]
      }));
      const dates = [e.startDate, e.endDate].filter(Boolean).join(' — ');
      if (dates) children.push(new Paragraph({ children: [new TextRun({ text: dates, italics: true, size: 20, color: '666666' })] }));
      const bullets = (e.description || '').split('\n').filter(l => l.trim());
      for (const b of bullets) {
        children.push(new Paragraph({ children: [new TextRun({ text: '• ' + b.replace(/^[-•*]\s*/, ''), size: 22 })] }));
      }
      children.push(new Paragraph({ children: [new TextRun('')] }));
    }
  }

  const validEdus = state.educations.filter(e => e.school || e.degree);
  if (validEdus.length) {
    children.push(heading('Eğitim'));
    for (const e of validEdus) {
      children.push(new Paragraph({ children: [new TextRun({ text: e.school || '', bold: true, size: 22 })] }));
      const parts = [e.degree, [e.startDate, e.endDate].filter(Boolean).join(' — ')].filter(Boolean).join(' • ');
      if (parts) children.push(new Paragraph({ children: [new TextRun({ text: parts, size: 20, color: '666666' })] }));
    }
  }

  const skills = state.form.skills.split(',').map(s => s.trim()).filter(Boolean);
  if (skills.length) {
    children.push(heading('Beceriler'));
    children.push(new Paragraph({ children: [new TextRun({ text: skills.join(' • '), size: 22 })] }));
  }

  const validLangs = state.languages.filter(l => l.name);
  if (validLangs.length) {
    children.push(heading('Diller'));
    for (const l of validLangs) {
      children.push(new Paragraph({ children: [new TextRun({ text: `${l.name}${l.level ? ' — ' + l.level : ''}`, size: 22 })] }));
    }
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  const buf = await blob.arrayBuffer();
  const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
  const filename = `${(state.form.name || 'CV').replace(/\s+/g, '_')}.docx`;
  await window.api.save({
    defaultName: filename,
    filters: [{ name: 'Word', extensions: ['docx'] }],
    dataBase64: b64
  });
  live('Word belgesi kaydedildi.');
}

// ============= MENÜ EVENTLERİ =============
function bindMenu() {
  window.api.onMenu('new', () => { $('#draft-name').focus(); openDrafts(); });
  window.api.onMenu('drafts', openDrafts);
  window.api.onMenu('import', importPDF);
  window.api.onMenu('save-pdf', () => $('#dlg-export').showModal());
  window.api.onMenu('save-docx', () => $('#dlg-export').showModal());
  window.api.onMenu('ai', runAI);
  window.api.onMenu('ai-settings', openAISettings);
  window.api.onMenu('check', runCheck);
  window.api.onMenu('autofix', autofix);
  window.api.onMenu('theme', toggleTheme);
  window.api.onMenu('help', () => $('#dlg-help').showModal());
}

// ============= DENETİM =============
function runCheck() {
  const items = [];
  if (!state.form.name?.trim()) items.push('❌ Ad Soyad alanı boş.');
  if (!state.form.email || !state.form.email.includes('@')) items.push('⚠️ Geçerli bir e-posta girin.');
  if (!state.form.phone?.trim()) items.push('⚠️ Telefon bilgisi eksik.');
  if (!state.form.linkedin?.trim()) items.push('💡 LinkedIn linki eklemek profesyonelliği artırır.');
  if (!state.form.summary?.trim()) items.push('💡 Profesyonel özet ekleyin (AI ile oluşturabilirsiniz).');
  if (!state.experiences.length) items.push('⚠️ Hiç iş deneyimi eklenmemiş.');
  if (!state.educations.length) items.push('⚠️ Eğitim bilgisi eklenmemiş.');
  if (!state.form.skills?.trim()) items.push('💡 Beceriler bölümü boş.');
  if (!state.photo) items.push('💡 Profil fotoğrafı eklemek etkiyi artırır.');
  if (!items.length) items.push('✅ Harika! CV\'niz eksiksiz ve profesyonel görünüyor.');

  const list = $('#check-list'); list.innerHTML = '';
  items.forEach(i => { const li = document.createElement('li'); li.textContent = i; list.appendChild(li); });
  $('#dlg-check').showModal();
  live(`Denetim tamamlandı, ${items.length} madde.`);
}

// ============= OTOMATIK DÜZENLE =============
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
  const lines = result.split('\n').map(l => l.trim()).filter(Boolean);
  if (!lines.length) { alert('PDF\'de metin bulunamadı.'); return; }
  state.form.name = state.form.name || lines[0];
  if (lines[1]) state.form.title = state.form.title || lines[1];
  const emailMatch = result.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  if (emailMatch) state.form.email = state.form.email || emailMatch[0];
  const phoneMatch = result.match(/(\+?\d[\d\s\-()]{8,})/);
  if (phoneMatch) state.form.phone = state.form.phone || phoneMatch[0].trim();
  const liMatch = result.match(/https?:\/\/(?:www\.)?linkedin\.com\/[^\s]+/i);
  if (liMatch) state.form.linkedin = state.form.linkedin || liMatch[0];
  ['name','title','email','phone','linkedin'].forEach(k => { $(`#f-${k}`).value = state.form[k] || ''; });
  autosave();
  live('PDF\'den bilgiler çekildi.');
}
