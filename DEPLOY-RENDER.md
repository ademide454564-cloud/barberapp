# Render.com'a Backend Deploy Rehberi

Render.com ile backend'inizi **tamamen ücretsiz** ve 7/24 çalışır hale getirin!

## ⚡ Avantajlar
- ✅ Tamamen ücretsiz (sınırsız süre)
- ✅ Çok kolay setup (5-10 dakika)
- ✅ Otomatik HTTPS
- ✅ GitHub'dan otomatik deploy
- ⚠️ 15 dakika kullanılmazsa uyur (ilk istek 30sn gecikir)

---

## 1. MongoDB Atlas Kurulumu (15 dakika)

### Adım 1.1: Hesap Oluşturun
1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)'a gidin
2. Google veya email ile ücretsiz hesap oluşturun
3. "Create a Deployment" butonuna tıklayın

### Adım 1.2: Cluster Oluşturun
1. **M0 (FREE)** seçeneğini seçin - sonsuza kadar ücretsiz
2. Provider: **AWS**
3. Region: **Frankfurt (eu-central-1)** veya size en yakın bölge
4. Cluster Name: `Cluster0` (varsayılan) veya `barberapp`
5. "Create Deployment" butonuna tıklayın

### Adım 1.3: Güvenlik Ayarları
Deploy oluşturduktan sonra bir popup açılacak:

**1. Database User Oluşturun:**
- Username: `barberuser` (istediğiniz bir isim)
- Password: **Güçlü bir şifre oluşturun** (örn: `SecurePass123!`)
- ⚠️ **Bu şifreyi kaydedin** - sonra lazım olacak
- "Create Database User" butonuna tıklayın

**2. IP Whitelist Ekleyin:**
- "My Local Environment" seçin
- IP Address: `0.0.0.0/0` (Allow access from anywhere)
- Description: `Render Backend`
- "Add Entry" butonuna tıklayın
- "Finish and Close" butonuna tıklayın

### Adım 1.4: Connection String Alın
1. Sol menüden **Database** sekmesine tıklayın
2. Cluster'ınızın yanındaki **Connect** butonuna tıklayın
3. **Drivers** seçeneğini seçin
4. Driver: **Node.js**, Version: **5.5 or later**
5. Connection string'i kopyalayın:
   ```
   mongodb+srv://barberuser:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. **Şifreyi değiştirin:** `<password>` yerine Adım 1.3'te oluşturduğunuz şifreyi yazın
7. **Database adı ekleyin:** Sonuna `/barberapp` ekleyin:
   ```
   mongodb+srv://barberuser:SecurePass123!@cluster0.xxxxx.mongodb.net/barberapp?retryWrites=true&w=majority
   ```

✅ Connection string'i bir yere kaydedin!

---

## 2. GitHub'a Kod Yükleyin (5 dakika)

### Adım 2.1: GitHub Repository Oluşturun
1. [GitHub.com](https://github.com)'a gidin ve giriş yapın
2. Sağ üstten **+** > **New repository** tıklayın
3. Repository name: `barberapp`
4. Visibility: **Public** seçin (Render ücretsiz tier için gerekli)
5. **"Create repository"** butonuna tıklayın

### Adım 2.2: Kodunuzu Yükleyin
Proje klasörünüzde Command Prompt veya Terminal açın:

```bash
cd C:\Users\Casper\barberapp
```

Sonra şu komutları sırayla çalıştırın:

```bash
git init
git add .
git commit -m "Initial commit - barber app"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADINIZ/barberapp.git
git push -u origin main
```

⚠️ **ÖNEMLİ:** `KULLANICI_ADINIZ` yerine kendi GitHub kullanıcı adınızı yazın!

**Örnek:**
```bash
git remote add origin https://github.com/johndoe/barberapp.git
```

GitHub şifrenizi sorarsa girin. İki faktörlü doğrulama varsa [Personal Access Token](https://github.com/settings/tokens) kullanın.

---

## 3. Render'a Deploy Edin (10 dakika)

### Adım 3.1: Render Hesabı Oluşturun
1. [Render.com](https://render.com)'a gidin
2. **"Get Started for Free"** butonuna tıklayın
3. **GitHub ile Sign Up** yapın (daha kolay)
4. GitHub hesabınızla bağlanın ve yetki verin

### Adım 3.2: Web Service Oluşturun
1. Render Dashboard'da **"New +"** butonuna tıklayın
2. **"Web Service"** seçin
3. GitHub repository'nizi bağlayın:
   - "Configure account" > "Only select repositories" > `barberapp` seçin
   - "Install" butonuna tıklayın
4. Repository listesinde `barberapp` görünecek, yanındaki **"Connect"** butonuna tıklayın

### Adım 3.3: Service Ayarlarını Yapılandırın

Açılan formda şu bilgileri girin:

| Alan | Değer |
|------|-------|
| **Name** | `barberapp-backend` (veya istediğiniz isim) |
| **Region** | **Frankfurt (EU Central)** (size en yakın) |
| **Branch** | `main` |
| **Root Directory** | **boş bırakın** |
| **Runtime** | **Node** |
| **Build Command** | `cd backend && npm install` |
| **Start Command** | `cd backend && npm start` |

⚠️ **Build ve Start Command'ları aynen kopyalayın!**

### Adım 3.4: Plan Seçin
- Instance Type: **Free** seçin
- Free plan özellikleri:
  - 512 MB RAM
  - Shared CPU
  - 15 dakika inaktif kalınca uyur
  - İlk istek 30sn gecikir

"Advanced" butonuna tıklayın.

### Adım 3.5: Environment Variables Ekleyin
"Environment Variables" bölümünde **Add Environment Variable** butonuna tıklayarak şunları ekleyin:

| Key | Value |
|-----|-------|
| `PORT` | `5000` |
| `MONGODB_URI` | MongoDB Atlas'tan aldığınız connection string |
| `NODE_ENV` | `production` |
| `WORKING_START` | `09:00` |
| `WORKING_END` | `18:00` |

**Örnek MONGODB_URI:**
```
mongodb+srv://barberuser:SecurePass123!@cluster0.xxxxx.mongodb.net/barberapp?retryWrites=true&w=majority
```

### Adım 3.6: Deploy Başlat
1. Tüm ayarları kontrol edin
2. **"Create Web Service"** butonuna tıklayın
3. Deploy başlayacak - 5-10 dakika sürer
4. Logs'u izleyin: "Build successful" ve "Server running" mesajlarını görmelisiniz

---

## 4. Backend URL'nizi Alın ve Test Edin

### Adım 4.1: URL'yi Alın
Deploy tamamlandığında:
1. Sayfanın en üstünde backend URL'niz görünecek
2. Şuna benzer olacak: `https://barberapp-backend.onrender.com`
3. Bu URL'yi kopyalayın

