using System;
using System.Collections.Generic;
using System.IO;
using Data = System.Collections.Generic.Dictionary<string, object>;

internal static class ReleaseSmoke
{
    static void Main(string[] args)
    {
        var cv = Model.NewCv();
        var form = (Data)cv["form"];
        form["name"] = "Çağrı Özışık";
        form["title"] = "Ürün Yöneticisi";
        form["email"] = "ornek@example.com";
        form["summary"] = "Türkçe: ç ğ ı İ ö ş ü. Ekran okuyucuyla öz geçmiş hazırlama.";
        form["skills"] = "Erişilebilirlik, Jira";
        var rows = (List<Data>)cv["experiences"];
        for (int i = 1; i <= 12; i++)
            rows.Add(new Data {
                {"position", "Ürün Uzmanı " + i}, {"company", "Örnek Şirket"},
                {"startDate", "01.08.2019"}, {"endDate", "01.01.2025"}, {"location", "İstanbul"},
                {"description", "Erişilebilirlik çalışmaları ve kalite süreçleri. Ekran okuyucuyla ürün gezintisi ve içerik denetimi.\r\nİkinci satır. " + (i == 1 ? new string('x', 210) : "Başvuru için bir örnek.") + " Bitiş" + i}
            });
        PdfExport.Save(Path.Combine(args[0], "tagged-cv.pdf"), cv);
        Console.WriteLine("Tagged PDF generated.");
    }
}
