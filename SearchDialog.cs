using System;
using System.Drawing;
using System.Windows.Forms;
using Data = System.Collections.Generic.Dictionary<string, object>;

internal sealed class SearchDialog : Form
{
    private const int VisibleLimit = 200;
    private readonly TextBox query = new TextBox { Dock = DockStyle.Fill };
    private readonly ListBox matches = new ListBox { Dock = DockStyle.Fill, IntegralHeight = false, HorizontalScrollbar = true };
    private readonly Button go;
    private readonly Label count = new Label { AutoSize = true };

    public FieldReference SelectedField { get { return matches.SelectedItem as FieldReference; } }
    public int SelectedIndex { get { return matches.SelectedIndex; } }
    public string Query { get { return query.Text; } }

    public SearchDialog(Data cv, string previousQuery, int selected)
    {
        Text = L.T("CV’de ara", "Find in CV");
        Font = SystemFonts.MessageBoxFont;
        AutoScaleMode = AutoScaleMode.Font;
        StartPosition = FormStartPosition.CenterParent;
        ShowInTaskbar = false;
        ClientSize = new Size(770, 440);
        MinimumSize = new Size(510, 340);
        var layout = new TableLayoutPanel {
            Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 6, Padding = new Padding(12)
        };
        for (int i = 0; i < 4; i++) layout.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        layout.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        layout.RowStyles.Add(new RowStyle(SizeType.AutoSize));

        query.Text = previousQuery;
        query.AccessibleName = L.T("Aranacak metin", "Search text");
        query.AccessibleDescription = L.T("Alan adı veya yazdığınız bir bilgiyi girin. Aramak için Enter’a basın.",
            "Enter a field name or text you wrote. Press Enter to search.");
        matches.AccessibleName = L.T("Arama sonuçları", "Search results");
        go = new Button {
            Text = L.T("İlgili alana &git", "&Go to field"), AutoSize = true, DialogResult = DialogResult.OK, Enabled = false
        };
        var search = new Button { Text = L.T("&Ara", "&Search"), AutoSize = true };
        var close = new Button { Text = L.T("&Kapat", "&Close"), AutoSize = true, DialogResult = DialogResult.Cancel };
        var buttons = new FlowLayoutPanel { AutoSize = true, Dock = DockStyle.Fill };
        buttons.Controls.Add(go);
        buttons.Controls.Add(close);
        layout.Controls.Add(new Label { Text = L.T("Aranacak &metin", "Search &text"), AutoSize = true }, 0, 0);
        layout.Controls.Add(query, 0, 1);
        layout.Controls.Add(search, 0, 2);
        layout.Controls.Add(count, 0, 3);
        layout.Controls.Add(matches, 0, 4);
        layout.Controls.Add(buttons, 0, 5);
        Controls.Add(layout);

        CancelButton = close;
        AcceptButton = search;
        matches.Enabled = false;
        matches.Enter += delegate { AcceptButton = go; };
        matches.Leave += delegate { AcceptButton = search; };
        matches.DoubleClick += delegate { go.PerformClick(); };
        query.TextChanged += delegate
        {
            matches.Items.Clear();
            matches.Enabled = false;
            go.Enabled = false;
            count.Text = "";
        };
        search.Click += delegate
        {
            if (!RefreshResults(cv, 0))
            {
                MessageBox.Show(this, count.Text, Text, MessageBoxButtons.OK, MessageBoxIcon.Information);
                query.Focus();
            }
            else matches.Focus();
        };
        Shown += delegate
        {
            if (selected >= 0 && RefreshResults(cv, selected)) matches.Focus();
            else query.Focus();
        };
    }

    private bool RefreshResults(Data cv, int selected)
    {
        var results = CvSearch.Find(cv, Query);
        matches.Items.Clear();
        int shown = Math.Min(results.Length, VisibleLimit);
        for (int i = 0; i < shown; i++) matches.Items.Add(results[i]);
        count.Text = results.Length > VisibleLimit ?
            string.Format(L.T("{0} sonuçtan ilk {1} tanesi gösteriliyor.", "Showing the first {1} of {0} results."), results.Length, shown) :
            string.Format(L.T("{0} sonuç", results.Length == 1 ? "{0} result" : "{0} results"), results.Length);
        matches.AccessibleDescription = count.Text + L.T(" Ok tuşlarıyla seçin, Enter ile alana gidin.",
            " Use the arrow keys to select a result. Press Enter to go to its field.");
        go.Enabled = matches.Enabled = shown > 0;
        if (shown > 0) matches.SelectedIndex = Math.Min(selected, shown - 1);
        return shown > 0;
    }
}