### Adım 4.2: Test Edin
Tarayıcınızda şu URL'yi açın:
```
https://barberapp-backend.onrender.com/health
```

✅ Şunu görmelisiniz:
```json
{"ok":true,"timestamp":"2025-12-15T..."}
```

❌ Eğer hata alırsanız:
- Render Dashboard > Logs sekmesini kontrol edin
- MONGODB_URI doğru mu kontrol edin

---

## 5. Mobil Uygulamayı Bağlayın

### Adım 5.1: config.js Dosyasını Düzenleyin
1. Proje klasöründe `config.js` dosyasını açın (zaten açık)
2. `PRODUCTION_URL` satırını bulun:
   ```javascript
   const PRODUCTION_URL = 'https://your-app-name.onrender.com';
   ```
3. Render'dan aldığınız URL ile değiştirin:
   ```javascript
   const PRODUCTION_URL = 'https://barberapp-backend.onrender.com';
   ```
4. **Ctrl+S** ile kaydedin

### Adım 5.2: Değişiklikleri GitHub'a Yükleyin
```bash
git add config.js
git commit -m "Update production URL to Render"
git push
```

Render otomatik olarak yeni kodu algılayıp deploy edecek (~2 dakika).

### Adım 5.3: Nasıl Çalışır?

**Development Mode (Expo Go ile test ederken):**
- `__DEV__` true olduğu için lokal backend kullanılır
- Bilgisayarınızda backend çalıştırmalısınız
- URL: `http://192.168.1.13:5000`

**Production Build (APK/IPA oluşturduktan sonra):**
- `__DEV__` false olduğu için Render backend kullanılır
- Bilgisayarınız kapalı olsa bile çalışır
- URL: `https://barberapp-backend.onrender.com`

---

## 6. Veritabanına İlk Veriler Ekleyin (Opsiyonel)

