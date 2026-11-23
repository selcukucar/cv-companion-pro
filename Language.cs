using System;
using System.Collections.Generic;
using System.IO;

internal static class L
{
    private static readonly Dictionary<string, string> EnglishLabels = new Dictionary<string, string>
    {
        { "Kişisel bilgiler", "Personal information" },
        { "Özet ve beceriler", "Summary and skills" },
        { "İş deneyimi", "Work experience" },
        { "Eğitim", "Education" },
        { "Sertifikalar", "Certifications" },
        { "Projeler", "Projects" },
        { "Ödüller ve yayınlar", "Awards and publications" },
        { "Gönüllülük", "Volunteering" },
        { "Diller", "Languages" },
        { "Referanslar", "References" },
        { "Ad soyad", "Full name" },
        { "Ad Soyad", "Full name" },
        { "Mesleki unvan", "Professional title" },
        { "E-posta", "Email" },
        { "Telefon", "Phone" },
        { "Şehir", "City" },
        { "Web sitesi", "Website" },
        { "Doğum tarihi", "Date of birth" },
        { "Uyruk", "Nationality" },
        { "Askerlik durumu", "Military service status" },
        { "Sürücü belgesi", "Driver’s license" },
        { "Medeni durum", "Marital status" },
        { "Profesyonel özet", "Professional summary" },
        { "Beceriler", "Skills" },
        { "Hobiler", "Interests" },
        { "Referanslar talep üzerine paylaşılır", "References are available on request" },
        { "Pozisyon", "Position" },
        { "Şirket", "Company" },
        { "Konum", "Location" },
        { "Başlangıç (AA/YYYY)", "Start date (MM/YYYY)" },
        { "Başlangıç", "Start date" },
        { "Bitiş", "End date" },
        { "Görevler ve Başarılar", "Responsibilities and achievements" },
        { "Okul / Kurum", "School or institution" },
        { "Bölüm / Derece", "Field of study or degree" },
        { "Not Ortalaması", "Grade point average" },
        { "Notlar (opsiyonel)", "Notes (optional)" },
        { "Sertifika Adı", "Certificate name" },
        { "Veren Kurum", "Issuing organization" },
        { "Tarih", "Date" },
        { "Belge No / Link", "Credential ID or link" },
        { "Proje Adı", "Project name" },
        { "Rolünüz", "Your role" },
        { "Link (opsiyonel)", "Link (optional)" },
        { "Açıklama ve Teknolojiler", "Description and technologies" },
        { "Başlık", "Title" },
        { "Veren / Yayınlayan", "Issuer or publisher" },
        { "Açıklama (opsiyonel)", "Description (optional)" },
        { "Kurum", "Organization" },
        { "Rol", "Role" },
        { "Açıklama", "Description" },
        { "Dil", "Language" },
        { "Seviye", "Level" },
        { "Ünvan ve Şirket", "Title and company" },
    };

    public static string Language { get; private set; }

    static L() { Language = "tr"; }

    public static void Initialize()
    {
        string path = AppPaths.Preferences;
        try { Language = Preferences.Load(path).Language; }
        // The editor reports an unreadable settings file after opening.
        catch (InvalidDataException) { }
        catch (IOException) { }
        catch (UnauthorizedAccessException) { }
        catch (ArgumentException) { }
        catch (InvalidOperationException) { }
    }

    public static string T(string turkish, string english) { return Language == "en" ? english : turkish; }

    public static string Field(string label)
    {
        label = label.TrimEnd('*');
        string translated;
        return Language == "en" && EnglishLabels.TryGetValue(label, out translated) ? translated : label;
    }
}