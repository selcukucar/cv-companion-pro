using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Security.Cryptography;
using System.Windows.Forms;
using System.Web.Script.Serialization;
using Data = System.Collections.Generic.Dictionary<string, object>;

internal static class ReleaseSmoke
{
    private const BindingFlags Private = BindingFlags.NonPublic | BindingFlags.Instance;

    [STAThread]
    static void Main(string[] args)
    {
        string root = args[0];
        if (args.Length > 1 && args[1] == "x86" && Environment.Is64BitProcess)
            throw new Exception("The x86 test unexpectedly ran as a 64-bit process.");
        VerifyUpdates(root);
        if (!AppPaths.Portable || !AppPaths.Data.StartsWith(AppDomain.CurrentDomain.BaseDirectory, StringComparison.OrdinalIgnoreCase) ||
            AppPaths.ApiKeys.StartsWith(AppPaths.Data, StringComparison.OrdinalIgnoreCase))
            throw new Exception("Portable data separation failed.");

        Application.EnableVisualStyles();
        using (var editor = new Editor())
        {
            editor.Show();
            RunWithDialog<FieldDialog>(editor, Command(editor, Keys.Control | Keys.N).PerformClick,
                dialog => SetAndSave(dialog, "Taslak adı", "Yayıma hazırlık"));
            RunWithDialog<FieldDialog>(editor, () => typeof(Editor).GetMethod("Edit", Private).Invoke(editor, new object[] { false, null }),
                dialog => SetAndSave(dialog, "Ad soyad", "Çağrı Örnek"));

            int stage = 0;
            RunWithDialog<Form>(editor, Command(editor, Keys.F7).PerformClick, dialog =>
            {
                if (stage == 0 && dialog is ReviewDialog)
                {
                    stage++;
                    var review = (ReviewDialog)dialog;
                    if (review.SelectedFinding.Field != "email") throw new Exception("Expected missing contact.");
                    typeof(Form).GetMethod("ProcessDialogKey", Private).Invoke(review, new object[] { Keys.Enter });
                }
                else if (stage == 1 && dialog is FieldDialog)
                {
                    stage++;
                    var focused = Inputs(dialog).Single(field => field.Focused);
                    if (focused.AccessibleName != "E-posta") throw new Exception("Review did not focus email.");
                    SetAndSave((FieldDialog)dialog, "E-posta", "ornek@example.com");
                }
                else if (stage == 2 && dialog is ReviewDialog)
                {
                    stage++;
                    if (((ReviewDialog)dialog).SelectedFinding != null) throw new Exception("Review was not refreshed.");
                    dialog.DialogResult = DialogResult.Cancel;
                }
            }, 3);
            if (stage != 3) throw new Exception("Review flow incomplete.");

            var library = Model.Read(Path.Combine(AppPaths.Data, "taslaklar.json")) as Data;
            var drafts = (object[])library["drafts"];
            var cv = Model.Normalize(((Data)drafts[1])["data"]);
            string backup = Path.Combine(root, "backup-smoke.json");
            Model.Write(backup, cv);
            var restored = Model.Normalize(Model.Read(backup));
            if (!Model.Plain(restored).Contains("ornek@example.com") || Model.Name(restored) != "Çağrı Örnek")
                throw new Exception("Backup round trip.");
            ((Data)restored["form"])["title"] = "Ürün Uzmanı";
            ((Data)restored["form"])["summary"] = "Dijital ürünlerin klavye ve ekran okuyucuyla kullanımını test eder.";
            ((Data)restored["form"])["skills"] = "Erişilebilirlik, NVDA, Jira";
            ((List<Data>)restored["experiences"]).Add(new Data {
                { "position", "Erişilebilirlik Uzmanı" }, { "company", "Örnek Teknoloji" },
                { "startDate", "2021" }, { "endDate", "2025" }, { "description", "Erişilebilirlik bulgularını raporladı ve düzeltmeleri doğruladı." }
            });
            WordExport.Save(Path.Combine(root, "example.docx"), restored);
            PdfExport.Save(Path.Combine(root, "example.pdf"), restored);
        }
        Console.WriteLine("Portable isolation, form editing, F7 focus, backup round trip, exports and update integrity passed.");
    }

    private static ToolStripMenuItem Command(Editor editor, Keys shortcut)
    {
        return editor.MainMenuStrip.Items.OfType<ToolStripMenuItem>()
            .SelectMany(menu => menu.DropDownItems.OfType<ToolStripMenuItem>()).Single(item => item.ShortcutKeys == shortcut);
    }

    private static IEnumerable<TextBox> Inputs(Form form)
    {
        return form.Controls.OfType<Panel>().First(panel => panel.AutoScroll)
            .Controls.OfType<TableLayoutPanel>().Single().Controls.OfType<TextBox>();
    }

    private static void SetAndSave(FieldDialog form, string label, string value)
    {
        Inputs(form).Single(input => input.AccessibleName == label).Text = value;
        ((Button)form.AcceptButton).PerformClick();
    }

    private static void RunWithDialog<T>(Editor editor, Action open, Action<T> next, int steps = 1) where T : Form
    {
        Exception error = null;
        int remaining = steps;
        using (var timer = new Timer { Interval = 70 })
        {
            timer.Tick += delegate
            {
                var dialog = Application.OpenForms.OfType<T>().FirstOrDefault(window => window != editor);
                if (dialog == null) return;
                try
                {
                    if (--remaining < 0) throw new Exception("Unexpected test dialog.");
                    next(dialog);
                }
                catch (Exception failure)
                {
                    error = failure;
                    dialog.DialogResult = DialogResult.Cancel;
                }
            };
            timer.Start();
            open();
            timer.Stop();
        }
        if (error != null) throw error;
        if (remaining != 0) throw new Exception("A test dialog was not reached.");
    }

    private static void VerifyUpdates(string root)
    {
        byte[] payload = new byte[] { 10, 20, 30 };
        string digest;
        using (var sha = SHA256.Create()) digest = BitConverter.ToString(sha.ComputeHash(payload)).Replace("-", "");
        var assets = new[] { "setup.exe", "portable.zip" }.Select(suffix =>
        {
            string name = "OzgecmisAsistani-0.13.0-" + suffix;
            return new Data {
                { "name", name }, { "digest", "sha256:" + digest },
                { "browser_download_url", ReleaseUpdates.Repository + "/releases/download/desktop-v0.13.0/" + name }
            };
        }).ToArray();
        var feed = new JavaScriptSerializer().Serialize(new[] {
            new Data { {"tag_name","v4.1.0"}, {"assets",assets} },
            new Data { {"tag_name","desktop-v0.13.0"}, {"assets",assets} }
        });
        var update = ReleaseUpdates.Find(feed, new Version(0, 12, 0), true);
        if (update == null || !update.Name.EndsWith("-portable.zip")) throw new Exception("Portable update selection.");
        var setup = ReleaseUpdates.Find(feed, new Version(0, 12, 0), false);
        if (setup == null || !setup.Name.EndsWith("-setup.exe")) throw new Exception("Setup update selection.");
        if (ReleaseUpdates.Find(feed, new Version(0, 13, 0), true) != null) throw new Exception("Old releases were accepted.");
        string file = Path.Combine(root, "verified-update.bin");
        ReleaseUpdates.SaveVerified(update, file, payload);
        try
        {
            ReleaseUpdates.SaveVerified(update, file, new byte[] { 99 });
            throw new Exception("Bad digest accepted.");
        }
        catch (InvalidDataException) { }
        if (!File.ReadAllBytes(file).SequenceEqual(payload)) throw new Exception("Verified file was overwritten.");
    }
}
