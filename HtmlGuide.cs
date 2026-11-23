using System.Collections.Generic;
using System.Net;
using System.Text;

internal static class HtmlGuide
{
    private static readonly string[,] Topics = {
        {"start", "Başlangıç ve klavyeyle gezinme", "Getting started and keyboard navigation",
            "Uygulamayı açtığınızda odak CV bölümleri listesindedir. Ok tuşlarıyla bölüm, Tab ile sonraki denetim, Shift+Tab ile önceki denetim seçilir. Alt ile menü çubuğuna geçebilir, menülerde ok tuşlarıyla dolaşabilirsiniz. Esc iletişim pencerelerini kapatır.",
            "When the app opens, focus starts in the CV sections list. Use the arrow keys to select a section, Tab to move to the next control and Shift+Tab to move back. Press Alt to reach the menu bar, then use the arrow keys to navigate. Esc closes dialogs."},
        {"drafts", "Taslak oluşturma, değiştirme ve çoğaltma", "Creating, switching and duplicating drafts",
            "Dosya menüsünden Yeni taslak’ı seçin ve bir ad verin. Etkin taslak kutusundan başka bir CV’ye geçebilirsiniz. Aynı CV’yi farklı bir başvuruya uyarlamak için Etkin taslağı çoğalt’ı seçin. Taslağı yeniden adlandır komutu yalnızca taslak adını değiştirir.",
            "Choose New draft from File and enter a name. Switch CVs with the Active draft list. To adapt an existing CV to another application, choose Duplicate active draft. Rename draft changes the draft name only."},
        {"editing", "CV bölümlerini ve kayıtları düzenleme", "Editing CV sections and entries",
            "Kişisel bilgiler ile Özet ve beceriler bölümlerinde Enter düzenleme formunu açar. Diğer bölümlerde Kayıt ekle ile yeni bir kayıt oluşturun veya listedeki kaydı seçip Enter’a basın. Tab ve Shift+Tab ile alanları dolaşın. Kaydet değişiklikleri yerel taslağa yazar. İptal ile formdaki değişikliklerden vazgeçebilirsiniz. Yukarı taşı ve Aşağı taşı düğmeleri kayıtların çıktıdaki sırasını değiştirir. Sil komutu onay ister. Düzen menüsünden bu oturumda etkin taslaktan son silinen kaydı geri alabilirsiniz.",
            "Press Enter in Personal information or Summary and skills to open the form. In other sections, choose Add entry or select a row and press Enter. Use Tab and Shift+Tab to move between fields. Save writes changes to the local draft. Cancel discards changes in the form. Move up and Move down change the order in the export. Delete asks for confirmation. The Edit menu can restore the last entry deleted from the active draft during this session."},
        {"find", "Arama ve CV denetimi", "Search and CV review",
            "Düzen menüsünde CV’de ara ile alan adını veya girdiğiniz metni bulun. Arama alanında Enter sonuçları listeler. Ok tuşlarıyla sonucu seçip Enter’a basınca ilgili düzenleme alanına gidilir. Araçlar menüsündeki CV denetimi eksik ve hatalı olabilecek alanları listeler. Bulgudan alana geçmek için aynı tuşları kullanın. Düzenleme penceresini kapattığınızda sonuç veya bulgu listesine dönersiniz.",
            "Use Find in CV from Edit to find a field name or text you entered. Press Enter in the search box to list results. Choose one with the arrow keys and press Enter to focus its field. Review CV in Tools lists fields that might be missing or invalid. Use the same keys to visit a finding. Closing the editor takes you back to the results or findings."},
        {"compare", "İş ilanıyla karşılaştırma", "Comparing a job posting",
            "Araçlar menüsünde İş ilanını karşılaştır’ı açın, ilanı yapıştırın ve Karşılaştır’a basın. Rapor, öne çıkan terimlerin CV’de geçip geçmediğini gösterir. Sözcük eşleşmesi başvuru uygunluğunu veya eş anlamları değerlendirmez. İlan metni kaydedilmez ve sunucuya gönderilmez. İsterseniz raporu panoya kopyalayabilirsiniz.",
            "Open Compare job posting in Tools, paste the posting and choose Compare. The report shows which common terms appear in the CV. Word matches do not assess suitability or synonyms. The posting is neither saved nor sent to a server. You can copy the report to the clipboard."},
        {"ai", "OpenAI ve Gemini ile profesyonel özet", "Professional summaries with OpenAI and Gemini",
            "Ayarlar → Yapay zekâ sağlayıcıları bölümünde kendi OpenAI veya Gemini API anahtarınızı ekleyin. Mevcut anahtarı korumak için alanı boş bırakın. Anahtarı kaldırmak için ilgili kutuyu seçip Kaydet’e basın. Anahtarlar Windows kullanıcı hesabına bağlı olarak şifrelenir. Araçlar → Yapay zekâ ile özet öner’i açın. Sağlayıcıyı seçin ve gönderilecek metni inceleyin. Varsayılan metin mesleki unvanı ve becerileri içerir. Gönder seçilen sağlayıcıya istek yapar ve ücret doğurabilir. Dönen metni doğrulayıp düzenleyin. Uygula etkin taslağın profesyonel özetini değiştirir.",
            "Add your own OpenAI or Gemini API key under Settings → AI providers. Leave a field blank to keep its saved key. To delete a key, select its remove box and choose Save. Keys are encrypted for your Windows account. Open Tools → Suggest summary with AI. Choose a provider and review the text to send. The initial text contains the professional title and skills. Send makes a request to the chosen provider and may incur charges. Check and edit the reply. Apply replaces the active draft’s professional summary."},
        {"export", "Önizleme ve dışa aktarma", "Previewing and exporting",
            "Görünüm → Düz metin önizlemesi bölüm sırasını gösterir. Tüm metni kopyala CV’yi panoya alır. Dosya menüsünde Word, PDF veya düz metin biçimini seçin, dosyanın adını ve konumunu belirleyin. Word çıktısında bölümler başlık olarak işaretlenir. Word gezinti bölmesini veya ekran okuyucunuzun başlık komutunu kullanabilirsiniz. PDF çıktısı seçilebilir metin, başlık etiketleri ve yer imleri içerir. Başlık gezinmesi için etiketli PDF destekleyen bir okuyucu kullanın.",
            "View → Plain text preview shows the section order. Copy all text copies the CV to the clipboard. From File, choose Word, PDF or plain text and set the filename and location. CV sections in Word use headings. Use the Word Navigation pane or your screen reader’s heading command. PDF exports include selectable text, heading tags and bookmarks. Use a reader that supports tagged PDFs for heading navigation."},
        {"data", "Yedekleme ve yerel veriler", "Backups and local data",
            "Dosya → JSON yedekle ile etkin taslağın düzenlenebilir bir yedeğini alın. JSON içe aktar, eskiden dışa aktarılmış Electron JSON dosyaları dahil desteklenen yedekleri ayrı taslak olarak açar. CV içeriği ve yedekler kişisel bilgi içerebilir. Kurulu sürüm taslak ve tercihleri Windows kullanıcı profilinde saklar. Taşınabilir sürüm bunları kendi Data klasöründe saklar. API anahtarları her iki sürümde de kullanıcı hesabında kalır ve CV yedeğine dahil edilmez.",
            "Choose File → Back up as JSON for an editable backup of the active draft. Import JSON opens supported backups, including exported Electron JSON files, as separate drafts. CV content and backups may contain personal information. The installed edition stores drafts and preferences in the Windows user profile. The portable edition stores them in its own Data folder. Both editions keep API keys in the user profile and exclude them from CV backups."},
        {"support", "Geri bildirim ve güncellemeler", "Feedback and updates",
            "Yardım → Geri bildirim formunda adınızı, soyadınızı ve sorununuzu veya önerinizi yazın. E-posta taslağı aç, info@selcukucar.com adresine bir taslak hazırlar. Posta uygulamanızda inceleyip Gönder’i seçin. Posta uygulaması açılamazsa taslağı kopyalayıp web postanıza yapıştırabilirsiniz. Yardım → Güncellemeleri denetle, kullandığınız paket türüne uygun yeni masaüstü sürümünü arar. İndirmeyi seçerseniz dosyayı kaydeder ve SHA-256 özetini doğrular. Kurulu sürümü güncellemek için indirilen kurulum dosyasını açın. Taşınabilir sürümde uygulamayı kapatın ve yeni ZIP’i aynı klasöre çıkarın. Data klasörünüzü saklayın.",
            "Enter your first name, last name, and issue or suggestion in Help → Feedback. Open email draft prepares a message to info@selcukucar.com. Review and send it in your email application. If the email application cannot open, copy the draft into webmail. Help → Check for updates looks for a new desktop release for your package type. If you choose to download, it saves the file and verifies its SHA-256 digest. To update the installed edition, open the setup file. For portable updates, close the app and extract the new ZIP into the same folder. Keep your Data folder."},
        {"settings", "Görünüm, bildirimler ve kısayollar", "Appearance, announcements and shortcuts",
            "Araçlar → Ayarlar’dan yazı boyutunu ve otomatik durum duyurularını seçin. Uygulama Windows sistem renklerini izler. Dili değiştirdiğinizde uygulamayı yeniden açın. Görünüm → Son işlem durumu, son kaydetme veya düzenleme mesajını okunabilir bir pencerede açar. Yardım → Klavye kısayolları’nda bir komut seçip örneğin Ctrl+Shift+P yazın. Kısayolu değiştir ile listeye işleyin, Kaydet ile uygulayın. Kısayolu kaldırmak için alanı boş bırakın. Varsayılanlara dön tüm tuşları ilk hâline hazırlar, Kaydet ile onaylanır.",
            "Choose the text size and automatic status announcements under Tools → Settings. The app follows Windows system colors. Reopen the app after changing its language. View → Last operation status opens the latest save or edit message in a readable window. Under Help → Keyboard shortcuts, choose a command and type a binding such as Ctrl+Shift+P. Use Change shortcut to update the list and Save to apply it. Leave the field blank to clear a shortcut. Restore defaults prepares the default bindings and Save confirms them."}
    };

