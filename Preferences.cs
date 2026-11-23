using System;
using System.Drawing;
using System.IO;
using System.Windows.Forms;
using Data = System.Collections.Generic.Dictionary<string, object>;

internal sealed class Preferences
{
    public static string[] TextSizes { get { return new[] { L.T("Windows varsayılanı", "Windows default"), L.T("Büyük", "Large"), L.T("Çok büyük", "Extra large") }; } }
    public int TextSize;
    public bool Announce = true;
    public string Language = "tr";

    public static Preferences Load(string path)
    {
        var preferences = new Preferences();
        if (!File.Exists(path)) return preferences;
        var data = Model.Read(path) as Data;
        if (data == null) throw new InvalidDataException(L.T("Ayar dosyasının biçimi geçersiz.", "The settings file format is invalid."));
        int size;
        if (int.TryParse(Model.Value(data, "textSize"), out size) && size >= 0 && size < TextSizes.Length)
            preferences.TextSize = size;
        if (Model.Get(data, "announce") is bool) preferences.Announce = (bool)data["announce"];
        preferences.Language = Model.Value(data, "language") == "en" ? "en" : "tr";
        return preferences;
    }

    public void Save(string path)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(path));
        Model.Write(path, new Data { { "textSize", TextSize }, { "announce", Announce }, { "language", Language } });
    }

    public Font CreateFont()
    {
        Font font = SystemFonts.MessageBoxFont;
        return TextSize == 0 ? null : new Font(font.FontFamily,
            font.SizeInPoints * (TextSize == 1 ? 1.15f : 1.30f), font.Style);
    }
}

internal sealed class PreferencesDialog : Form
{
    private readonly ComboBox size = new ComboBox {
        DropDownStyle = ComboBoxStyle.DropDownList, AccessibleName = L.T("Yazı boyutu", "Text size"), Dock = DockStyle.Fill
    };
    private readonly ComboBox language = new ComboBox {
        DropDownStyle = ComboBoxStyle.DropDownList, AccessibleName = L.T("Uygulama dili", "App language"), Dock = DockStyle.Fill
    };
    private readonly CheckBox announce = new CheckBox { Text = L.T("Otomatik durum &duyuruları", "Automatic status &announcements"), AutoSize = true };

    public PreferencesDialog(Preferences preferences, string keysPath)
    {
        Text = L.T("Ayarlar", "Settings");
        StartPosition = FormStartPosition.CenterParent;
        ShowInTaskbar = false;
        AutoSize = true;
        AutoSizeMode = AutoSizeMode.GrowAndShrink;
        MinimumSize = new Size(430, 200);
        AutoScaleMode = AutoScaleMode.Font;
        Font = SystemFonts.MessageBoxFont;
        var layout = new TableLayoutPanel { Dock = DockStyle.Fill, AutoSize = true, ColumnCount = 1, Padding = new Padding(14) };
        size.Items.AddRange(Preferences.TextSizes);
        size.SelectedIndex = preferences.TextSize;
        language.Items.AddRange(new[] { "Türkçe", "English" });
        language.SelectedIndex = preferences.Language == "en" ? 1 : 0;
        announce.Checked = preferences.Announce;
        var save = new Button { Text = L.T("&Kaydet", "&Save"), AutoSize = true, DialogResult = DialogResult.OK };
        var cancel = new Button { Text = L.T("İ&ptal", "&Cancel"), AutoSize = true, DialogResult = DialogResult.Cancel };
        var actions = new FlowLayoutPanel { AutoSize = true, Dock = DockStyle.Fill };
        actions.Controls.Add(save);
        actions.Controls.Add(cancel);
        layout.Controls.Add(new Label { Text = L.T("&Yazı boyutu", "&Text size"), AutoSize = true });
        layout.Controls.Add(size);
        layout.Controls.Add(new Label { Text = L.T("Uygulama &dili", "App &language"), AutoSize = true });
        layout.Controls.Add(language);
        layout.Controls.Add(announce);
        layout.Controls.Add(new Label { Text = L.T("Uygulama Windows’un sistem renklerini kullanır.", "The app uses Windows system colors."), AutoSize = true });
        var providers = new Button {
            Text = L.T("Yapay zekâ &sağlayıcıları…", "AI &providers…"), AutoSize = true
        };
        providers.Click += delegate { ApiKeys.Edit(this, keysPath); };
        layout.Controls.Add(providers);
        layout.Controls.Add(actions);
        Controls.Add(layout);
        AcceptButton = save;
        CancelButton = cancel;
        Shown += delegate { size.Focus(); };
    }

    public Preferences SelectedPreferences()
    {
        return new Preferences { TextSize = size.SelectedIndex, Announce = announce.Checked, Language = language.SelectedIndex == 1 ? "en" : "tr" };
    }
}