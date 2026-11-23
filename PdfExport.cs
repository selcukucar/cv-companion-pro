using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using PdfSharp;
using PdfSharp.Drawing;
using PdfSharp.Pdf;
using PdfSharp.UniversalAccessibility;
using Data = System.Collections.Generic.Dictionary<string, object>;

internal static class PdfExport
{
    private const double Margin = 54;

    public static void Save(string path, Data cv)
    {
        using (var document = new PdfDocument())
        {
            UAManager accessibility = UAManager.ForDocument(document);
            accessibility.SetDocumentLanguage(L.T("tr-TR", "en-US"));
            document.Info.Title = Clean(Model.Name(cv));
            document.ViewerPreferences.DisplayDocTitle = true;

            var fontOptions = new XPdfFontOptions(PdfFontEncoding.Unicode, PdfFontEmbedding.TryComputeSubset);
            var fonts = new[] {
                new XFont("Arial", 11, XFontStyleEx.Regular, fontOptions),
                new XFont("Arial", 14, XFontStyleEx.Bold, fontOptions),
                new XFont("Arial", 21, XFontStyleEx.Bold, fontOptions)
            };
            var structure = accessibility.StructureBuilder;
            var outlines = document.Outlines;
            PdfPage page = null;
            XGraphics graphics = null;
            double baseline = 0;
            Action startPage = () =>
            {
                page = document.AddPage();
                if (graphics != null) graphics.Dispose();
                page.Size = PageSize.A4;
                page.Elements.SetName("/Tabs", "/S");
                graphics = XGraphics.FromPdfPage(page);
                baseline = Margin;
            };

            try
            {
                startPage();
                foreach (var paragraph in Model.Paragraphs(cv))
                {
                    int level = paragraph.Item2;
                    XFont font = fonts[level];
                    double lineHeight = font.GetHeight() + 2;
                    double spacing = baseline == Margin ? 0 : level == 1 ? 12 : 4;
                    var lines = Wrap(graphics, paragraph.Item1, font, page.Width.Point - 2 * Margin).ToArray();
                    if (!lines.Any(line => line.Length > 0)) continue;

                    // Avoid leaving a section heading at the bottom of a page without body text.
                    double minimum = level == 1 ? lines.Length * lineHeight + fonts[0].GetHeight() + 8 : lineHeight;
                    if (baseline + spacing + minimum > page.Height.Point - Margin)
                    {
                        startPage();
                        spacing = 0;
                    }
                    baseline += spacing;

                    if (level > 0)
                    {
                        var bookmark = outlines.Add(Clean(paragraph.Item1), page, level == 2);
                        bookmark.PageDestinationType = PdfPageDestinationType.FitH;
                        bookmark.Top = page.Height.Point - baseline;
                        if (level == 2) outlines = bookmark.Outlines;
                    }

                    var tag = level == 2 ? PdfBlockLevelElementTag.Heading1 :
                        level == 1 ? PdfBlockLevelElementTag.Heading2 : PdfBlockLevelElementTag.Paragraph;
                    structure.BeginElement(tag);
                    foreach (string line in lines)
                    {
                        if (baseline + lineHeight > page.Height.Point - Margin) startPage();
                        baseline += lineHeight;
                        if (line.Length > 0) graphics.DrawString(line, font, XBrushes.Black, Margin, baseline);
                    }
                    structure.End();
                }
            }
            finally { if (graphics != null) graphics.Dispose(); }

            Model.AtomicWrite(path, temporary => document.Save(temporary));
        }
    }

    private static IEnumerable<string> Wrap(XGraphics graphics, string text, XFont font, double width)
    {
        text = Clean(text).Replace("\r\n", "\n").Replace('\r', '\n').Replace("\t", "    ");
        foreach (string row in text.Split('\n'))
        {
            if (row.Length == 0)
            {
                yield return "";
                continue;
            }
            int[] boundaries = StringInfo.ParseCombiningCharacters(row);
            int start = 0;
            while (start < boundaries.Length)
            {
                int low = start + 1;
                int high = Math.Min(start + 4096, boundaries.Length);
                int fit = low;
                while (low <= high)
                {
                    int mid = (low + high) / 2;
                    int end = mid == boundaries.Length ? row.Length : boundaries[mid];
                    string candidate = row.Substring(boundaries[start], end - boundaries[start]);
                    if (graphics.MeasureString(candidate, font).Width <= width)
                    {
                        fit = mid;
                        low = mid + 1;
                    }
                    else high = mid - 1;
                }

                int next = fit;
                if (fit < boundaries.Length)
                    for (int at = fit - 1; at > start; at--)
                        if (char.IsWhiteSpace(row[boundaries[at]]))
                        {
                            next = at + 1;
                            break;
                        }
                int endOfLine = next == boundaries.Length ? row.Length : boundaries[next];
                string line = row.Substring(boundaries[start], endOfLine - boundaries[start]);
                // Preserve a word boundary between explicit source lines for assistive technology.
                yield return next == boundaries.Length ? line + " " : line;
                start = next;
            }
        }
    }

    private static string Clean(string text)
    {
        var safe = new StringBuilder(text.Length);
        for (int i = 0; i < text.Length; i++)
        {
            char value = text[i];
            if (char.IsHighSurrogate(value) && i + 1 < text.Length && char.IsLowSurrogate(text[i + 1]))
                safe.Append(value).Append(text[++i]);
            else if (char.IsSurrogate(value) || (char.IsControl(value) && value != '\n' && value != '\r' && value != '\t'))
                safe.Append(' ');
            else safe.Append(value);
        }
        return safe.ToString();
    }
}
