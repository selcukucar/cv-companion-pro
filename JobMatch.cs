using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using Data = System.Collections.Generic.Dictionary<string, object>;

internal static class JobMatch
{
    private const int MaxTerms = 40;

    private static readonly Regex Term = new Regex(
        @"(?<![\p{L}\p{N}_])(?:\.[\p{L}][\p{L}\p{N}]*(?:\.[\p{L}\p{N}]+)*|[\p{L}\p{N}]+(?:\.[\p{L}\p{N}]+)*(?:\+\+|#)?)",
        RegexOptions.CultureInvariant);

    private static readonly HashSet<string> Common = new HashSet<string>(
        ("ve veya ile için olarak olan olmak bir bu şu daha çok en gibi de da ise hem ya ancak ama sonra önce " +
         "sahip aranan arıyoruz aranıyor aday adaylar tercih nitelikler özellikler sorumluluklar görev görevler " +
         "başvuru çalışma çalışmak deneyim tecrübe bilgi beceri ekip takım ilgili üzere iyi düzeyde yıl yıllık " +
         "the a an and or of for to in on with by from as at be is are was were has have will can must your you our us " +
         "we all any this that these those their they role team job apply experience skills work working years year " +
         "looking seeking candidate candidates preferred required requirements qualifications responsibilities ability strong").Split(' '));

    private static readonly string[] FormFields = { "title", "summary", "skills" };

    private static readonly string[][] WorkFields = {
        new[] { "experiences", "position", "description" },
        new[] { "educations", "school", "degree", "note" },
        new[] { "certifications", "name", "issuer" },
        new[] { "projects", "name", "role", "description" },
        new[] { "awards", "title", "description" },
        new[] { "volunteers", "role", "description" },
        new[] { "languages", "name", "level" }
    };

    public static string Report(Data cv, string posting)
    {
        var relevant = Terms(posting).GroupBy(Canonical)
            .OrderByDescending(group => group.Count())
            .Select(group => group.First()).ToArray();
        if (relevant.Length == 0) return null;

        var cvTerms = new HashSet<string>(CvContent(cv).SelectMany(Terms).Select(Canonical));
        var compared = relevant.Take(MaxTerms).ToArray();
        var present = compared.Where(term => cvTerms.Contains(Canonical(term))).ToArray();
        var absent = compared.Where(term => !cvTerms.Contains(Canonical(term))).ToArray();
        var result = new List<string> {
            string.Format(L.T("İncelenen {0} terimin {1} tanesi CV’de geçiyor.",
                "{1} of the {0} reviewed terms appear in the CV."), compared.Length, present.Length)
        };
        if (relevant.Length > MaxTerms)
            result.Add(string.Format(L.T("İlanda {0} farklı terim bulundu. En sık geçen {1} terim gösteriliyor.",
                "The posting contains {0} distinct terms. The {1} most frequent are shown."), relevant.Length, MaxTerms));
        result.Add(L.T("Bu karşılaştırma sözcükleri kontrol eder. Eş anlamları, çekimli biçimleri veya başvuru uygunluğunu değerlendirmez.",
            "This is a word comparison. It does not evaluate synonyms, word forms or suitability for the job."));
        result.Add("");
        AddGroup(result, L.T("CV’de geçen terimler", "Terms found in the CV"), present);
        result.Add("");
        AddGroup(result, L.T("CV’de bulunmayan terimler", "Terms not found in the CV"), absent);
        return string.Join(Environment.NewLine, result);
    }

    private static void AddGroup(List<string> report, string heading, string[] words)
    {
        report.Add(heading);
        if (words.Length == 0) report.Add(L.T("Yok.", "None."));
        else report.AddRange(words);
    }

    private static IEnumerable<string> CvContent(Data cv)
    {
        var form = (Data)cv["form"];
        foreach (string field in FormFields) yield return Model.Value(form, field);
        foreach (string[] section in WorkFields)
            foreach (var row in (List<Data>)cv[section[0]])
                for (int i = 1; i < section.Length; i++)
                    yield return Model.Value(row, section[i]);
    }

    private static IEnumerable<string> Terms(string text)
    {
        foreach (Match match in Term.Matches(text))
        {
            string value = match.Value;
            if (value.Length > 1 && value.Length <= 64 && value.Any(char.IsLetter) &&
                !Common.Contains(Canonical(value))) yield return value;
        }
    }

    private static string Canonical(string term)
    {
        return term.Replace('İ', 'I').Replace('ı', 'i').ToLowerInvariant();
    }
}
