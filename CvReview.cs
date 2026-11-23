using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net.Mail;
using Data = System.Collections.Generic.Dictionary<string, object>;

internal static class CvReview
{
    private static readonly string[] DateFormats = {
        "d.M.yyyy", "d/M/yyyy", "yyyy-MM-dd", "M/yyyy", "M.yyyy", "yyyy-MM", "yyyy"
    };

    public static string OutputNotes { get { return
        L.T("Word çıktısında bölüm başlıklarıyla gezinebilirsiniz. ", "You can navigate the Word document by section headings. ") +
        L.T("PDF çıktısı, başlık etiketleri ve yer imleri içerir. Başlık gezinmesi için etiketli PDF destekleyen bir okuyucu kullanın.",
            "PDF exports include heading tags and bookmarks. Use a reader that supports tagged PDFs for heading navigation."); } }

    public static IEnumerable<FieldReference> Findings(Data cv)
    {
        var personal = Model.Sections[0];
        var form = (Data)cv["form"];
        if (Blank(form, "name"))
            yield return new FieldReference(personal, 0, "name", L.T("Kişisel bilgiler, Ad soyad: adınızı girin.", "Personal information, Full name: enter your name."));
        if (Blank(form, "email") && Blank(form, "phone") && Blank(form, "website") && Blank(form, "linkedin"))
            yield return new FieldReference(personal, 0, "email", L.T("Kişisel bilgiler: en az bir iletişim yöntemi ekleyin.", "Personal information: add at least one contact method."));
        if (!ValidEmail(Model.Value(form, "email")))
            yield return new FieldReference(personal, 0, "email", L.T("Kişisel bilgiler, E-posta: adresin yazımını kontrol edin.", "Personal information, Email: check the address."));
        foreach (var field in new[] { "linkedin", "website" })
            if (!ValidLink(Model.Value(form, field)))
                yield return new FieldReference(personal, 0, field, L.T("Kişisel bilgiler, ", "Personal information, ") + (field == "linkedin" ? "LinkedIn" : L.T("Web sitesi", "Website")) + L.T(": http:// veya https:// ile başlayan tam adresi girin.", ": enter a full address starting with http:// or https://."));

        foreach (Section section in Model.Sections.Skip(2))
        {
            var rows = (List<Data>)cv[section.Key];
            for (int i = 0; i < rows.Count; i++)
            {
                var row = rows[i];
                var label = string.Format(L.T("{0}, {1}. kayıt", "{0}, entry {1}"), section.Name, i + 1);
                if (section.Fields.All(field => Blank(row, field[0])))
                {
                    yield return new FieldReference(section, i, section.Fields[0][0], label + L.T(": kayıt boş. Alanları doldurun veya kaydı silin.", ": this entry is empty. Fill in the fields or delete the entry."));
                    continue;
                }
                if (Blank(row, section.Fields[0][0]))
                    yield return new FieldReference(section, i, section.Fields[0][0], label + ": " + L.Field(section.Fields[0][1]) + L.T(" alanı boş.", " is empty."));
                if (ReversedDates(row))
                    yield return new FieldReference(section, i, "endDate", label + L.T(": bitiş tarihi başlangıç tarihinden önce.", ": the end date is before the start date."));
                if (section.Key == "references" && !ValidEmail(Model.Value(row, "email")))
                    yield return new FieldReference(section, i, "email", label + L.T(", E-posta: adresin yazımını kontrol edin.", ", Email: check the address."));
                if (section.Key == "projects" && !ValidLink(Model.Value(row, "link")))
                    yield return new FieldReference(section, i, "link", label + L.T(", Link: http:// veya https:// ile başlayan tam adresi girin.", ", Link: enter a full address starting with http:// or https://."));
            }
        }
    }

    private static bool Blank(Data values, string key)
    {
        return string.IsNullOrWhiteSpace(Model.Value(values, key));
    }

    private static bool ValidEmail(string value)
    {
        value = value.Trim();
        if (value.Length == 0) return true;
        try
        {
            var address = new MailAddress(value);
            return address.Address == value && address.Host.Contains(".");
        }
        catch (FormatException) { return false; }
    }

    private static bool ValidLink(string value)
    {
        value = value.Trim();
        if (value.Length == 0) return true;
        Uri uri;
        return Uri.TryCreate(value, UriKind.Absolute, out uri) &&
            (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps) &&
            !string.IsNullOrEmpty(uri.Host);
    }

    private static bool ReversedDates(Data row)
    {
        string startText = Model.Value(row, "startDate").Trim();
        string endText = Model.Value(row, "endDate").Trim();
        DateTime start, end;
        if (!DateTime.TryParseExact(startText, DateFormats, CultureInfo.InvariantCulture, DateTimeStyles.None, out start) ||
            !DateTime.TryParseExact(endText, DateFormats, CultureInfo.InvariantCulture, DateTimeStyles.None, out end))
            return false;

        // An end date given as a month or year includes that whole period.
        if (endText.Length == 4)
            end = new DateTime(end.Year, 12, 31);
        else if (endText.Count(c => c == '/' || c == '.' || c == '-') == 1)
            end = new DateTime(end.Year, end.Month, DateTime.DaysInMonth(end.Year, end.Month));
        return end < start;
    }
}
