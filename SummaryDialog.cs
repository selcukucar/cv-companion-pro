using System;
using System.Linq;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using Data = System.Collections.Generic.Dictionary<string, object>;

internal static class SummaryDialog
{
    public static string Suggest(Form owner, Data cv, string keysPath)
    {
        string title = L.T("Yapay zekâ ile özet öner", "Suggest summary with AI");
        ApiKeys keys;
        try { keys = ApiKeys.Load(keysPath); }
        catch (Exception)
        {
            MessageBox.Show(owner, L.T("Kayıtlı API anahtarları açılamadı.", "The saved API keys could not be opened."),
                title, MessageBoxButtons.OK, MessageBoxIcon.Error);
            return null;
        }
        var providers = ApiKeys.Providers.Where(name => keys.Get(name).Length > 0).ToArray();
        if (providers.Length == 0)
        {
            MessageBox.Show(owner, L.T("Önce Ayarlar → Yapay zekâ sağlayıcıları bölümünden OpenAI veya Gemini anahtarı ekleyin.",
                "First add an OpenAI or Gemini key under Settings → AI providers."),
                title, MessageBoxButtons.OK, MessageBoxIcon.Information);
            return null;
        }

        string provider, text;
        using (var dialog = new FieldDialog(title, providers.Length > 1 ? "provider" : "notes", L.T("&Gönder", "&Send")) { Font = owner.Font })
        {
            dialog.Note(L.T(
                "Seçilen sağlayıcıya aşağıdaki metin ve özet oluşturma talimatı gönderilir. Metni inceleyin ve kişisel bilgileri çıkarın. API kullanımı ücretli olabilir.",
                "The selected provider receives the text below and instructions to draft a summary. Review the text and remove personal information. API usage may incur charges."));
            dialog.Choice("provider", L.T("&Sağlayıcı", "&Provider"), providers);
            dialog.Input("notes", L.T("Gönderilecek &metin", "&Text to send"), AiSummary.DraftInput(cv), true);
            if (dialog.ShowDialog(owner) != DialogResult.OK) return null;
            var values = new Data();
            dialog.CopyTo(values);
            text = Model.Value(values, "notes").Trim();
            provider = Model.Value(values, "provider");
        }
        if (text.Length == 0 || text.Length > 6000)
        {
            MessageBox.Show(owner, L.T("En fazla 6.000 karakterlik bir metin girin.", "Enter text up to 6,000 characters."),
                title, MessageBoxButtons.OK, MessageBoxIcon.Information);
            return null;
        }

        string summary;
        try { summary = WaitForResult(owner, title, cancel => AiSummary.Generate(provider, text, keys.Get(provider), cancel), provider); }
        catch (Exception error)
        {
            string message = error is HttpRequestException ?
                string.Format(L.T("{0} ile bağlantı kurulamadı. İnternet bağlantınızı kontrol edin.",
                    "Could not connect to {0}. Check your internet connection."), provider) :
                error is OperationCanceledException ?
                string.Format(L.T("{0} yanıtı zamanında alınamadı.", "The {0} request timed out."), provider) :
                error is InvalidOperationException || error is System.IO.InvalidDataException ? error.Message :
                L.T("Özet önerisi alınamadı.", "Could not generate a summary.");
            MessageBox.Show(owner, message, title, MessageBoxButtons.OK, MessageBoxIcon.Error);
            return null;
        }
        if (summary == null) return null;

        using (var dialog = new FieldDialog(title, "summary", L.T("&Uygula", "&Apply")) { Font = owner.Font })
        {
            dialog.Note(L.T("Öneriyi doğrulayın ve gerekirse düzenleyin. Uygula düğmesi etkin taslağın profesyonel özetini değiştirir.",
                "Check the suggestion and edit it as needed. Apply replaces the professional summary in the active draft."));
            dialog.Input("summary", L.T("Önerilen &özet", "&Suggested summary"), summary, true);
            if (dialog.ShowDialog(owner) != DialogResult.OK) return null;
            var values = new Data();
            dialog.CopyTo(values);
            summary = Model.Value(values, "summary").Trim();
            return summary.Length > 0 ? summary : null;
        }
    }

    internal static string WaitForResult(Form owner, string title, Func<CancellationToken, Task<string>> request, string provider)
    {
        string result = null;
        Exception failure = null;
        bool working = true;
        using (var source = new CancellationTokenSource())
        using (var dialog = new Form {
            Text = title, StartPosition = FormStartPosition.CenterParent, ShowInTaskbar = false,
            Font = owner.Font, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink
        })
        {
            var status = new Label {
                Text = string.Format(L.T("{0} yanıtı bekleniyor…", "Waiting for {0}…"), provider), AutoSize = true
            };
            var cancel = new Button { Text = L.T("İ&ptal", "&Cancel"), AutoSize = true };
            var layout = new FlowLayoutPanel {
                FlowDirection = FlowDirection.TopDown, AutoSize = true, Padding = new Padding(12), Dock = DockStyle.Fill
            };
            layout.Controls.Add(status);
            layout.Controls.Add(cancel);
            dialog.Controls.Add(layout);
            dialog.CancelButton = cancel;
            cancel.Click += delegate { dialog.Close(); };
            dialog.FormClosing += delegate(object sender, FormClosingEventArgs e)
            {
                if (!working) return;
                e.Cancel = true;
                status.Text = L.T("İstek iptal ediliyor…", "Cancelling the request…");
                source.Cancel();
            };
            dialog.Shown += async delegate
            {
                cancel.AccessibleDescription = status.Text;
                cancel.Focus();
                try { result = await request(source.Token); }
                catch (Exception error) { failure = error; }
                finally
                {
                    working = false;
                    dialog.Close();
                }
            };
            dialog.ShowDialog(owner);
            if (source.IsCancellationRequested) return null;
            if (failure != null) throw failure;
            return result;
        }
    }
}