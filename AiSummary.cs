using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using Data = System.Collections.Generic.Dictionary<string, object>;

internal static class AiSummary
{
    private static readonly HttpClient Client = new HttpClient(new HttpClientHandler { AllowAutoRedirect = false })
    {
        Timeout = TimeSpan.FromSeconds(45),
        MaxResponseContentBufferSize = 1024 * 1024
    };

    internal static string DraftInput(Data cv)
    {
        var form = (Data)cv["form"];
        var lines = new[] {
            Line(L.T("Hedef unvan", "Target title"), Model.Value(form, "title")),
            Line(L.T("Beceriler", "Skills"), Model.Value(form, "skills"))
        };
        return string.Join(Environment.NewLine, lines.Where(line => line.Length > 0));
    }

    private static string Line(string label, string value)
    {
        return string.IsNullOrWhiteSpace(value) ? "" : label + ": " + value.Trim();
    }

    internal static HttpRequestMessage CreateRequest(string provider, string input, string key)
    {
        string instructions = "Draft a short professional CV summary in " + L.T("Turkish", "English") +
            ". Use only facts in the user's notes. Never invent employers, skills, achievements or qualifications. " +
            "Omit contact details. Return only the summary as plain text in two or three sentences.";
        bool gemini = provider == ApiKeys.Gemini;
        var request = new HttpRequestMessage(HttpMethod.Post, gemini
            ? "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent"
            : "https://api.openai.com/v1/responses");
        Data body;
        if (gemini)
        {
            request.Headers.Add("x-goog-api-key", key);
            body = new Data {
                { "systemInstruction", TextParts(instructions) },
                { "contents", new[] { TextParts(input) } },
                { "generationConfig", new Data { { "maxOutputTokens", 600 } } }
            };
        }
        else
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", key);
            body = new Data {
                { "model", "gpt-5.4-mini" }, { "input", input }, { "instructions", instructions },
                { "store", false }, { "max_output_tokens", 350 }
            };
        }

        request.Content = new StringContent(new JavaScriptSerializer().Serialize(body), Encoding.UTF8, "application/json");
        return request;
    }

    private static Data TextParts(string text)
    {
        return new Data { { "parts", new[] { new Data { { "text", text } } } } };
    }

    public static async Task<string> Generate(string provider, string input, string key, CancellationToken cancel)
    {
        // Old Windows installations may default to a TLS version the API no longer accepts.
        if (ServicePointManager.SecurityProtocol != 0)
            ServicePointManager.SecurityProtocol |= SecurityProtocolType.Tls12;
        using (var request = CreateRequest(provider, input, key))
        using (var response = await Client.SendAsync(request, cancel).ConfigureAwait(false))
        {
            if (!response.IsSuccessStatusCode) throw new InvalidOperationException(ErrorMessage(provider, response.StatusCode));
            return ReadSummary(provider, await response.Content.ReadAsStringAsync().ConfigureAwait(false));
        }
    }

    internal static string ReadSummary(string provider, string json)
    {
        var result = new JavaScriptSerializer().DeserializeObject(json) as Data;
        var text = new List<string>();
        if (provider == ApiKeys.Gemini)
        {
            var candidate = Items(result, "candidates").FirstOrDefault();
            if (Model.Value(candidate, "finishReason") == "STOP")
                text.AddRange(Items(Model.Get(candidate, "content") as Data, "parts")
                    .Where(part => !Equals(Model.Get(part, "thought"), true))
                    .Select(part => Model.Value(part, "text")));
        }
        else if (Model.Value(result, "status") == "completed")
        {
            foreach (var message in Items(result, "output").Where(item => Model.Value(item, "type") == "message"))
                text.AddRange(Items(message, "content").Where(part => Model.Value(part, "type") == "output_text")
                    .Select(part => Model.Value(part, "text")));
        }

        string summary = string.Join(Environment.NewLine, text.Where(part => !string.IsNullOrWhiteSpace(part))).Trim();
        if (summary.Length == 0)
            throw new InvalidDataException(string.Format(L.T("{0} kullanılabilir bir özet döndürmedi.", "{0} did not return a usable summary."), provider));
        return summary;
    }

    private static IEnumerable<Data> Items(Data data, string key)
    {
        var values = Model.Get(data, key) as object[] ?? new object[0];
        return values.OfType<Data>();
    }

    private static string ErrorMessage(string provider, HttpStatusCode status)
    {
        switch ((int)status)
        {
            case 401:
            case 403:
                return string.Format(L.T("{0} anahtarı veya proje erişimi doğrulanamadı.",
                    "{0} could not authenticate the key or project access."), provider);
            case 429:
                return string.Format(L.T("{0} kullanım sınırına ulaşıldı. Proje kotasını ve faturalamayı kontrol edin.",
                    "{0} usage is limited. Check your project quota and billing."), provider);
            default:
                return string.Format(L.T("{0} isteği başarısız oldu. HTTP {1}.",
                    "The {0} request failed. HTTP {1}."), provider, (int)status);
        }
    }
}