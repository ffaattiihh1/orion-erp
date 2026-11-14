# Tablet MDM — Kurulum Rehberi (ManageEngine, ücretsiz)

Tabletler **ManageEngine Mobile Device Manager Plus Cloud** ile yönetilir (mdm.manageengine.eu, AB veri merkezi).
25 tablete kadar ücretsizdir. ERP'deki **Tablet MDM** ekranı bu panele bağlanıp tabletlerin son bağlantısını, pilini
ve konumunu gösterir; kilit, alarm ve kayıp modu komutlarını gönderir.

> Neden Google Android Management API değil? Google, yeni projelere cihaz kotası vermiyor ve bu API'yi
> yalnızca başka firmalara MDM satan şirketlere açıyor. Bu yüzden ManageEngine'e geçildi.

---

## 1. ManageEngine panelindeki ayarlar (yapıldı)

| Ayar | Nerede | Değer |
|---|---|---|
| QR ile kayıt | Enrollment → QR Code Enrollment | Şablon yeni tableti otomatik **Saha Tabletleri** grubuna koyar |
| Profil | Device Mgmt → Profiles → **Orion Saha Tablet** | Gruba bağlı |
| Kısıtlamalar | Profil → Restrictions | Fabrika ayarı, güvenli mod, geliştirici modu kapalı · konum **her zaman açık** · sahte konum ve USB veri kapalı |
| Sıfırlama koruması (EFRP) | Profil → EFRP | **saha@orionarastirma.com** — zorla sıfırlanan tablet açılışta bu hesabı ister |
| Konum takibi | Inventory → Geo Tracking | Her zaman · geçmiş 30 gün · 100 m hareket |

Tablette Play Store için **orionarastirma@gmail.com** eklenir ve iField Play Store'dan elle kurulur.

## 2. ERP'yi ManageEngine'e bağlama (bir kez)

1. <https://api-console.zoho.eu> adresine ManageEngine hesabıyla girin → **Self Client** → oluşturun.
2. Çıkan **Client ID** ve **Client Secret**'ı Vercel → orion-erp → Settings → Environment Variables'a ekleyin:
   - `ZOHO_CLIENT_ID`
   - `ZOHO_CLIENT_SECRET`
   Sonra **Deployments → son deploy → Redeploy**.
3. Zoho konsolunda Self Client → **Generate Code**:
   - Scope: `MDMOnDemand.MDMInventory.ALL,MDMOnDemand.MDMDeviceMgmt.ALL`
   - Süre: 10 dakika, açıklama: Orion ERP → **Create**
4. ERP → **Tablet MDM** → kodu yapıştırın → **Bağlan**. Kod tek seferliktir; ERP bunu kalıcı bir bağlantıya çevirip saklar.

İsteğe bağlı ortam değişkenleri: `ZOHO_ACCOUNTS_URL` (varsayılan `https://accounts.zoho.eu`),
`MDM_BASE_URL` (varsayılan `https://mdm.manageengine.eu`), `ZOHO_REFRESH_TOKEN` (kod yerine doğrudan vermek için).

> Deneme süresi bitince hesap ücretsiz sürüme geçer. Ücretsiz sürümün API'ye izin verip vermediği belgelerde yazmıyor.
> İzin vermezse ERP ekranı "ManageEngine erişimi reddetti" der; panel ve ManageEngine telefon uygulaması çalışmaya devam eder.

## 3. Yeni tablet ekleme

1. Tableti fabrika ayarına sıfırlayın ve açın.
2. "Hoş geldiniz" ekranında boş bir yere **6 kez** dokunun → QR okuyucu açılır.
3. ManageEngine → Enrollment → QR Code Enrollment ekranındaki QR'ı okutun.
4. Kurulum bitince tablete orionarastirma@gmail.com'u ekleyip iField'ı Play Store'dan kurun.
5. ERP → Tablet MDM → **Yenile** → kartta **Ad ver** ile ON-T numarasını verin.
   Zimmet kaydındaki kodla aynı ad (ya da aynı seri no) otomatik eşleşir; olmazsa **Bağla** ile elle seçin.

## Komutlar (ERP'den)

| Komut | Ne yapar |
|---|---|
| Kilitle | Ekranı hemen kilitler |
| Alarm çal | Tablet sessizde olsa da ses çıkarır |
| Konumu güncelle | Tabletten yeni konum ister (1-2 dk sonra Yenile) |
| Ad ver | Paneldeki adı değiştirir (ON-T01 …) |
| Kayıp modu | Tableti kilitler, ekranda mesaj + telefon gösterir, ilk 24 saat her 30 dk konum gönderir. "Bulundu" ile kapatılır |

**Silme** ERP'de bilerek yok; gerekirse yalnızca ManageEngine panelinden yapılır.
Tablet internete bağlı değilse komutlar, tablet internete ilk bağlandığında uygulanır.