    public static string Render(IEnumerable<ShortcutCommand> commands)
    {
        string title = L.T("Öz Geçmiş Asistanı kullanım kılavuzu", "CV Assistant user guide");
        string shortcuts = L.T("Etkin klavye kısayolları", "Current keyboard shortcuts");
        var html = new StringBuilder();
        html.Append("<!doctype html><html lang=\"").Append(L.Language).Append("\"><head><meta charset=\"utf-8\">")
            .Append("<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>").Append(E(title)).Append("</title>")
            .Append("<style>:root{color-scheme:light dark}body{font:1.05rem/1.6 system-ui,sans-serif;margin:0 auto;padding:1.5rem;max-width:50rem}")
            .Append("h1,h2{line-height:1.2}h2{margin-top:2rem}a:focus-visible{outline:3px solid currentColor;outline-offset:3px}")
            .Append("table{border-collapse:collapse;width:100%}caption{text-align:left;font-weight:bold}th,td{border:1px solid;padding:.4rem;text-align:left}</style></head><body>")
            .Append("<a href=\"#guide\">").Append(E(L.T("Kılavuza geç", "Skip to guide"))).Append("</a>")
            .Append("<header><h1>").Append(E(title)).Append("</h1></header><nav aria-labelledby=\"topics\"><h2 id=\"topics\">")
            .Append(E(L.T("İçindekiler", "Contents"))).Append("</h2><ul>");
        for (int i = 0; i < Topics.GetLength(0); i++)
            html.Append("<li><a href=\"#").Append(Topics[i, 0]).Append("\">").Append(E(L.T(Topics[i, 1], Topics[i, 2]))).Append("</a></li>");
        html.Append("<li><a href=\"#shortcuts\">").Append(E(shortcuts)).Append("</a></li></ul></nav><main id=\"guide\" tabindex=\"-1\">");
        for (int i = 0; i < Topics.GetLength(0); i++)
            html.Append("<section><h2 id=\"").Append(Topics[i, 0]).Append("\">").Append(E(L.T(Topics[i, 1], Topics[i, 2])))
                .Append("</h2><p>").Append(E(L.T(Topics[i, 3], Topics[i, 4]))).Append("</p></section>");
        html.Append("<section><h2 id=\"shortcuts\">").Append(E(shortcuts)).Append("</h2><table><caption>")
            .Append(E(L.T("Uygulama komutları ve atanmış tuşlar", "Application commands and assigned keys")))
            .Append("</caption><thead><tr><th scope=\"col\">").Append(E(L.T("Komut", "Command")))
            .Append("</th><th scope=\"col\">").Append(E(L.T("Kısayol", "Shortcut"))).Append("</th></tr></thead><tbody>");
        foreach (var command in commands)
        {
            string keys = Shortcuts.Format(command.Item.ShortcutKeys);
            html.Append("<tr><th scope=\"row\">").Append(E(command.Name)).Append("</th><td>")
                .Append(E(keys.Length == 0 ? L.T("Atanmamış", "Unassigned") : keys)).Append("</td></tr>");
        }
        return html.Append("</tbody></table></section></main></body></html>").ToString();
    }

    private static string E(string text) { return WebUtility.HtmlEncode(text); }
}