### Yöntem 1: MongoDB Compass (Görsel)
1. [MongoDB Compass](https://www.mongodb.com/try/download/compass) indirin
2. MongoDB Atlas connection string ile bağlanın
3. Manuel olarak servis, personel vb. ekleyin

### Yöntem 2: Seed Script (Otomatik)
Backend'inizde `backend/seed.js` varsa, bunu Render'da çalıştırabilirsiniz:

1. Render Dashboard > barberapp-backend > **Shell** sekmesine tıklayın
2. Şu komutu yazın:
   ```bash
   cd backend && node seed.js
   ```
3. Enter'a basın - örnek veriler oluşacak

---

## 7. Test Edin

### Backend Testi
Tarayıcıda şu URL'leri test edin:

```
https://barberapp-backend.onrender.com/health
https://barberapp-backend.onrender.com/services
https://barberapp-backend.onrender.com/staff
```

### Mobil Uygulama Testi
1. Expo projenizi başlatın: `npx expo start`
2. Expo Go'da uygulamanızı açın (**Dev mode**)
3. Servisler, personeller vb. görünüyor mu kontrol edin

Not: Dev mode'da hala lokal backend kullanılır. Production test için APK oluşturmanız gerekir.

---

## 8. Production APK Oluşturun (Bonus)

Production'da Render backend'i kullanmak için:

```bash
npx eas build --platform android --profile preview
```

veya

```bash
expo build:android
```

APK yüklendiğinde Render backend otomatik kullanılacak.

---

## 🎯 Sonuç

✅ **Tamamladıklarınız:**
- MongoDB Atlas ücretsiz database
- Render.com ücretsiz backend hosting
- GitHub'da kod versiyonlama
- Otomatik deployment (her git push'ta)
- Production-ready mobil app yapısı

💰 **Maliyet:**
- MongoDB Atlas M0: **Ücretsiz**
- Render Free Tier: **Ücretsiz**
- GitHub Public Repo: **Ücretsiz**
- **TOPLAM: ₺0/ay**

---

## 🔧 Otomatik Deployment

Artık kod değişikliklerini deploy etmek çok kolay:

```bash
# Backend değişikliği yaptınız
git add .
git commit -m "Fix appointment bug"
git push

# Render otomatik olarak 2 dakika içinde deploy edecek
```

---

## 📊 Monitoring ve Yönetim

### Render Dashboard
- **Logs:** Gerçek zamanlı backend logları
- **Metrics:** CPU, RAM, istek sayısı grafikleri
- **Events:** Her deploy geçmişi
- **Shell:** Backend'de komut çalıştırma

### MongoDB Atlas Dashboard
- **Metrics:** Database performansı
- **Collections:** Verilerinizi görüntüleme
- **Backup:** Otomatik yedekleme (ücretsiz)

---

## ⚠️ Önemli Notlar

### Free Tier Kısıtlamaları
1. **15 dakika inaktivite sonrası uyur:**
   - İlk istek 30 saniye gecikir
   - Sonraki istekler normal hızda

2. **Aylık 750 saat çalışma limiti:**
   - 7/24 çalışırsa 720 saat = yeterli

3. **Otomatik uyandırma:**
   - İlk kullanıcı isteği backend'i uyandırır
   - Veya her 14 dakikada bir health check atabilirsiniz

### Upgrade Seçenekleri
Daha fazla trafiğiniz olursa:
- Render **Starter Plan**: $7/ay - Uyumaz, daha hızlı
- Render **Standard Plan**: $25/ay - Daha güçlü

---

## 🐛 Sorun Giderme

### Backend çalışmıyor
1. Render Dashboard > Logs kontrol edin
2. "Build failed" var mı?
   - Build command doğru mu: `cd backend && npm install`
   - Start command doğru mu: `cd backend && npm start`

### MongoDB bağlanamıyor
1. Atlas > Network Access > `0.0.0.0/0` var mı?
2. MONGODB_URI doğru mu?
3. Şifrede özel karakter varsa URL encode edin: `!` → `%21`

### App açılıyor ama veri gelmiyor
1. config.js'de PRODUCTION_URL doğru mu?
2. Production build mi yoksa dev mode mu? (Dev mode'da lokal backend kullanılır)
3. Backend loglarında hata var mı?

### "Application Error" mesajı
1. Render Logs'a bakın
2. MongoDB bağlantısı başarılı mı kontrol edin
3. Environment variables kaydedildi mi?

---

## 📞 Yardım Kaynakları

- **Render Docs:** https://render.com/docs
- **MongoDB Atlas Docs:** https://docs.atlas.mongodb.com/
- **Render Community:** https://community.render.com/
- **MongoDB Forums:** https://www.mongodb.com/community/forums/

---

## 🚀 Sonraki Adımlar

1. **Domain bağlama:** Render'da custom domain ekleyebilirsiniz (ücretli planlarda)
2. **Monitoring:** UptimeRobot ile backend uptime takibi
3. **Analytics:** Backend'e analytics ekleyin
4. **Backup:** MongoDB Atlas otomatik backup yapıyor

İyi çalışmalar! 🎉
