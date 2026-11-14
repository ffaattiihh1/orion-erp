# Tablet MDM — Kurulum Rehberi (ücretsiz)

Google **Android Management API** kullanılır. Ücretsizdir, Google Cloud'da **faturalandırma (kart) açmanız gerekmez**.
Bu rehberdeki işlemler bir kez yapılır.

> Neden Pub/Sub yok? Kayıp modundaki konumu ERP'ye getirmek için Google Pub/Sub gerekir ve o, faturalandırma ister.
> Bu yüzden konum için tablette açık Google hesabıyla **google.com/android/find** (Cihazımı Bul) kullanılır — o da ücretsiz.

---

## 1. Google Cloud projesi

1. <https://console.cloud.google.com> adresine **tablet@orionarastirma.com** (ya da Workspace yönetici hesabınız) ile girin.
2. Üstteki proje seçiciden **Yeni Proje** → ad: `orion-mdm` → Oluştur. Faturalandırma hesabı sorarsa boş bırakın.
3. Sol menü **API'ler ve Hizmetler → Kitaplık** → "Android Management API" arayın → **Etkinleştir**.

## 2. Servis hesabı ve anahtar

1. **IAM ve Yönetici → Hizmet Hesapları → Hizmet hesabı oluştur**
   - Ad: `orion-mdm`
   - Rol: **Android Management User**
2. Oluşan hesaba tıklayın → **Anahtarlar → Anahtar ekle → Yeni anahtar oluştur → JSON**. Bir `.json` dosyası iner.

> **"Service account key creation is disabled" hatası alırsanız:** Workspace'e bağlı yeni Google Cloud
> organizasyonlarında anahtar oluşturma varsayılan olarak kapalıdır.
> Workspace süper yöneticisi olarak **IAM ve Yönetici → Kuruluş Politikaları** → `iam.disableServiceAccountKeyCreation`
> ("Disable service account key creation") → **Politikayı yönet** → bu proje için **Geçersiz kıl → Kapalı** yapın.
> Rol yetkisi isterse kendinize organizasyon düzeyinde **Organization Policy Administrator** rolünü verin.
> Sonra 2. adımı tekrarlayın.

## 3. Anahtarı Vercel'e koyun

1. İnen JSON dosyasını base64'e çevirip panoya kopyalayın (PowerShell):

   ```powershell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("$HOME\Downloads\orion-mdm-xxxx.json")) | Set-Clipboard
   ```

2. Vercel → proje → **Settings → Environment Variables**:
   - Ad: `GOOGLE_SERVICE_ACCOUNT_JSON`
   - Değer: panodaki metin
   - Ortam: Production (ve istiyorsanız Preview)
3. **Deployments → son deploy → Redeploy**.
4. İndirilen `.json` dosyasını bilgisayarınızdan **silin** (anahtar sadece Vercel'de dursun).

## 4. Şirket kaydı (enterprise)

1. ERP → **Tablet MDM** (sadece yöneticiler görür).
2. "Servis hesabı anahtarı" adımı yeşil olmalı.
3. Hesap kutusunda `tablet@orionarastirma.com` → **Google'da kaydı başlat**.
4. Google'ın sayfasında adımları tamamlayın (şirket adı: Orion Araştırma). İş bitince ERP'ye geri dönersiniz ve
   "Google kaydı tamamlandı" mesajı çıkar.

> Google, Workspace hesabını bu kayıt için kabul etmezse aynı adımı ücretsiz bir Gmail hesabıyla
> (ör. orion.tablet@gmail.com) yapın; işleyiş aynıdır. Sonra **Ayarlar**'dan "Sıfırlama koruması hesabı"nı
> tablet@orionarastirma.com olarak bırakabilirsiniz.

5. **Ayarlar** (dişli simgesi) → "Kayıp modunda gösterilecek telefon"u girin → Kaydet.

## 5. İlk tablet (deneme — Lenovo TB350FU)

1. Tabletin şarjı %50'nin üzerinde olsun. **Ayarlar → Sistem → Sıfırlama → Fabrika verilerine sıfırla**.
2. ERP → Tablet MDM → **Yeni tablet kaydet** → ad `ON-T01` (zimmet kaydındaki kodla aynı yazarsanız otomatik bağlanır)
   → isterseniz Wi‑Fi adı/şifresi → **QR kodu üret**.
3. Tablet açılınca "Merhaba / Hoş geldiniz" ekranında boş bir yere **6 kez** dokunun → QR okuyucu açılır → kodu okutun.
4. Kurulum 5–10 dk sürer; iField otomatik kurulur.
5. ERP'de **Yenile** → ON-T01 görünür. Kontrol edin:
   - Son bağlantı, pil, Android sürümü dolu mu?
   - "Politikaya uygun" yazıyor mu? (Uyumsuzsa kartta nedeni görünür.)
   - **Kilitle** komutu tabletin ekranını kapatıyor mu?
   - Tablette Ayarlar'dan konumu kapatmayı ve fabrika ayarına dönmeyi deneyin — ikisi de engelli olmalı.
6. Cihazımı Bul için: tablette **Ayarlar → Hesaplar → Hesap ekle → Google** ile tabletin Google hesabını ekleyin ve
   zimmet kaydındaki "Cihazdaki Google hesabı" alanına yazın.

Deneme sorunsuzsa **Ayarlar → Kiosk modu**'nu açıp yine aynı tablette deneyin (ana ekranda yalnızca iField kalır).
Sonra diğer tabletleri aynı yolla kaydedin.

## Komutlar

| Komut | Ne yapar | Not |
|---|---|---|
| Kilitle | Ekranı hemen kilitler | |
| Şifre sıfırla | Yeni PIN koyar ve kilitler | Sonraki 12 saat kayıp modu açılamaz |
| Kayıp modu | Tableti kilitler, ekranda mesaj + telefon gösterir | Android 11+; "Bulundu" ile kapatılır |
| Sil | Fabrika ayarına döndürür, MDM'den çıkarır | **Geri alınamaz**; tablet adını yazarak onaylanır. Sıfırlanan tablet açılışta şirket hesabını ister. |

Tablet internete bağlı değilse komutlar, tablet internete ilk bağlandığında uygulanır.
