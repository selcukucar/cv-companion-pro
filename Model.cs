using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Web.Script.Serialization;

using Data = System.Collections.Generic.Dictionary<string, object>;

internal sealed class Section
{
    public readonly string Key;
    private readonly string name;
    public string Name { get { return L.Field(name); } }
    public readonly string[][] Fields;

    public Section(string key, string name, string fields)
    {
        Key = key;
        this.name = name;
        Fields = fields.Split('|').Select(f => f.Split('=')).ToArray();
    }

    public override string ToString() { return Name; }
}

internal static class Model
{
    public static readonly CultureInfo Turkish = CultureInfo.GetCultureInfo("tr-TR");
    public static readonly Section[] Sections = {
        new Section("form", "Kişisel bilgiler", "name=Ad soyad|title=Mesleki unvan|email=E-posta|phone=Telefon|city=Şehir|linkedin=LinkedIn|website=Web sitesi|birthdate=Doğum tarihi|nationality=Uyruk|military=Askerlik durumu|driver=Sürücü belgesi|marital=Medeni durum"),
        new Section("form", "Özet ve beceriler", "summary=Profesyonel özet*|skills=Beceriler*|hobbies=Hobiler*|refRequest=Referanslar talep üzerine paylaşılır"),
        new Section("experiences", "İş deneyimi", "position=Pozisyon|company=Şirket|location=Konum|startDate=Başlangıç (AA/YYYY)|endDate=Bitiş|description=Görevler ve Başarılar*"),
        new Section("educations", "Eğitim", "school=Okul / Kurum|degree=Bölüm / Derece|gpa=Not Ortalaması|startDate=Başlangıç|endDate=Bitiş|note=Notlar (opsiyonel)"),
        new Section("certifications", "Sertifikalar", "name=Sertifika Adı|issuer=Veren Kurum|date=Tarih|credential=Belge No / Link"),
        new Section("projects", "Projeler", "name=Proje Adı|role=Rolünüz|link=Link (opsiyonel)|description=Açıklama ve Teknolojiler*"),
        new Section("awards", "Ödüller ve yayınlar", "title=Başlık|issuer=Veren / Yayınlayan|date=Tarih|description=Açıklama (opsiyonel)"),
        new Section("volunteers", "Gönüllülük", "org=Kurum|role=Rol|startDate=Başlangıç|endDate=Bitiş|description=Açıklama*"),
        new Section("languages", "Diller", "name=Dil|level=Seviye"),
        new Section("references", "Referanslar", "name=Ad Soyad|title=Ünvan ve Şirket|email=E-posta|phone=Telefon")
    };
    private static readonly JavaScriptSerializer Json = new JavaScriptSerializer { MaxJsonLength = 32 * 1024 * 1024 };
    public static object Get(Data data, string key)
    {
        object value;
        return data != null && data.TryGetValue(key, out value) ? value : null;
    }

    public static string Value(Data data, string key) { return Convert.ToString(Get(data, key), CultureInfo.InvariantCulture) ?? ""; }

    public static Data NewCv()
    {
        var data = new Data { { "form", new Data() } };
        foreach (Section section in Sections.Skip(2))
            data[section.Key] = new List<Data>();
        return data;
    }

    public static Data CopyCv(Data cv)
    {
        return Normalize(Json.DeserializeObject(Json.Serialize(cv)));
    }

    public static object Read(string path)
    {
        if (new FileInfo(path).Length > 32L * 1024 * 1024)
            throw new InvalidDataException(L.T("JSON dosyası en fazla 32 MB olabilir.", "The JSON file cannot exceed 32 MB."));
        return Json.DeserializeObject(File.ReadAllText(path));
    }

    public static void Write(string path, object value) { AtomicWrite(path, Json.Serialize(value)); }

    public static void AtomicWrite(string path, string content)
    {
        AtomicWrite(path, temporary => File.WriteAllText(temporary, content, new UTF8Encoding(false)));
    }

    public static void AtomicWrite(string path, Action<string> write)
    {
        string temporary = path + "." + Guid.NewGuid().ToString("N") + ".tmp";
        try
        {
            write(temporary);
            if (File.Exists(path)) File.Replace(temporary, path, null);
            else File.Move(temporary, path);
        }
        finally { if (File.Exists(temporary)) File.Delete(temporary); }
    }

    public static Data Normalize(object value)
    {
        var input = value as Data;
        var form = Get(input, "form") as Data;
        if (form == null) throw new InvalidDataException(L.T("Öz geçmişin form alanı bulunamadı.", "The CV form data could not be found."));
        var cv = NewCv();
        cv["form"] = form;
        if (Get(input, "photo") is string) cv["photo"] = input["photo"];
        foreach (Section section in Sections.Skip(2))
        {
            object entries = Get(input, section.Key);
            if (entries == null) continue;
            var rows = entries as object[];
            if (rows == null || rows.Any(row => !(row is Data)))
                throw new InvalidDataException(section.Name + L.T(" listesi geçersiz.", " entries are invalid."));
            cv[section.Key] = rows.Cast<Data>().ToList();
        }
        return cv;
    }

