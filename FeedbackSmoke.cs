using System;
using System.Linq;
using System.Windows.Forms;

internal static class ReleaseSmoke
{
    [STAThread]
    static void Main()
    {
        var message = new FeedbackMessage("Çağrı", "Örnek", "Satır bir.\nSatır iki: A&B? #1");
        string uri = message.MailUri();
        if (!uri.StartsWith("mailto:info@selcukucar.com?subject=") ||
            !Uri.UnescapeDataString(uri.Split(new[] { "&body=" }, StringSplitOptions.None)[1]).Contains("Satır bir.\r\nSatır iki: A&B? #1"))
            throw new Exception("Recipient or encoding.");
        Application.EnableVisualStyles();
        using (var editor = new Editor())
        using (var timer = new Timer { Interval = 80 })
        {
            int step = 0;
            Exception failure = null;
            timer.Tick += delegate
            {
                var dialog = Application.OpenForms.Cast<Form>().FirstOrDefault(f => f != editor);
                if (dialog == null) return;
                try
                {
                    if (step == 0 && dialog is FieldDialog)
                    {
                        var panel = dialog.Controls.OfType<Panel>().First(p => p.AutoScroll);
                        var fields = panel.Controls.OfType<TableLayoutPanel>().Single().Controls.OfType<TextBox>().ToList();
                        if (fields.Count != 3 || !fields[0].Focused) throw new Exception("Feedback form focus.");
                        fields[0].Text = "Çağrı";
                        fields[1].Text = "Örnek";
                        fields[2].Text = new string('x', 4100);
                        step++;
                        ((Button)dialog.AcceptButton).PerformClick();
                    }
                    else if (step == 1 && !(dialog is FieldDialog))
                    {
                        var body = dialog.Controls.OfType<TextBox>().Single();
                        if (!body.Focused || !body.Text.Contains("info@selcukucar.com") || !body.Text.Contains("Çağrı"))
                            throw new Exception("Long message fallback.");
                        step++;
                        dialog.DialogResult = DialogResult.Cancel;
                    }
                }
                catch (Exception error) { failure = error; dialog.DialogResult = DialogResult.Cancel; }
            };
            editor.Show();
            timer.Start();
            var command = editor.MainMenuStrip.Items.OfType<ToolStripMenuItem>()
                .SelectMany(menu => menu.DropDownItems.OfType<ToolStripMenuItem>()).Single(item => item.Text == "&Geri bildirim…");
            command.PerformClick();
            timer.Stop();
            if (failure != null) throw failure;
            if (step != 2) throw new Exception("Feedback form did not complete.");
        }
        Console.WriteLine("Feedback fields, recipient, Turkish text encoding and long-message copy fallback passed.");
    }
}
