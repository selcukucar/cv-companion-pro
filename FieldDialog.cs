using System;
using System.Collections.Generic;
using System.Drawing;
using System.Reflection;
using System.Windows.Forms;
using Data = System.Collections.Generic.Dictionary<string, object>;

[assembly: AssemblyTitle("Öz Geçmiş Asistanı / CV Assistant")]
[assembly: AssemblyVersion("0.12.2.0")]
[assembly: AssemblyInformationalVersion("0.12.2-preview")]

internal sealed class FieldDialog : Form
{
    private readonly TableLayoutPanel fields = new TableLayoutPanel { Dock = DockStyle.Top, AutoSize = true, ColumnCount = 2, Padding = new Padding(12) };
    private readonly Dictionary<string, Control> inputs = new Dictionary<string, Control>();

    public FieldDialog(string title, string initialField = null, string confirmLabel = null)
    {
        Text = title;
        StartPosition = FormStartPosition.CenterParent;
        AutoScaleMode = AutoScaleMode.Font;
        Font = SystemFonts.MessageBoxFont;
        ClientSize = new Size(620, 430);
        MinimumSize = new Size(440, 300);
        ShowInTaskbar = false;
        MinimizeBox = false;
        MaximizeBox = false;
        var scroll = new Panel { Dock = DockStyle.Fill, AutoScroll = true, TabIndex = 0 };
        fields.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 39));
        fields.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 61));
        scroll.Controls.Add(fields);
        var buttons = new FlowLayoutPanel { Dock = DockStyle.Bottom, AutoSize = true, Padding = new Padding(12, 6, 12, 6), TabIndex = 1 };
        var save = new Button { Text = confirmLabel ?? L.T("&Kaydet", "&Save"), DialogResult = DialogResult.OK, AutoSize = true };
        var cancel = new Button { Text = L.T("İ&ptal", "&Cancel"), DialogResult = DialogResult.Cancel, AutoSize = true };
        buttons.Controls.Add(save);
        buttons.Controls.Add(cancel);
        Controls.Add(scroll);
        Controls.Add(buttons);
        AcceptButton = save;
        CancelButton = cancel;
        Shown += delegate
        {
            Control target;
            if (initialField != null && inputs.TryGetValue(initialField, out target) && target.Focus()) return;
            SelectNextControl(null, true, true, true, true);
        };
    }

    public void Input(string key, string label, string value, bool multiline, bool password = false)
    {
        int row = fields.RowCount++;
        var input = new TextBox {
            AccessibleName = label.Replace("&", ""), AccessibleDescription = fields.AccessibleDescription, Multiline = multiline, AcceptsReturn = multiline, UseSystemPasswordChar = password,
            Text = value.Replace("\r\n", "\n").Replace("\n", "\r\n"),
            Dock = DockStyle.Fill, TabIndex = row * 2 + 1
        };
        if (multiline)
        {
            input.Height = 77;
            input.ScrollBars = ScrollBars.Vertical;
        }
        fields.Controls.Add(new Label { Text = label, AutoSize = true, Anchor = AnchorStyles.Left, TabIndex = row * 2 }, 0, row);
        fields.Controls.Add(input, 1, row);
        inputs.Add(key, input);
    }

    public void Choice(string key, string label, string[] options)
    {
        int row = fields.RowCount++;
        var input = new ComboBox {
            AccessibleName = label.Replace("&", ""), AccessibleDescription = fields.AccessibleDescription,
            DropDownStyle = ComboBoxStyle.DropDownList, Dock = DockStyle.Fill, TabIndex = row * 2 + 1
        };
        input.Items.AddRange(options);
        input.SelectedIndex = 0;
        fields.Controls.Add(new Label { Text = label, AutoSize = true, Anchor = AnchorStyles.Left, TabIndex = row * 2 }, 0, row);
        fields.Controls.Add(input, 1, row);
        inputs.Add(key, input);
    }

    public void Note(string text)
    {
        int row = fields.RowCount++;
        var label = new Label { Text = text, AutoSize = true, MaximumSize = new Size(540, 0) };
        fields.Controls.Add(label, 0, row);
        fields.SetColumnSpan(label, 2);
        fields.AccessibleDescription = text;
    }

    public void Flag(string key, string label, bool value)
    {
        int row = fields.RowCount++;
        var flag = new CheckBox { Text = label, Checked = value, AutoSize = true, TabIndex = row * 2 };
        fields.Controls.Add(flag, 0, row);
        fields.SetColumnSpan(flag, 2);
        inputs.Add(key, flag);
    }

    public void CopyTo(Data target)
    {
        foreach (var field in inputs)
        {
            var flag = field.Value as CheckBox;
            target[field.Key] = flag == null ? (object)field.Value.Text : flag.Checked;
        }
    }
}