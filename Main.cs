using System;
using System.Collections.Generic;
using System.Drawing;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading;
using System.Windows.Forms;
using Data = System.Collections.Generic.Dictionary<string, object>;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        bool first;
        L.Initialize();
        using (var mutex = new Mutex(true, @"Local\OzgecmisAsistani.Desktop", out first))
        {
            if (!first)
            {
                MessageBox.Show(L.T("Öz Geçmiş Asistanı zaten açık.", "CV Assistant is already open."), L.T("Öz Geçmiş Asistanı", "CV Assistant"));
                return;
            }
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new Editor());
        }
    }
}

internal sealed class Editor : Form
{
    private readonly string directory = AppPaths.Data;
    private readonly ComboBox drafts = new ComboBox { DropDownStyle = ComboBoxStyle.DropDownList, AccessibleName = L.T("Etkin taslak", "Active draft"), Dock = DockStyle.Fill };
    private readonly ListBox sections = new ListBox { AccessibleName = L.T("CV bölümleri", "CV sections"), Dock = DockStyle.Fill };
    private readonly ListBox entries = new ListBox { AccessibleName = L.T("Bölüm kayıtları", "Section entries"), Dock = DockStyle.Fill };
    private readonly List<ShortcutCommand> commands = new List<ShortcutCommand>();
    private readonly Button edit, add, remove, up, down;
    private readonly Label sectionsCaption = new Label { AutoSize = true };
    private readonly Label sectionHint = new Label { AutoSize = true };
    private Font headingFont;
    private string ShortcutsPath { get { return Path.Combine(directory, "kisayollar.json"); } }
    private readonly Label sectionTitle = new Label { AutoSize = true };
    private readonly Label status = new Label { AutoSize = true, AccessibleRole = AccessibleRole.StatusBar };
    private readonly Dictionary<Data, DeletedRecord> lastDeletion = new Dictionary<Data, DeletedRecord>();

    private sealed class DeletedRecord
    {
        public readonly Section Section;
        public readonly int Index;
        public readonly Data Record;

        public DeletedRecord(Section section, int index, Data record)
        {
            Section = section;
            Index = index;
            Record = record;
        }
    }

    private Preferences preferences = new Preferences();
    private Font customFont;
    private string ApiKeysPath { get { return AppPaths.ApiKeys; } }
    private string PreferencesPath { get { return AppPaths.Preferences; } }

    private List<Data> documents = new List<Data>();
    private int active;
    private bool rendering, loadFailed, checkingUpdates;
    private string Library { get { return Path.Combine(directory, "taslaklar.json"); } }
    private Data Cv { get { return (Data)documents[active]["data"]; } }
    private Section Current { get { return (Section)sections.SelectedItem; } }
    private List<Data> Rows { get { return (List<Data>)Cv[Current.Key]; } }

