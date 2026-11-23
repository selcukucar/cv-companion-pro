using System;
using System.IO;

internal static class AppPaths
{
    public static readonly string Profile = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "OzgecmisAsistaniDesktop");

    public static readonly bool Portable = File.Exists(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "portable.mode"));

    public static readonly string Data = Portable
        ? Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data")
        : Profile;

    public static string Preferences { get { return Path.Combine(Data, "ayarlar.json"); } }
    public static string ApiKeys { get { return Path.Combine(Profile, "ai-keys.dat"); } }
}
