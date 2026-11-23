using System;
using System.Collections.Generic;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Web.Script.Serialization;
using System.Windows.Forms;
using Data = System.Collections.Generic.Dictionary<string, object>;

internal sealed class ApiKeys
{
    public const string OpenAi = "OpenAI";
    public const string Gemini = "Gemini";
    public static readonly string[] Providers = { OpenAi, Gemini };
    private readonly Data keys;

    private ApiKeys(Data keys) { this.keys = keys; }

    public string Get(string provider) { return Model.Value(keys, provider); }

    public void Update(string provider, string replacement, bool remove)
    {
        string key = replacement.Trim();
        if (remove) keys.Remove(provider);
        else if (key.Length > 0) keys[provider] = key;
    }

    public static ApiKeys Load(string path)
    {
        if (!File.Exists(path)) return new ApiKeys(new Data());
        if (new FileInfo(path).Length > 16384) throw new InvalidDataException();
        byte[] encrypted = Convert.FromBase64String(File.ReadAllText(path));
        byte[] plain = ProtectedData.Unprotect(encrypted, null, DataProtectionScope.CurrentUser);
        try
        {
            var keys = new JavaScriptSerializer().DeserializeObject(Encoding.UTF8.GetString(plain)) as Data;
            if (keys == null) throw new InvalidDataException();
            return new ApiKeys(keys);
        }
        finally { Array.Clear(plain, 0, plain.Length); }
    }

    public void Save(string path)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(path));
        byte[] plain = Encoding.UTF8.GetBytes(new JavaScriptSerializer().Serialize(keys));
        try
        {
            byte[] encrypted = ProtectedData.Protect(plain, null, DataProtectionScope.CurrentUser);
            Model.AtomicWrite(path, Convert.ToBase64String(encrypted));
        }
        finally { Array.Clear(plain, 0, plain.Length); }
    }

    public static void Edit(Form owner, string path)
    {
        string title = L.T("Yapay zekâ sağlayıcıları", "AI providers");
        try
        {
            var saved = Load(path);
            using (var dialog = new FieldDialog(title) { Font = owner.Font, ClientSize = new System.Drawing.Size(640, 450) })
            {
                dialog.Note(L.T("Anahtarlar bu Windows kullanıcısı için şifrelenir. Var olan anahtarı korumak için alanı boş bırakın. Kaldırma kutusunu işaretleyip Kaydet ile silebilirsiniz.",
                    "Keys are encrypted for this Windows user. Leave a field blank to keep its saved key. Check a remove box and choose Save to delete that key."));
                foreach (string provider in Providers)
                {
                    bool exists = saved.Get(provider).Length > 0;
                    string state = exists ? L.T("kayıtlı", "saved") : L.T("kayıtlı değil", "not saved");
                    dialog.Input(provider, provider + L.T(" API anahtarı", " API key") + " (" + state + ")", "", false, password: true);
                    if (exists)
                        dialog.Flag(provider + "Remove", string.Format(L.T("{0} anahtarını kaldır", "Remove {0} key"), provider), false);
                }

                while (dialog.ShowDialog(owner) == DialogResult.OK)
                {
                    var values = new Data();
                    dialog.CopyTo(values);
                    string invalid = null;
                    foreach (string provider in Providers)
                    {
                        string value = Model.Value(values, provider).Trim();
                        bool remove = Equals(Model.Get(values, provider + "Remove"), true);
                        if (value.Length > 512 || ContainsInvalidCharacter(value) || (remove && value.Length > 0))
                        {
                            invalid = provider;
                            break;
                        }
                    }
                    if (invalid != null)
                    {
                        MessageBox.Show(owner, string.Format(L.T("{0} için boşluk içermeyen bir anahtar girin veya kaldırmayı seçin.",
                            "For {0}, enter a key without spaces or choose to remove it."), invalid),
                            title, MessageBoxButtons.OK, MessageBoxIcon.Information);
                        continue;
                    }
                    foreach (string provider in Providers)
                        saved.Update(provider, Model.Value(values, provider), Equals(Model.Get(values, provider + "Remove"), true));
                    saved.Save(path);
                    return;
                }
            }
        }
        catch (Exception)
        {
            MessageBox.Show(owner, L.T("Anahtarlar okunamadı veya kaydedilemedi. Windows kullanıcı profilini ve dosya erişimini kontrol edin.",
                "Keys could not be read or saved. Check the Windows user profile and file access."),
                title, MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    private static bool ContainsInvalidCharacter(string key)
    {
        foreach (char value in key)
            if (value < 33 || value > 126) return true;
        return false;
    }
}