    public static string Name(Data cv)
    {
        string name = Value((Data)cv["form"], "name").Trim();
        return name.Length == 0 ? L.T("İsimsiz öz geçmiş", "Untitled CV") : name;
    }

    public static string EntryName(Section section, Data row, int index)
    {
        string title = string.Join(" · ", section.Fields.Take(2).Select(f => Value(row, f[0]).Trim()).Where(v => v.Length > 0));
        return (index + 1) + ". " + (title.Length == 0 ? L.T("Boş kayıt", "Empty entry") : title);
    }

    public static IEnumerable<Tuple<string, int>> Paragraphs(Data cv)
    {
        var form = (Data)cv["form"];
        yield return Tuple.Create(Name(cv), 2);
        string title = Value(form, "title").Trim();
        if (title.Length > 0) yield return Tuple.Create(title, 0);

        var contact = Sections[0].Fields.Skip(2).Take(5)
            .Select(field => Labeled(L.Field(field[1]), Value(form, field[0])));
        string contactLine = JoinValues(" · ", contact);
        if (contactLine.Length > 0) yield return Tuple.Create(contactLine, 0);

        foreach (var field in Sections[0].Fields.Skip(7))
        {
            string line = Labeled(L.Field(field[1]), Value(form, field[0]));
            if (line.Length > 0) yield return Tuple.Create(line, 0);
        }
        foreach (var field in Sections[1].Fields.Take(3))
        {
            string value = Value(form, field[0]).Trim();
            if (value.Length == 0) continue;
            yield return Tuple.Create(L.Field(field[1]), 1);
            yield return Tuple.Create(value, 0);
        }
        foreach (Section section in Sections.Skip(2))
        {
            var rows = ((List<Data>)cv[section.Key]).Select(row => FormatEntry(section, row))
                .Where(row => row.Length > 0).ToArray();
            if (rows.Length == 0) continue;
            yield return Tuple.Create(section.Name, 1);
            foreach (var row in rows)
                yield return Tuple.Create(row, 0);
        }
        if (Equals(Get(form, "refRequest"), true))
            yield return Tuple.Create(L.T("Referanslar talep üzerine paylaşılır.", "References are available on request."), 0);
    }

    private static string FormatEntry(Section section, Data row)
    {
        switch (section.Key)
        {
            case "experiences":
                return JoinValues(Environment.NewLine, new[] {
                    JoinValues(" — ", new[] { Value(row, "position"), Value(row, "company") }),
                    JoinValues(" · ", new[] { DateRange(row), Labeled(L.T("Konum", "Location"), Value(row, "location")) }),
                    Value(row, "description")
                });
            case "educations":
                return JoinValues(Environment.NewLine, new[] {
                    JoinValues(" — ", new[] { Value(row, "school"), Value(row, "degree") }),
                    JoinValues(" · ", new[] { DateRange(row), Labeled(L.T("Not ortalaması", "Grade point average"), Value(row, "gpa")) }),
                    Value(row, "note")
                });
            case "volunteers":
                return JoinValues(Environment.NewLine, new[] {
                    JoinValues(" — ", new[] { Value(row, "org"), Value(row, "role") }),
                    DateRange(row),
                    Value(row, "description")
                });
            case "languages":
                return JoinValues(" — ", new[] { Value(row, "name"), Labeled(L.T("Seviye", "Level"), Value(row, "level")) });
            default:
                return JoinValues(Environment.NewLine, section.Fields.Select(field => Value(row, field[0])));
        }
    }

    private static string DateRange(Data row)
    {
        string start = Value(row, "startDate").Trim();
        string end = Value(row, "endDate").Trim();
        if (start.Length > 0 && end.Length > 0) return L.T("Tarih: ", "Date: ") + start + " – " + end;
        return start.Length > 0 ? Labeled(L.T("Başlangıç", "Start date"), start) : Labeled(L.T("Bitiş", "End date"), end);
    }

    private static string Labeled(string label, string value)
    {
        value = value.Trim();
        return value.Length == 0 ? "" : label + ": " + value;
    }

    private static string JoinValues(string separator, IEnumerable<string> values)
    {
        return string.Join(separator, values.Select(value => value.Trim()).Where(value => value.Length > 0));
    }

    public static string Plain(Data cv)
    {
        return string.Join(Environment.NewLine, Paragraphs(cv).Select(p =>
            (p.Item2 == 1 ? Environment.NewLine : "") + p.Item1));
    }
}

internal sealed class FieldReference
{
    public readonly Section Section;
    public readonly int Row;
    public readonly string Field;
    private readonly string message;

    public FieldReference(Section section, int row, string field, string message)
    {
        Section = section;
        Row = row;
        Field = field;
        this.message = message;
    }

    public override string ToString() { return message; }
}