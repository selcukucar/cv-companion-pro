using System;
using System.Drawing;
using System.Windows.Forms;

internal sealed class ReviewDialog : Form
{
    public FieldReference SelectedFinding { get { return (FieldReference)findings.SelectedItem; } }
    public int SelectedIndex { get { return findings.SelectedIndex; } }

    private readonly ListBox findings = new ListBox {
        Dock = DockStyle.Fill, HorizontalScrollbar = true, IntegralHeight = false
    };

    public ReviewDialog(FieldReference[] items, int selected)
    {
        Text = L.T("CV denetimi", "CV review");
        StartPosition = FormStartPosition.CenterParent;
        ShowInTaskbar = false;
        Font = SystemFonts.MessageBoxFont;
        AutoScaleMode = AutoScaleMode.Font;
        ClientSize = new Size(760, 420);
        MinimumSize = new Size(510, 350);
        var layout = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 5, Padding = new Padding(12) };
        layout.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        layout.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        layout.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 80));
        layout.RowStyles.Add(new RowStyle(SizeType.AutoSize));

        string count = items.Length == 0 ? L.T("Kontrol edilen alanlarda sorun bulunmadı.", "No issues were found in the checked fields.") : string.Format(L.T("{0} bulgu", items.Length == 1 ? "{0} finding" : "{0} findings"), items.Length);
        findings.AccessibleName = L.T("Denetim bulguları", "Review findings");
        findings.AccessibleDescription = count + L.T(". Ok tuşlarıyla seçin, Enter ile ilgili alana gidin.", ". Use the arrow keys to select a finding and Enter to go to its field.");
        findings.Items.AddRange(items);
        findings.Enabled = items.Length > 0;
        if (items.Length > 0) findings.SelectedIndex = Math.Min(selected, items.Length - 1);

        var notes = new TextBox {
            AccessibleName = items.Length == 0 ? count + L.T(" Çıktı erişilebilirliği", " Export accessibility") : L.T("Çıktı erişilebilirliği", "Export accessibility"),
            Text = CvReview.OutputNotes, ReadOnly = true, Multiline = true,
            ScrollBars = ScrollBars.Vertical, Dock = DockStyle.Fill
        };
        var go = new Button { Text = L.T("İlgili alana &git", "&Go to field"), AutoSize = true, DialogResult = DialogResult.OK, Enabled = findings.Enabled };
        var close = new Button { Text = L.T("&Kapat", "&Close"), AutoSize = true, DialogResult = DialogResult.Cancel };
        var buttons = new FlowLayoutPanel { AutoSize = true, Dock = DockStyle.Fill };
        buttons.Controls.Add(go);
        buttons.Controls.Add(close);
        layout.Controls.Add(new Label { Text = count, AutoSize = true }, 0, 0);
        layout.Controls.Add(findings, 0, 1);
        layout.Controls.Add(new Label { Text = L.T("Çıktı erişilebilirliği", "Export accessibility"), AutoSize = true }, 0, 2);
        layout.Controls.Add(notes, 0, 3);
        layout.Controls.Add(buttons, 0, 4);
        Controls.Add(layout);

        AcceptButton = findings.Enabled ? go : close;
        CancelButton = close;
        findings.DoubleClick += delegate { go.PerformClick(); };
        Shown += delegate { if (findings.Enabled) findings.Focus(); else notes.Focus(); };
    }
}