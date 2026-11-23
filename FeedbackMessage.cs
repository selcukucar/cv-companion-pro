using System;

internal sealed class FeedbackMessage
{
    public const string Recipient = "info@selcukucar.com";
    public readonly string Subject;
    public readonly string Body;

    public FeedbackMessage(string firstName, string lastName, string problem)
    {
        Subject = L.T("Öz Geçmiş Asistanı geri bildirimi", "CV Assistant feedback");
        Body = L.T("Ad", "First name") + ": " + firstName.Trim() + "\r\n" +
            L.T("Soyad", "Last name") + ": " + lastName.Trim() + "\r\n\r\n" +
            L.T("Sorun veya öneri", "Issue or suggestion") + ":\r\n" +
            problem.Trim().Replace("\r\n", "\n").Replace('\r', '\n').Replace("\n", "\r\n");
    }

    public string MailUri()
    {
        // Long mailto URLs are not handled consistently by Windows mail applications.
        if (Body.Length > 4000) return null;
        string uri = "mailto:" + Recipient + "?subject=" + Uri.EscapeDataString(Subject) +
            "&body=" + Uri.EscapeDataString(Body);
        return uri.Length <= 6000 ? uri : null;
    }

    public string CopyText()
    {
        return L.T("Alıcı", "To") + ": " + Recipient + "\r\n" +
            L.T("Konu", "Subject") + ": " + Subject + "\r\n\r\n" + Body;
    }
}