    public Editor()
    {
        Text = L.T("Öz Geçmiş Asistanı 0.12.4 — Önizleme", "CV Assistant 0.12.4 Preview");
        if (AppPaths.Portable) Text += L.T(" (Taşınabilir)", " (Portable)");
        StartPosition = FormStartPosition.CenterScreen;
        ClientSize = new Size(900, 560);
        MinimumSize = new Size(700, 450);
        AutoScaleMode = AutoScaleMode.Font;
        Font = SystemFonts.MessageBoxFont;
        var menu = new MenuStrip { AccessibleName = L.T("Ana menü", "Main menu"), TabStop = false };
        var file = new ToolStripMenuItem(L.T("&Dosya", "&File"));
        Command(file, "new", L.T("&Yeni taslak", "&New draft"), Keys.Control | Keys.N, NewDraft);
        Command(file, "rename", L.T("Taslağı yeniden &adlandır…", "&Rename draft…"), Keys.F2, Rename);
        Command(file, "duplicate", L.T("Etkin taslağı &çoğalt…", "D&uplicate active draft…"), Keys.Control | Keys.Shift | Keys.N, DuplicateDraft);
        Command(file, "import", L.T("JSON &içe aktar…", "&Import JSON…"), Keys.Control | Keys.O, Import);
        Command(file, "backup", L.T("JSON &yedekle…", "&Back up as JSON…"), Keys.Control | Keys.Shift | Keys.S, () => Export(ExportFormat.Json));
        Command(file, "text", L.T("&Düz metin olarak dışa aktar…", "Export as plain &text…"), Keys.Control | Keys.S, () => Export(ExportFormat.Text));
        Command(file, "word", L.T("&Word olarak dışa aktar…", "Export to &Word…"), Keys.Control | Keys.Shift | Keys.W, () => Export(ExportFormat.Word));
        Command(file, "pdf", L.T("&PDF olarak dışa aktar…", "Export to &PDF…"), Keys.Control | Keys.Shift | Keys.P, () => Export(ExportFormat.Pdf));
        Command(file, "exit", L.T("Çı&kış", "E&xit"), Keys.None, Close);
        var editMenu = new ToolStripMenuItem(L.T("&Düzen", "&Edit"));
        Command(editMenu, "undo", L.T("&Son silinen kaydı geri al", "&Undo last entry deletion"), Keys.Control | Keys.Z, UndoDelete);
        Command(editMenu, "find", L.T("CV’de &ara…", "&Find in CV…"), Keys.Control | Keys.F, FindInCv);
        var view = new ToolStripMenuItem(L.T("&Görünüm", "&View"));
        Command(view, "sections", L.T("&Bölümlere git", "Go to &sections"), Keys.F3, () => sections.Focus());
        Command(view, "preview", L.T("&Düz metin önizlemesi", "Plain text &preview"), Keys.F4, Preview);
        Command(view, "status", L.T("&Son işlem durumu", "&Last operation status"), Keys.F6, () => ReadText(L.T("Son işlem durumu", "Last operation status"), status.Text));
        var tools = new ToolStripMenuItem(L.T("&Araçlar", "&Tools"));
        Command(tools, "review", L.T("&CV denetimi", "&Review CV"), Keys.F7, Review);
        Command(tools, "settings", L.T("&Ayarlar…", "&Settings…"), Keys.Control | Keys.Oemcomma, OpenPreferences);
        Command(tools, "summary", L.T("Yapay zekâ ile &özet öner…", "Suggest &summary with AI…"), Keys.Control | Keys.G, SuggestSummary);
        Command(tools, "job", L.T("İş &ilanını karşılaştır…", "Compare &job posting…"), Keys.F9, CompareJobPosting);
        var help = new ToolStripMenuItem(L.T("&Yardım", "&Help"));
        Command(help, "guide", L.T("&Kullanım kılavuzu", "&User guide"), Keys.F1, Help);
        Command(help, "shortcuts", L.T("&Klavye kısayolları…", "&Keyboard shortcuts…"), Keys.None, OpenShortcuts);
        Command(help, "feedback", L.T("&Geri bildirim…", "&Feedback…"), Keys.None, OpenFeedback);
        Command(help, "updates", L.T("&Güncellemeleri denetle…", "Check for &updates…"), Keys.None, CheckForUpdates);
        menu.Items.AddRange(new ToolStripItem[] { file, editMenu, view, tools, help });
        MainMenuStrip = menu;

        var layout = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 2, RowCount = 5, Padding = new Padding(22, 16, 22, 14) };
        layout.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 30));
        layout.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 70));
        layout.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        layout.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        layout.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        layout.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        layout.RowStyles.Add(new RowStyle(SizeType.AutoSize));

        layout.Controls.Add(new Label {
            Text = L.T("&Etkin taslak", "&Active draft"), AutoSize = true, TabIndex = 0,
            Anchor = AnchorStyles.Left, Margin = new Padding(0, 0, 10, 15)
        }, 0, 0);
        drafts.Margin = new Padding(10, 0, 0, 15);
        layout.Controls.Add(drafts, 1, 0);
        drafts.TabIndex = 1;

        sectionsCaption.Text = L.T("CV &bölümleri", "CV &sections");
        sectionsCaption.TabIndex = 2;
        sectionsCaption.Margin = new Padding(0, 0, 10, 6);
        sectionTitle.Margin = new Padding(10, 0, 0, 6);
        layout.Controls.Add(sectionsCaption, 0, 1);
        layout.Controls.Add(sectionTitle, 1, 1);

        sections.IntegralHeight = entries.IntegralHeight = false;
        sections.HorizontalScrollbar = entries.HorizontalScrollbar = true;
        sections.Margin = new Padding(0, 0, 10, 0);
        layout.Controls.Add(sections, 0, 2);
        sections.TabIndex = 3;
        var detail = new TableLayoutPanel {
            Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 2, Margin = new Padding(10, 0, 0, 0), TabIndex = 4
        };
        detail.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        detail.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        detail.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        sectionHint.Dock = DockStyle.Fill;
        sectionHint.Margin = new Padding(0, 0, 0, 8);
        entries.Margin = Padding.Empty;
        detail.Controls.Add(sectionHint, 0, 0);
        detail.Controls.Add(entries, 0, 1);
        layout.Controls.Add(detail, 1, 2);

        var actions = new FlowLayoutPanel { Dock = DockStyle.Fill, AutoSize = true, TabIndex = 5, Margin = new Padding(0, 12, 0, 0) };
        edit = ButtonFor(actions, L.T("&Düzenle…", "&Edit…"), () => Edit(false));
        add = ButtonFor(actions, L.T("&Kayıt ekle…", "&Add entry…"), () => Edit(true));
        remove = ButtonFor(actions, L.T("&Sil…", "&Delete…"), Remove);
        up = ButtonFor(actions, L.T("Yu&karı taşı", "Move &up"), () => MoveRow(-1));
        down = ButtonFor(actions, L.T("Aşa&ğı taşı", "Move dow&n"), () => MoveRow(1));
        layout.Controls.Add(actions, 0, 3);
        layout.SetColumnSpan(actions, 2);
        status.Margin = new Padding(0, 10, 0, 0);
        layout.Controls.Add(status, 0, 4);
        layout.SetColumnSpan(status, 2);
        Controls.Add(layout);
        Controls.Add(menu);
        sections.Items.AddRange(Model.Sections);
        sections.SelectedIndexChanged += delegate { if (!rendering) RenderRows(0); };
        entries.SelectedIndexChanged += delegate { if (!rendering) SetButtons(); };
        sections.KeyDown += delegate(object s, KeyEventArgs e) { if (e.KeyCode == Keys.Enter) { e.SuppressKeyPress = true; Edit(false); } };
        entries.KeyDown += delegate(object s, KeyEventArgs e) { if (e.KeyCode == Keys.Enter) { e.SuppressKeyPress = true; Edit(false); } };
        entries.DoubleClick += delegate { Edit(false); };
        drafts.SelectedIndexChanged += delegate {
            if (rendering || drafts.SelectedIndex < 0) return;
            int previous = active;
            active = drafts.SelectedIndex;
            if (!Save()) { active = previous; RenderDrafts(); }
            RenderRows(0);
        };
        Shown += delegate { sections.Focus(); };
        try { ApplyShortcuts(Shortcuts.Load(ShortcutsPath, commands)); }
        catch (Exception)
        {
            Shown += delegate { Alert(L.T("Kısayollar okunamadı. Varsayılan kısayollar kullanılıyor.",
                "Shortcuts could not be read. Default shortcuts are in use.")); };
        }
        LoadLibrary();
        try { ApplyPreferences(Preferences.Load(PreferencesPath)); }
        catch (Exception error)
        {
            ApplyPreferences(new Preferences());
            Shown += delegate { Alert(L.T("Ayarlar okunamadı. Windows varsayılanları kullanılıyor. ", "Settings could not be read. Windows defaults are in use. ") + error.Message); };
        }
    }

    private void LoadLibrary()
    {
        try
        {
            if (File.Exists(Library))
            {
                var library = Model.Read(Library) as Data;
                var saved = Model.Get(library, "drafts") as object[];
                if (saved == null || saved.Length == 0) throw new InvalidDataException(L.T("Taslak listesi bulunamadı.", "The draft list could not be found."));
                var loaded = new List<Data>();
                foreach (Data item in saved)
                    loaded.Add(new Data { { "name", Model.Value(item, "name") }, { "data", Model.Normalize(Model.Get(item, "data")) } });
                active = Math.Max(0, Math.Min(loaded.Count - 1, Convert.ToInt32(Model.Get(library, "active"))));
                documents = loaded;
            }
        }
        catch (Exception error)
        {
            loadFailed = true;
            Shown += delegate { Alert(L.T("Yerel taslak dosyası okunamadı. Bu oturumda JSON ile yedekleyebilirsiniz. ", "Local drafts could not be read. You can export a JSON backup during this session. ") + error.Message); };
        }
        if (documents.Count == 0)
            documents.Add(new Data { { "name", L.T("İlk taslak", "First draft") }, { "data", Model.NewCv() } });
        RenderDrafts();
        sections.SelectedIndex = 0;
        status.Text = loadFailed ? L.T("Yerel kayıt devre dışı.", "Local saving is disabled.") : L.T("Kılavuz ve kısayollar Yardım menüsünde.", "Find the guide and shortcuts in the Help menu.");
    }

    private bool Save(string message = null)
    {
        try
        {
            if (loadFailed) throw new InvalidOperationException(L.T("Mevcut taslak dosyası okunamadığı için yerel kayıt devre dışı.", "Local saving is disabled because the existing draft file could not be read."));
            Directory.CreateDirectory(directory);
            Model.Write(Library, new Data { { "active", active }, { "drafts", documents } });
            status.Text = message ?? L.T("Taslak kaydedildi.", "Draft saved.");
            return true;
        }
        catch (Exception error)
        {
            status.Text = L.T("Taslak kaydedilemedi.", "The draft could not be saved.");
            Alert(L.T("Taslak kaydedilemedi. ", "The draft could not be saved. ") + error.Message);
            return false;
        }
    }

    private void RenderDrafts()
    {
        rendering = true;
        drafts.Items.Clear();
        drafts.Items.AddRange(documents.Select(d => Model.Value(d, "name")).ToArray());
        drafts.SelectedIndex = active;
        rendering = false;
    }

    private void RenderRows(int selected)
    {
        rendering = true;
        sectionTitle.Text = Current.Name;
        entries.Items.Clear();
        if (Current.Key != "form")
            for (int i = 0; i < Rows.Count; i++) entries.Items.Add(Model.EntryName(Current, Rows[i], i));
        if (entries.Items.Count > 0) entries.SelectedIndex = Math.Max(0, Math.Min(selected, entries.Items.Count - 1));
        rendering = false;
        SetButtons();
    }

    private void SetButtons()
    {
        int index = entries.SelectedIndex;
        bool repeated = Current.Key != "form";
        sectionHint.Text = !repeated
            ? L.T("Bu bölümdeki alanları açmak için Düzenle’yi seçin.", "Choose Edit to open the fields in this section.")
            : entries.Items.Count == 0
                ? L.T("Bu bölümde henüz kayıt yok. Kayıt ekle ile başlayın.", "This section has no entries yet. Choose Add entry to begin.")
                : string.Format(L.T("{0} kayıt. Düzenlemek için bir kayıt seçin.",
                    entries.Items.Count == 1 ? "{0} entry. Select it to edit." : "{0} entries. Select an entry to edit."), entries.Items.Count);
        entries.Visible = repeated && entries.Items.Count > 0;
        entries.TabStop = entries.Visible;
        entries.Enabled = entries.TabStop;
        add.Enabled = repeated;
        edit.Enabled = !repeated || index >= 0;
        remove.Enabled = index >= 0;
        up.Enabled = index > 0;
        down.Enabled = index >= 0 && index + 1 < entries.Items.Count;
    }

    private void Edit(bool create, string initialField = null)
    {
        Section section = Current;
        bool personal = section.Key == "form";
        int index = entries.SelectedIndex;
        if (!personal && !create && index < 0) { add.Focus(); return; }
        Data original = personal ? (Data)Cv["form"] : create ? new Data { { "id", Guid.NewGuid().ToString("N") } } : Rows[index];
        var changed = new Data(original);
        using (var dialog = new FieldDialog(section.Name, initialField) { Font = Font })
        {
            foreach (var field in section.Fields)
            {
                if (field[0] == "refRequest") dialog.Flag(field[0], L.Field(field[1]), Equals(Model.Get(original, field[0]), true));
                else dialog.Input(field[0], L.Field(field[1]), Model.Value(original, field[0]), field[1].EndsWith("*"));
            }
            if (dialog.ShowDialog(this) != DialogResult.OK) return;
            dialog.CopyTo(changed);
        }
        if (personal) Cv["form"] = changed;
        else if (create) { Rows.Add(changed); index = Rows.Count - 1; }
        else Rows[index] = changed;
        Save();
        RenderRows(index);
        if (!personal) entries.Focus();
    }

    private void Remove()
    {
        int index = entries.SelectedIndex;
        if (index < 0 || MessageBox.Show(this, entries.Text + L.T(" silinsin mi?", " — delete this entry?"), L.T("Kaydı sil", "Delete entry"), MessageBoxButtons.YesNo,
            MessageBoxIcon.Question, MessageBoxDefaultButton.Button2) != DialogResult.Yes) return;
        Data removed = Rows[index];
        Rows.RemoveAt(index);
        if (Save(L.T("Kayıt silindi. Geri almak için Ctrl+Z.", "Entry deleted. Press Ctrl+Z to undo.")))
            lastDeletion[Cv] = new DeletedRecord(Current, index, removed);
        else Rows.Insert(index, removed);
        RenderRows(index);
        if (entries.Enabled) entries.Focus(); else add.Focus();
    }

    private void UndoDelete()
    {
        DeletedRecord deleted;
        if (!lastDeletion.TryGetValue(Cv, out deleted))
        {
            status.Text = L.T("Bu taslakta geri alınacak silme işlemi yok.", "This draft has no deletion to undo.");
            return;
        }

        var rows = (List<Data>)Cv[deleted.Section.Key];
        int index = Math.Min(deleted.Index, rows.Count);
        rows.Insert(index, deleted.Record);
        if (!Save(L.T("Silinen kayıt geri alındı.", "Deleted entry restored.")))
        {
            rows.RemoveAt(index);
            return;
        }

        lastDeletion.Remove(Cv);
        sections.SelectedItem = deleted.Section;
        RenderRows(index);
        entries.Focus();
    }

    private void MoveRow(int direction)
    {
        int index = entries.SelectedIndex, next = index + direction;
        if (index < 0 || next < 0 || next >= Rows.Count) return;
        Data item = Rows[index];
        Rows[index] = Rows[next];
        Rows[next] = item;
        if (!Save())
        {
            Rows[next] = Rows[index];
            Rows[index] = item;
            next = index;
        }
        RenderRows(next);
        entries.Focus();
    }

    private string AskName(string title, string initial)
    {
        using (var dialog = new FieldDialog(title) { Font = Font })
        {
            dialog.Input("name", L.T("&Taslak adı", "&Draft name"), initial, false);
            if (dialog.ShowDialog(this) != DialogResult.OK) return null;
            var values = new Data();
            dialog.CopyTo(values);
            return Model.Value(values, "name").Trim();
        }
    }

    private void NewDraft()
    {
        string name = AskName(L.T("Yeni taslak", "New draft"), L.T("Taslak ", "Draft ") + (documents.Count + 1));
        if (!string.IsNullOrEmpty(name)) AddDraft(name, Model.NewCv());
    }

    private void DuplicateDraft()
    {
        string name = AskName(L.T("Etkin taslağı çoğalt", "Duplicate active draft"), drafts.Text + L.T(" kopyası", " copy"));
        if (string.IsNullOrEmpty(name)) return;
        try { AddDraft(name, Model.CopyCv(Cv), L.T("Taslak çoğaltıldı ve etkinleştirildi.", "Draft duplicated and activated.")); }
        catch (Exception error) { Alert(L.T("Taslak çoğaltılamadı. ", "The draft could not be duplicated. ") + error.Message); }
    }

    private void AddDraft(string name, Data cv, string message = null)
    {
        int previous = active;
        documents.Add(new Data { { "name", name }, { "data", cv } });
        active = documents.Count - 1;
        if (!Save(message) && !loadFailed)
        {
            documents.RemoveAt(active);
            active = previous;
        }
        RenderDrafts();
        RenderRows(0);
        sections.Focus();
    }

    private void Rename()
    {
        string name = AskName(L.T("Taslağı yeniden adlandır", "Rename draft"), drafts.Text);
        if (string.IsNullOrEmpty(name)) return;
        string previous = drafts.Text;
        documents[active]["name"] = name;
        if (!Save()) documents[active]["name"] = previous;
        RenderDrafts();
    }

    private void Import()
    {
        using (var dialog = new OpenFileDialog { Title = L.T("JSON yedeğini aç", "Open JSON backup"), Filter = L.T("JSON yedeği (*.json)|*.json", "JSON backup (*.json)|*.json") })
        {
            if (dialog.ShowDialog(this) != DialogResult.OK) return;
            try { AddDraft(Path.GetFileNameWithoutExtension(dialog.FileName), Model.Normalize(Model.Read(dialog.FileName))); }
            catch (Exception error) { Alert(L.T("Yedek içe aktarılamadı. ", "The backup could not be imported. ") + error.Message); }
        }
    }

    private enum ExportFormat { Json, Text, Word, Pdf }

    private void Export(ExportFormat format)
    {
        using (var dialog = new SaveFileDialog {
            Title = format == ExportFormat.Json ? L.T("JSON yedeğini kaydet", "Save JSON backup") : format == ExportFormat.Word ? L.T("Word belgesini kaydet", "Save Word document") : format == ExportFormat.Pdf ? L.T("PDF dosyasını kaydet", "Save PDF file") : L.T("Düz metin olarak kaydet", "Save as plain text"),
            Filter = format == ExportFormat.Json ? L.T("JSON yedeği (*.json)|*.json", "JSON backup (*.json)|*.json") : format == ExportFormat.Word ? L.T("Word belgesi (*.docx)|*.docx", "Word document (*.docx)|*.docx") : format == ExportFormat.Pdf ? L.T("PDF dosyası (*.pdf)|*.pdf", "PDF file (*.pdf)|*.pdf") : L.T("Düz metin (*.txt)|*.txt", "Plain text (*.txt)|*.txt"),
            FileName = L.T("ozgecmis", "cv")
        })
        {
            if (dialog.ShowDialog(this) != DialogResult.OK) return;
            try
            {
                if (format == ExportFormat.Json)
                {
                    var payload = new Data(Cv) { { "app", "ozgecmis-asistani" }, { "exportedAt", DateTime.UtcNow.ToString("o") } };
                    Model.Write(dialog.FileName, payload);
                }
                else if (format == ExportFormat.Word) WordExport.Save(dialog.FileName, Cv);
                else if (format == ExportFormat.Pdf) PdfExport.Save(dialog.FileName, Cv);
                else Model.AtomicWrite(dialog.FileName, Model.Plain(Cv));
                MessageBox.Show(this, L.T("Dosya kaydedildi.", "File saved."), L.T("Dışa aktarma", "Export"), MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception error) { Alert(L.T("Dosya kaydedilemedi. ", "The file could not be saved. ") + error.Message); }
        }
    }

    private void Preview() { ReadText(L.T("Düz metin önizlemesi", "Plain text preview"), Model.Plain(Cv), true); }

    private void FindInCv()
    {
        string query = "";
        int selected = -1;
        while (true)
        {
            FieldReference target;
            using (var dialog = new SearchDialog(Cv, query, selected) { Font = Font })
            {
                if (dialog.ShowDialog(this) != DialogResult.OK || dialog.SelectedField == null) return;
                target = dialog.SelectedField;
                query = dialog.Query;
                selected = dialog.SelectedIndex;
            }
            GoToField(target);
        }
    }

    private void GoToField(FieldReference target)
    {
        sections.SelectedItem = target.Section;
        if (target.Section.Key != "form") entries.SelectedIndex = target.Row;
        Edit(false, target.Field);
    }

    private void Review()
    {
        Control origin = ActiveControl;
        var container = origin as ContainerControl;
        while (container != null && container.ActiveControl != null)
        {
            origin = container.ActiveControl;
            container = origin as ContainerControl;
        }
        int selected = 0;
        while (true)
        {
            FieldReference target;
            using (var dialog = new ReviewDialog(CvReview.Findings(Cv).ToArray(), selected) { Font = Font })
            {
                if (dialog.ShowDialog(this) != DialogResult.OK || dialog.SelectedFinding == null) break;
                target = dialog.SelectedFinding;
                selected = dialog.SelectedIndex;
            }
            GoToField(target);
        }
        if (origin == null || !origin.Focus()) sections.Focus();
    }

    private void CompareJobPosting()
    {
        string title = L.T("İş ilanı karşılaştırması", "Job posting comparison");
        using (var dialog = new FieldDialog(title, "posting", L.T("&Karşılaştır", "&Compare")) { Font = Font })
        {
            dialog.Note(L.T("İlan metnini yapıştırın. Karşılaştırma bu bilgisayarda yapılır ve ilan kaydedilmez.",
                "Paste the posting. The comparison runs on this computer and the posting is not saved."));
            dialog.Input("posting", L.T("İlan &metni", "Posting &text"), "", true);
            while (dialog.ShowDialog(this) == DialogResult.OK)
            {
                var values = new Data();
                dialog.CopyTo(values);
                string posting = Model.Value(values, "posting");
                if (posting.Length > 30000)
                {
                    Alert(L.T("En fazla 30.000 karakterlik bir ilan metni girin.",
                        "Enter no more than 30,000 characters of posting text."));
                    continue;
                }

                string report = JobMatch.Report(Cv, posting);
                if (report != null)
                {
                    ReadText(title, report, true);
                    return;
                }
                Alert(L.T("Karşılaştırılacak terim bulunamadı. İlan metnini yapıştırın ve yeniden deneyin.",
                    "No terms were found to compare. Paste the posting and try again."));
            }
        }
    }

    private void SuggestSummary()
    {
        string suggested = SummaryDialog.Suggest(this, Cv, ApiKeysPath);
        if (suggested == null) return;
        var form = (Data)Cv["form"];
        object previous;
        bool hadSummary = form.TryGetValue("summary", out previous);
        form["summary"] = suggested;
        if (!Save(L.T("Profesyonel özet kaydedildi.", "Professional summary saved.")))
        {
            if (hadSummary) form["summary"] = previous;
            else form.Remove("summary");
        }
    }

    private void OpenPreferences()
    {
        using (var dialog = new PreferencesDialog(preferences, ApiKeysPath) { Font = Font })
        {
            if (dialog.ShowDialog(this) != DialogResult.OK) return;
            try
            {
                var selected = dialog.SelectedPreferences();
                selected.Save(PreferencesPath);
                ApplyPreferences(selected);
                if (selected.Language != L.Language)
                {
                    MessageBox.Show(this,
                        L.T("Dil değişikliğini uygulamak için programı kapatıp yeniden açın.",
                            "Close and reopen the app to apply the language change."),
                        L.T("Ayarlar", "Settings"), MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
                status.Text = L.T("Ayarlar kaydedildi.", "Settings saved.");
            }
            catch (Exception error) { Alert(L.T("Ayarlar kaydedilemedi. ", "Settings could not be saved. ") + error.Message); }
        }
    }

    private void ApplyPreferences(Preferences selected)
    {
        Font previous = customFont;
        customFont = selected.CreateFont();
        Font = customFont ?? SystemFonts.MessageBoxFont;
        var previousHeading = headingFont;
        headingFont = new Font(Font, Font.Style | FontStyle.Bold);
        sectionsCaption.Font = sectionTitle.Font = headingFont;
        if (previousHeading != null) previousHeading.Dispose();
        if (previous != null) previous.Dispose();
        preferences = selected;

        // Older .NET Framework versions lack WinForms live region support.
        var liveSetting = typeof(Label).GetProperty("LiveSetting");
        if (liveSetting != null)
            liveSetting.SetValue(status, Enum.Parse(liveSetting.PropertyType, selected.Announce ? "Polite" : "Off"), null);
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing && headingFont != null)
        {
            headingFont.Dispose();
            headingFont = null;
        }
        if (disposing && customFont != null)
        {
            customFont.Dispose();
            customFont = null;
        }
    }

    private void Help()
    {
        try
        {
            Directory.CreateDirectory(directory);
            string path = Path.Combine(directory, "kilavuz-" + L.Language + ".html");
            Model.AtomicWrite(path, HtmlGuide.Render(commands));
            Process.Start(new ProcessStartInfo(path) { UseShellExecute = true });
        }
        catch (Exception error)
        {
            Alert(L.T("HTML kılavuzu açılamadı. ", "The HTML guide could not be opened. ") + error.Message);
        }
    }

    private void OpenFeedback()
    {
        string title = L.T("Geri bildirim", "Feedback");
        using (var dialog = new FieldDialog(title, "firstName", L.T("E-posta &taslağı aç", "Open email &draft")) { Font = Font })
        {
            dialog.Note(string.Format(L.T("Mesaj {0} adresine hazırlanır. Taslağı e-posta uygulamanızda inceleyip gönderebilirsiniz.",
                "Your message is addressed to {0}. Review and send the draft in your email application."), FeedbackMessage.Recipient));
            dialog.Input("firstName", L.T("&Ad", "&First name"), "", false);
            dialog.Input("lastName", L.T("&Soyad", "&Last name"), "", false);
            dialog.Input("problem", L.T("Sorun veya &öneri", "Issue or &suggestion"), "", true);
            while (dialog.ShowDialog(this) == DialogResult.OK)
            {
                var values = new Data();
                dialog.CopyTo(values);
                string firstName = Model.Value(values, "firstName");
                string lastName = Model.Value(values, "lastName");
                string problem = Model.Value(values, "problem");
                if (string.IsNullOrWhiteSpace(firstName) || string.IsNullOrWhiteSpace(lastName) || string.IsNullOrWhiteSpace(problem))
                {
                    Alert(L.T("Adınızı, soyadınızı ve sorun veya önerinizi yazın.",
                        "Enter your first name, last name and issue or suggestion."));
                    continue;
                }

                var feedback = new FeedbackMessage(firstName, lastName, problem);
                string uri = feedback.MailUri();
                if (uri != null)
                {
                    try
                    {
                        Process.Start(new ProcessStartInfo(uri) { UseShellExecute = true });
                        return;
                    }
                    catch (System.ComponentModel.Win32Exception) { }
                    catch (InvalidOperationException) { }
                }

                string note = uri == null ?
                    L.T("Mesaj uzun. Taslağı kopyalayıp e-posta uygulamanıza yapıştırabilirsiniz.",
                        "The message is long. Copy the draft and paste it into your email application.") :
                    L.T("E-posta uygulaması açılamadı. Taslağı kopyalayıp e-posta uygulamanıza yapıştırabilirsiniz.",
                        "The email application could not be opened. Copy the draft and paste it into your email application.");
                ReadText(title, feedback.CopyText(), true, note);
                return;
            }
        }
    }

    private async void CheckForUpdates()
    {
        if (checkingUpdates) return;
        checkingUpdates = true;
        string title = L.T("Güncellemeleri denetle", "Check for updates");
        status.Text = L.T("GitHub sürümleri denetleniyor…", "Checking GitHub releases…");
        try
        {
            var update = await ReleaseUpdates.Check();
            if (IsDisposed || Disposing) return;
            if (update == null)
            {
                status.Text = L.T("Bu paket için daha yeni bir masaüstü sürümü bulunamadı.",
                    "No newer desktop release was found for this package.");
                MessageBox.Show(this, status.Text, title, MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }
            status.Text = string.Format(L.T("{0} sürümü indirilebilir.", "Version {0} is available."), update.Version);
            string question = status.Text + Environment.NewLine +
                L.T("Dosyayı şimdi indirmek ister misiniz?", "Would you like to download the file now?");
            if (MessageBox.Show(this, question, title, MessageBoxButtons.YesNo, MessageBoxIcon.Question,
                MessageBoxDefaultButton.Button2) != DialogResult.Yes) return;

            using (var save = new SaveFileDialog {
                Title = L.T("Güncelleme dosyasını kaydet", "Save update file"), FileName = update.Name,
                Filter = AppPaths.Portable ? L.T("Portable ZIP (*.zip)|*.zip", "Portable ZIP (*.zip)|*.zip") :
                    L.T("Kurulum dosyası (*.exe)|*.exe", "Setup file (*.exe)|*.exe")
            })
            {
                if (save.ShowDialog(this) != DialogResult.OK) return;
                status.Text = L.T("Güncelleme indiriliyor…", "Downloading the update…");
                await ReleaseUpdates.Download(update, save.FileName);
            }
            if (IsDisposed || Disposing) return;
            status.Text = L.T("Dosya indirildi ve SHA-256 özeti doğrulandı.", "The file was downloaded and its SHA-256 digest was verified.");
            MessageBox.Show(this, status.Text, title, MessageBoxButtons.OK, MessageBoxIcon.Information);
        }
        catch (Exception error)
        {
            if (IsDisposed || Disposing) return;
            status.Text = L.T("Güncelleme işlemi tamamlanamadı.", "The update operation did not complete.");
            Alert(status.Text + " " + error.Message);
        }
        finally { checkingUpdates = false; }
    }

    private void ReadText(string title, string content, bool allowCopy = false, string note = null)
    {
        using (var dialog = new Form { Text = title, StartPosition = FormStartPosition.CenterParent, ClientSize = new Size(640, 450), AutoScaleMode = AutoScaleMode.Font, Font = Font })
        {
            var text = new TextBox { AccessibleName = title, AccessibleDescription = note, Text = content, ReadOnly = true, Multiline = true, ScrollBars = ScrollBars.Vertical, Dock = DockStyle.Fill, TabIndex = 0 };
            var close = new Button { Text = L.T("&Kapat", "&Close"), DialogResult = DialogResult.Cancel, Dock = DockStyle.Bottom, TabIndex = 1, Height = 36 };
            dialog.Controls.Add(text);
            var actions = new FlowLayoutPanel { Dock = DockStyle.Bottom, AutoSize = true, TabIndex = 1 };
            if (allowCopy)
            {
                ButtonFor(actions, L.T("Tüm metni &kopyala", "&Copy all text"), () =>
                {
                    try
                    {
                        Clipboard.SetText(content, TextDataFormat.UnicodeText);
                        status.Text = L.T("Metin panoya kopyalandı.", "Text copied to the clipboard.");
                        MessageBox.Show(dialog, status.Text, title, MessageBoxButtons.OK, MessageBoxIcon.Information);
                    }
                    catch (System.Runtime.InteropServices.ExternalException)
                    {
                        MessageBox.Show(dialog, L.T("Pano şu anda kullanılamıyor. Yeniden deneyin.",
                            "The clipboard is busy. Try again."), title, MessageBoxButtons.OK, MessageBoxIcon.Error);
                    }
                });
            }
            actions.Controls.Add(close);
            close.Dock = DockStyle.None;
            close.AutoSize = true;
            dialog.Controls.Add(actions);
            if (note != null)
                dialog.Controls.Add(new Label { Text = note, Dock = DockStyle.Top, Height = 48, Padding = new Padding(8) });
            dialog.CancelButton = close;
            dialog.ActiveControl = text;
            text.SelectionStart = 0;
            dialog.ShowDialog(this);
        }
    }

    private void Alert(string message)
    {
        MessageBox.Show(this, message, L.T("Öz Geçmiş Asistanı", "CV Assistant"), MessageBoxButtons.OK, MessageBoxIcon.Error);
    }

    private static Button ButtonFor(Control parent, string text, Action action)
    {
        var button = new Button { Text = text, AutoSize = true, MinimumSize = new Size(0, 32) };
        button.Click += delegate { action(); };
        parent.Controls.Add(button);
        return button;
    }

    private void OpenShortcuts()
    {
        using (var dialog = new ShortcutsDialog(commands) { Font = Font })
        {
            if (dialog.ShowDialog(this) != DialogResult.OK) return;
            try
            {
                Shortcuts.Save(ShortcutsPath, dialog.Assignments);
                ApplyShortcuts(dialog.Assignments);
                status.Text = L.T("Kısayollar kaydedildi.", "Shortcuts saved.");
            }
            catch (Exception error)
            {
                Alert(L.T("Kısayollar kaydedilemedi. ", "Shortcuts could not be saved. ") + error.Message);
            }
        }
    }

    private void ApplyShortcuts(Dictionary<string, Keys> assignments)
    {
        foreach (var command in commands)
            command.Item.ShortcutKeys = assignments[command.Id];
    }

    private void Command(ToolStripMenuItem parent, string id, string text, Keys key, Action action)
    {
        var item = new ToolStripMenuItem(text) { ShortcutKeys = key };
        item.Click += delegate { action(); };
        parent.DropDownItems.Add(item);
        commands.Add(new ShortcutCommand(id, item, key));
    }
}
