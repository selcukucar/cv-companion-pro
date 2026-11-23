using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.RegularExpressions;
using Data = System.Collections.Generic.Dictionary<string, object>;

internal static class CvSearch
{
    private const int ExcerptLength = 90;
    private static readonly Regex Whitespace = new Regex(@"\s+");

    public static FieldReference[] Find(Data cv, string query)
    {
        string term = OneLine(query);
        if (term.Length == 0) return new FieldReference[0];

        var results = new List<FieldReference>();
        foreach (Section section in Model.Sections)
        {
            bool personal = section.Key == "form";
            IEnumerable<Data> rows = personal ? new[] { (Data)cv["form"] }.AsEnumerable() : (List<Data>)cv[section.Key];
            int row = -1;
            foreach (Data data in rows)
            {
                row++;
                string location = personal ? section.Name :
                    string.Format(L.T("{0}, {1}. kayıt", "{0}, entry {1}"), section.Name, row + 1);
                foreach (string[] field in section.Fields)
                {
                    string label = L.Field(field[1]);
                    object stored = Model.Get(data, field[0]);
                    string value = stored is bool
                        ? (bool)stored ? L.T("Evet", "Yes") : L.T("Hayır", "No")
                        : OneLine(Model.Value(data, field[0]));
                    int match = IndexOf(value, term);
                    if (match < 0 && IndexOf(label, term) < 0) continue;

                    string caption = location + ", " + label;
                    if (value.Length > 0) caption += ": " + Excerpt(value, match);
                    results.Add(new FieldReference(section, row, field[0], caption));
                }
            }
        }
        return results.ToArray();
    }

    private static string OneLine(string text) { return Whitespace.Replace(text, " ").Trim(); }

    private static int IndexOf(string text, string term)
    {
        int index = text.IndexOf(term, StringComparison.OrdinalIgnoreCase);
        return index >= 0 ? index : Model.Turkish.CompareInfo.IndexOf(text, term, CompareOptions.IgnoreCase);
    }

    private static string Excerpt(string text, int match)
    {
        if (text.Length <= ExcerptLength) return text;
        int start = Math.Max(0, match - 24);
        if (char.IsLowSurrogate(text[start])) start--;
        int end = Math.Min(start + ExcerptLength, text.Length);
        if (char.IsHighSurrogate(text[end - 1])) end++;
        return (start > 0 ? "…" : "") + text.Substring(start, end - start) + (end < text.Length ? "…" : "");
    }
}
