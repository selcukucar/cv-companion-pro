using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using Data = System.Collections.Generic.Dictionary<string, object>;

internal sealed class DesktopUpdate
{
    public readonly Version Version;
    public readonly string Name;
    public readonly string Url;
    public readonly string Sha256;

    public DesktopUpdate(Version version, string name, string url, string sha256)
    {
        Version = version;
        Name = name;
        Url = url;
        Sha256 = sha256;
    }
}

internal static class ReleaseUpdates
{
    public const string Repository = "https://github.com/selcukucar/cv-companion-pro";
    private const string Releases = "https://api.github.com/repos/selcukucar/cv-companion-pro/releases?per_page=50";
    private const string Prefix = "desktop-v";
    private static readonly HttpClient Client = NewClient();

    private static HttpClient NewClient()
    {
        var client = new HttpClient { Timeout = TimeSpan.FromSeconds(40), MaxResponseContentBufferSize = 40 * 1024 * 1024 };
        client.DefaultRequestHeaders.UserAgent.ParseAdd("OzgecmisAsistani/0.12");
        return client;
    }

    public static async Task<DesktopUpdate> Check()
    {
        string json = await Client.GetStringAsync(Releases).ConfigureAwait(false);
        return Find(json, typeof(Editor).Assembly.GetName().Version, AppPaths.Portable);
    }

    internal static DesktopUpdate Find(string json, Version current, bool portable)
    {
        var releases = new JavaScriptSerializer { MaxJsonLength = 8 * 1024 * 1024 }.DeserializeObject(json) as object[];
        if (releases == null) throw new InvalidDataException();
        Version currentVersion = new Version(current.Major, current.Minor, Math.Max(0, current.Build));
        DesktopUpdate latest = null;
        foreach (var release in releases.OfType<Data>())
        {
            if (Equals(Model.Get(release, "draft"), true)) continue;
            string tag = Model.Value(release, "tag_name");
            Version version;
            if (!tag.StartsWith(Prefix, StringComparison.Ordinal) ||
                !Version.TryParse(tag.Substring(Prefix.Length), out version) || version.Build < 0 ||
                version.Revision >= 0 || tag != Prefix + version || version <= currentVersion ||
                (latest != null && version <= latest.Version))
                continue;

            string name = "OzgecmisAsistani-" + version + (portable ? "-portable.zip" : "-setup.exe");
            string url = Repository + "/releases/download/" + tag + "/" + name;
            var assets = Model.Get(release, "assets") as object[] ?? new object[0];
            foreach (var asset in assets.OfType<Data>())
            {
                if (Model.Value(asset, "name") != name || Model.Value(asset, "browser_download_url") != url)
                    continue;
                string digest = Model.Value(asset, "digest");
                if (!Regex.IsMatch(digest, @"\Asha256:[0-9a-fA-F]{64}\z")) continue;
                latest = new DesktopUpdate(version, name, url, digest.Substring("sha256:".Length));
                break;
            }
        }
        return latest;
    }

    public static async Task Download(DesktopUpdate update, string path)
    {
        using (var response = await Client.GetAsync(update.Url).ConfigureAwait(false))
        {
            response.EnsureSuccessStatusCode();
            Uri uri = response.RequestMessage.RequestUri;
            if (uri.Scheme != Uri.UriSchemeHttps ||
                (uri.Host != "github.com" && !uri.Host.EndsWith(".githubusercontent.com", StringComparison.OrdinalIgnoreCase)))
                throw new InvalidDataException();
            byte[] bytes = await response.Content.ReadAsByteArrayAsync().ConfigureAwait(false);
            SaveVerified(update, path, bytes);
        }
    }

    internal static void SaveVerified(DesktopUpdate update, string path, byte[] bytes)
    {
        using (var hash = SHA256.Create())
        {
            string digest = BitConverter.ToString(hash.ComputeHash(bytes)).Replace("-", "");
            if (!string.Equals(digest, update.Sha256, StringComparison.OrdinalIgnoreCase))
                throw new InvalidDataException(L.T("İndirilen dosyanın SHA-256 özeti uyuşmuyor.",
                    "The downloaded file did not match its SHA-256 digest."));
        }
        Model.AtomicWrite(path, temporary => File.WriteAllBytes(temporary, bytes));
    }
}
