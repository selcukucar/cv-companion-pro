using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Text;
using System.Xml;
using Data = System.Collections.Generic.Dictionary<string, object>;

internal static class WordExport
{
    private const string Word = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
    private const string Relationships = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/";

    public static void Save(string path, Data cv)
    {
        Model.AtomicWrite(path, temporary =>
        {
            using (var file = new FileStream(temporary, FileMode.CreateNew))
            using (var package = new ZipArchive(file, ZipArchiveMode.Create))
            {
                Part(package, "[Content_Types].xml", x =>
                {
                    x.WriteStartElement("Types", "http://schemas.openxmlformats.org/package/2006/content-types");
                    Type(x, "Default", "Extension", "rels", "application/vnd.openxmlformats-package.relationships+xml");
                    Type(x, "Override", "PartName", "/word/document.xml", "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml");
                    Type(x, "Override", "PartName", "/word/styles.xml", "application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml");
                    x.WriteEndElement();
                });
                Relationship(package, "_rels/.rels", "officeDocument", "word/document.xml");
                Relationship(package, "word/_rels/document.xml.rels", "styles", "styles.xml");
                Part(package, "word/styles.xml", Styles);
                Part(package, "word/document.xml", x =>
                {
                    x.WriteStartElement("w", "document", Word);
                    Start(x, "body");
                    foreach (var paragraph in Model.Paragraphs(cv)) Paragraph(x, paragraph.Item1, paragraph.Item2);
                    Start(x, "sectPr");
                    Start(x, "pgSz");
                    Attr(x, "w", "11906");
                    Attr(x, "h", "16838");
                    x.WriteEndElement();
                    x.WriteEndElement();
                    x.WriteEndElement();
                    x.WriteEndElement();
                });
            }
        });
    }

    private static void Part(ZipArchive package, string name, Action<XmlWriter> write)
    {
        using (Stream stream = package.CreateEntry(name).Open())
        using (XmlWriter xml = XmlWriter.Create(stream, new XmlWriterSettings { Encoding = new UTF8Encoding(false) }))
            write(xml);
    }

    private static void Type(XmlWriter xml, string element, string key, string value, string contentType)
    {
        xml.WriteStartElement(element);
        xml.WriteAttributeString(key, value);
        xml.WriteAttributeString("ContentType", contentType);
        xml.WriteEndElement();
    }

    private static void Relationship(ZipArchive package, string path, string type, string target)
    {
        Part(package, path, x =>
        {
            x.WriteStartElement("Relationships", "http://schemas.openxmlformats.org/package/2006/relationships");
            x.WriteStartElement("Relationship");
            x.WriteAttributeString("Id", "rId1");
            x.WriteAttributeString("Type", Relationships + type);
            x.WriteAttributeString("Target", target);
            x.WriteEndElement();
            x.WriteEndElement();
        });
    }

    private static void Styles(XmlWriter x)
    {
        x.WriteStartElement("w", "styles", Word);
        Start(x, "docDefaults");
        Start(x, "rPrDefault");
        Start(x, "rPr");
        Start(x, "rFonts");
        Attr(x, "ascii", "Calibri");
        Attr(x, "hAnsi", "Calibri");
        x.WriteEndElement();
        ValueElement(x, "sz", "22");
        ValueElement(x, "lang", L.T("tr-TR", "en-US"));
        x.WriteEndElement();
        x.WriteEndElement();
        x.WriteEndElement();
        Style(x, "Normal", "Normal", "22");
        Style(x, "Title", "Title", "40");
        Style(x, "Heading1", "heading 1", "28");
        x.WriteEndElement();
    }

    private static void Style(XmlWriter x, string id, string name, string size)
    {
        Start(x, "style");
        Attr(x, "type", "paragraph");
        if (id == "Normal") Attr(x, "default", "1");
        Attr(x, "styleId", id);
        ValueElement(x, "name", name);
        if (id != "Normal")
        {
            ValueElement(x, "basedOn", "Normal");
            ValueElement(x, "next", "Normal");
        }
        ValueElement(x, "qFormat", null);
        Start(x, "pPr");
        if (id != "Normal") ValueElement(x, "keepNext", null);
        Start(x, "spacing");
        Attr(x, "before", id == "Heading1" ? "200" : "0");
        Attr(x, "after", id == "Title" ? "160" : "80");
        x.WriteEndElement();
        if (id == "Heading1") ValueElement(x, "outlineLvl", "0");
        x.WriteEndElement();
        Start(x, "rPr");
        if (id != "Normal") ValueElement(x, "b", null);
        ValueElement(x, "sz", size);
        x.WriteEndElement();
        x.WriteEndElement();
    }

    private static void Paragraph(XmlWriter x, string text, int level)
    {
        Start(x, "p");
        if (level > 0)
        {
            Start(x, "pPr");
            ValueElement(x, "pStyle", level == 2 ? "Title" : "Heading1");
            x.WriteEndElement();
        }
        Start(x, "r");
        string[] lines = text.Replace("\r\n", "\n").Replace('\r', '\n').Split('\n');
        for (int line = 0; line < lines.Length; line++)
        {
            if (line > 0) ValueElement(x, "br", null);
            string[] cells = lines[line].Split('\t');
            for (int cell = 0; cell < cells.Length; cell++)
            {
                if (cell > 0) ValueElement(x, "tab", null);
                Start(x, "t");
                x.WriteAttributeString("xml", "space", null, "preserve");
                x.WriteString(XmlText(cells[cell]));
                x.WriteEndElement();
            }
        }
        x.WriteEndElement();
        x.WriteEndElement();
    }

    private static string XmlText(string value)
    {
        var result = new StringBuilder(value.Length);
        for (int i = 0; i < value.Length; i++)
        {
            char character = value[i];
            if (i + 1 < value.Length && XmlConvert.IsXmlSurrogatePair(value[i + 1], character))
            {
                result.Append(character).Append(value[++i]);
            }
            else if (XmlConvert.IsXmlChar(character)) result.Append(character);
            else result.Append('\uFFFD');
        }
        return result.ToString();
    }

    private static void Start(XmlWriter x, string name) { x.WriteStartElement("w", name, Word); }
    private static void Attr(XmlWriter x, string name, string value) { x.WriteAttributeString("w", name, Word, value); }

    private static void ValueElement(XmlWriter x, string name, string value)
    {
        Start(x, name);
        if (value != null) Attr(x, "val", value);
        x.WriteEndElement();
    }
}