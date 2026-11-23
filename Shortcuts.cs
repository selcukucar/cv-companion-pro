using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Windows.Forms;
using Data = System.Collections.Generic.Dictionary<string, object>;

internal sealed class ShortcutCommand
{
    public readonly string Id;
    public readonly ToolStripMenuItem Item;
    public readonly Keys Default;
    public string Name { get { return Item.Text.Replace("&", "").TrimEnd('…'); } }

    public ShortcutCommand(string id, ToolStripMenuItem item, Keys shortcut)
    {
        Id = id;
        Item = item;
        Default = shortcut;
    }
}

internal static class Shortcuts
{
    public static Dictionary<string, Keys> Load(string path, IList<ShortcutCommand> commands)
    {
        var result = commands.ToDictionary(command => command.Id, command => command.Default);
        if (!File.Exists(path)) return result;

        var saved = Model.Read(path) as Data;
        if (saved == null) throw new InvalidDataException();
        foreach (var command in commands)
        {
            int encoded;
            if (!saved.ContainsKey(command.Id)) continue;
            if (!int.TryParse(Model.Value(saved, command.Id), out encoded) || !IsAllowed((Keys)encoded))
                throw new InvalidDataException();
            result[command.Id] = (Keys)encoded;
        }
        var assigned = result.Values.Where(key => key != Keys.None).ToArray();
        if (assigned.Length != assigned.Distinct().Count()) throw new InvalidDataException();
        return result;
    }

    public static void Save(string path, Dictionary<string, Keys> assignments)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(path));
        Model.Write(path, assignments.ToDictionary(pair => pair.Key, pair => (object)(int)pair.Value));
    }

    public static string Format(Keys keys)
    {
        if (keys == Keys.None) return "";
        string value = new KeysConverter().ConvertToInvariantString(keys);
        return value.Replace("Control+", "Ctrl+").Replace("Oemcomma", "Comma");
    }

    public static bool TryParse(string value, out Keys keys)
    {
        keys = Keys.None;
        value = value.Trim();
        if (value.Length == 0) return true;
        if (value.EndsWith(",") || value.EndsWith("+Comma", StringComparison.OrdinalIgnoreCase))
            value = value.Substring(0, value.LastIndexOf('+') + 1) + "Oemcomma";
        try { keys = (Keys)new KeysConverter().ConvertFromInvariantString(value); }
        catch (ArgumentException) { return false; }
        catch (FormatException) { return false; }
        catch (NotSupportedException) { return false; }
        return keys != Keys.None && IsAllowed(keys);
    }

    private static bool IsAllowed(Keys keys)
    {
        if (keys == Keys.None) return true;
        Keys key = keys & Keys.KeyCode;
        Keys modifiers = keys & Keys.Modifiers;
        bool function = key >= Keys.F1 && key <= Keys.F24;
        bool character = (key >= Keys.A && key <= Keys.Z) || (key >= Keys.D0 && key <= Keys.D9) ||
            key == Keys.Oemcomma || key == Keys.OemPeriod;
        if ((modifiers & ~(Keys.Control | Keys.Alt | Keys.Shift)) != 0 ||
            keys == (Keys.Alt | Keys.F4)) return false;
        return function || (character && (modifiers & (Keys.Control | Keys.Alt)) != 0);
    }
}

internal sealed class ShortcutsDialog : Form
{
    private readonly ListBox list = new ListBox { Dock = DockStyle.Fill, IntegralHeight = false, HorizontalScrollbar = true };
    private readonly TextBox input = new TextBox { Dock = DockStyle.Fill };
    private readonly IList<ShortcutCommand> commands;
    public readonly Dictionary<string, Keys> Assignments;

    public ShortcutsDialog(IList<ShortcutCommand> commands)
    {
        this.commands = commands;
        Assignments = commands.ToDictionary(command => command.Id, command => command.Item.ShortcutKeys);
        Text = L.T("Klavye kısayolları", "Keyboard shortcuts");
        StartPosition = FormStartPosition.CenterParent;
        ShowInTaskbar = false;
        AutoScaleMode = AutoScaleMode.Font;
        ClientSize = new System.Drawing.Size(760, 455);
        MinimumSize = new System.Drawing.Size(500, 350);
        var layout = new TableLayoutPanel { Dock = DockStyle.Fill, Padding = new Padding(14), ColumnCount = 1, RowCount = 5 };
        layout.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        layout.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        layout.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        layout.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        layout.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        string tip = L.T("Bir komut seçin. Kısayol alanına Ctrl+Shift+P veya F8 gibi bir tuş yazın. Kısayolu kaldırmak için alanı boş bırakın.",
            "Choose a command. Type a shortcut such as Ctrl+Shift+P or F8. To remove its shortcut, leave the field blank.");
        list.AccessibleName = L.T("Komutlar ve kısayollar", "Commands and shortcuts");
        list.AccessibleDescription = tip;
        input.AccessibleName = L.T("Kısayol", "Shortcut");
        var apply = new Button { Text = L.T("Kısayolu &değiştir", "&Change shortcut"), AutoSize = true };
        var reset = new Button { Text = L.T("&Varsayılanlara dön", "Restore &defaults"), AutoSize = true };
        var save = new Button { Text = L.T("&Kaydet", "&Save"), AutoSize = true };
        var cancel = new Button { Text = L.T("İ&ptal", "C&ancel"), AutoSize = true, DialogResult = DialogResult.Cancel };
        var buttons = new FlowLayoutPanel { Dock = DockStyle.Fill, AutoSize = true };
        buttons.Controls.Add(apply);
        buttons.Controls.Add(reset);
        buttons.Controls.Add(save);
        buttons.Controls.Add(cancel);
        var instructions = new Label { Text = tip, AutoSize = true, Dock = DockStyle.Fill };
        layout.Controls.Add(instructions, 0, 0);
        layout.SizeChanged += delegate
        {
            instructions.MaximumSize = new System.Drawing.Size(System.Math.Max(200, layout.DisplayRectangle.Width - 6), 0);
        };
        layout.Controls.Add(list, 0, 1);
        layout.Controls.Add(new Label { Text = L.T("Kı&sayol", "S&hortcut"), AutoSize = true }, 0, 2);
        layout.Controls.Add(input, 0, 3);
        layout.Controls.Add(buttons, 0, 4);
        Controls.Add(layout);

        list.SelectedIndexChanged += delegate
        {
            if (list.SelectedIndex >= 0) input.Text = Shortcuts.Format(Assignments[commands[list.SelectedIndex].Id]);
        };
        apply.Click += delegate { ApplySelected(); };
        input.KeyDown += delegate(object sender, KeyEventArgs args)
        {
            if (args.KeyData != Keys.Enter) return;
            args.SuppressKeyPress = true;
            ApplySelected();
        };
        save.Click += delegate { if (ApplySelected()) DialogResult = DialogResult.OK; };
        reset.Click += delegate
        {
            foreach (var command in commands) Assignments[command.Id] = command.Default;
            Populate(list.SelectedIndex);
        };
        CancelButton = cancel;
        Populate(0);
        Shown += delegate { list.Focus(); };
    }

    private string Row(ShortcutCommand command)
    {
        string shortcut = Shortcuts.Format(Assignments[command.Id]);
        return command.Name + " — " + (shortcut.Length > 0 ? shortcut : L.T("Kısayol yok", "No shortcut"));
    }

    private void Populate(int index)
    {
        list.Items.Clear();
        foreach (var command in commands) list.Items.Add(Row(command));
        list.SelectedIndex = Math.Max(0, index);
        input.Text = Shortcuts.Format(Assignments[commands[list.SelectedIndex].Id]);
    }

    private bool ApplySelected()
    {
        int index = list.SelectedIndex;
        var command = commands[index];
        Keys keys;
        if (!Shortcuts.TryParse(input.Text, out keys))
        {
            MessageBox.Show(this, L.T("F1–F24 veya Ctrl ya da Alt ile birlikte bir harf ya da rakam kullanın. Örnek: Ctrl+Shift+P.",
                "Use F1–F24 or combine Ctrl or Alt with a letter or number. Example: Ctrl+Shift+P."),
                Text, MessageBoxButtons.OK, MessageBoxIcon.Information);
            input.Focus();
            return false;
        }
        var conflict = keys == Keys.None ? null : commands.FirstOrDefault(other => other != command && Assignments[other.Id] == keys);
        if (conflict != null)
        {
            MessageBox.Show(this, string.Format(L.T("{0} zaten {1} komutuna atanmış.", "{0} is already assigned to {1}."),
                Shortcuts.Format(keys), conflict.Name), Text, MessageBoxButtons.OK, MessageBoxIcon.Information);
            input.Focus();
            return false;
        }
        Assignments[command.Id] = keys;
        list.Items[index] = Row(command);
        input.Text = Shortcuts.Format(keys);
        return true;
    }
}
