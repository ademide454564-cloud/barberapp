# DigitalOcean'a Backend Deploy Rehberi

Bu rehber, backend'inizi DigitalOcean App Platform'a deploy etmeniz için adım adım talimatlar içerir.

## Ön Hazırlık

### 1. MongoDB Atlas Hesabı Oluşturun

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)'a gidin ve ücretsiz hesap oluşturun
2. "Create a New Cluster" seçeneğine tıklayın
3. **FREE tier (M0)** seçin - tamamen ücretsiz
4. Region olarak yakın bir bölge seçin (örn: Frankfurt/Germany)
5. Cluster Name: `barberapp` (veya istediğiniz bir isim)
6. "Create Cluster" butonuna tıklayın (2-3 dakika sürer)

### 2. MongoDB Veritabanı Kullanıcısı Oluşturun

1. Sol menüden **Database Access** seçeneğine tıklayın
2. "Add New Database User" butonuna tıklayın
3. Authentication Method: **Password**
4. Username: `barberuser` (veya istediğiniz isim)
5. Password: Güçlü bir şifre oluşturun ve **kaydedin** (örn: `MySecurePass123!`)
6. Database User Privileges: **Read and write to any database**
7. "Add User" butonuna tıklayın

### 3. IP Whitelist Ayarlayın

1. Sol menüden **Network Access** seçeneğine tıklayın
2. "Add IP Address" butonuna tıklayın
3. "Allow Access from Anywhere" seçeneğini seçin (0.0.0.0/0)
4. "Confirm" butonuna tıklayın

### 4. Connection String Alın

1. Sol menüden **Database** seçeneğine tıklayın
2. Cluster'ınızın yanındaki "Connect" butonuna tıklayın
3. "Connect your application" seçeneğini seçin
4. Driver: **Node.js**, Version: **5.5 or later**
5. Connection string'i kopyalayın, şuna benzer olacak:
   ```
   mongodb+srv://barberuser:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. `<password>` yerine adım 2'de oluşturduğunuz şifreyi yazın
7. Connection string'in sonuna `/barberapp` ekleyin:
   ```
   mongodb+srv://barberuser:MySecurePass123!@cluster0.xxxxx.mongodb.net/barberapp?retryWrites=true&w=majority
   ```

---

## DigitalOcean Deployment

### 1. GitHub Repository Oluşturun

1. [GitHub](https://github.com)'a gidin ve giriş yapın
2. Sağ üstten "New repository" butonuna tıklayın
3. Repository name: `barberapp`
4. Privacy: **Private** (önerilir)
5. "Create repository" butonuna tıklayın

### 2. Kodunuzu GitHub'a Yükleyin

Proje klasörünüzde (C:\Users\Casper\barberapp) şu komutları çalıştırın:

```bash
git init
git add .
git commit -m "Initial commit - barber app backend"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADINIZ/barberapp.git
git push -u origin main
```

**Not:** `KULLANICI_ADINIZ` yerine kendi GitHub kullanıcı adınızı yazın.

### 3. DigitalOcean Hesabı Oluşturun

1. [DigitalOcean](https://www.digitalocean.com/)'a gidin
2. "Sign Up" ile hesap oluşturun
3. Ödeme yönteminizi ekleyin (ilk $200 kredi alabilirsiniz, yeni kullanıcılar için)

### 4. App Platform'da Uygulama Oluşturun

1. DigitalOcean Dashboard'da **Apps** sekmesine tıklayın
2. "Create App" butonuna tıklayın
3. Source: **GitHub** seçin ve hesabınızı bağlayın
4. Repository: `barberapp` seçin
5. Branch: `main` seçin
6. Source Directory: **boş bırakın** (root directory kullanacağız)
7. Autodeploy: **Açık** bırakın (her git push'ta otomatik deploy olur)
8. "Next" butonuna tıklayın

### 5. Uygulama Ayarlarını Yapılandırın

#### Resource Type (Kaynak Türü):
- Type: **Web Service** seçin
- Name: `barberapp-backend`

#### Build Command:
```bash
npm install
```

#### Run Command:
```bash
npm start
```

#### Source Directory:
```
/
```

**Not:** Eğer "Detected: Node.js" yazısını görürseniz otomatik algılanmıştır, bu ayarlar zaten doğru olacaktır.

"Next" butonuna tıklayın.

### 6. Environment Variables (Çevre Değişkenleri) Ekleyin

1. "Edit" veya "Environment Variables" bölümüne tıklayın
2. Şu değişkenleri ekleyin:

| Key | Value |
|-----|-------|
| `PORT` | `5000` |
| `MONGODB_URI` | MongoDB Atlas'tan aldığınız connection string |
| `NODE_ENV` | `production` |
| `WORKING_START` | `09:00` |
| `WORKING_END` | `18:00` |

**Önemli:** `MONGODB_URI` değerine Atlas'tan kopyaladığınız tam connection string'i yapıştırın.

3. "Save" butonuna tıklayın

### 7. Plan Seçin

1. Plan seçimi ekranında **Basic** planı seçin
2. Size: **$5/mo** (512 MB RAM, 1 vCPU) yeterli olacaktır
3. "Next" butonuna tıklayın

### 8. Deploy Edin

1. Tüm ayarları gözden geçirin
2. "Create Resources" butonuna tıklayın
3. Deploy işlemi başlayacak (5-10 dakika sürebilir)

### 9. Backend URL'nizi Alın

Deploy tamamlandığında:
1. App sayfanızda **Live App URL** göreceksiniz
2. Şuna benzer olacak: `https://barberapp-backend-xxxxx.ondigitalocean.app`
3. Bu URL'yi kopyalayın

Test için tarayıcınızda şu URL'yi açın:
```
https://barberapp-backend-xxxxx.ondigitalocean.app/health
```

`{"ok":true,"timestamp":"..."}` görmelisiniz.

---

## Mobil Uygulamayı Güncelleyin

### config.js Dosyasını Düzenleyin

1. `config.js` dosyasını açın
2. `PRODUCTION_URL` satırını bulun:
   ```javascript
   const PRODUCTION_URL = 'https://your-app-name.ondigitalocean.app';
   ```
3. DigitalOcean'dan aldığınız URL ile değiştirin:
   ```javascript
   const PRODUCTION_URL = 'https://barberapp-backend-xxxxx.ondigitalocean.app';
   ```
4. Dosyayı kaydedin

### Test Edin

1. **Development modunda** (Expo Go ile çalıştırırken):
   - Eski lokal backend kullanılacak (`http://192.168.1.13:5000`)
   - Bilgisayarınızda backend çalıştırmanız gerekir

2. **Production build'de** (APK/IPA oluşturduktan sonra):
   - DigitalOcean backend kullanılacak
   - Bilgisayarınız kapalı olsa bile çalışır

---

## Veritabanı Verilerini Taşıma (Opsiyonel)

Eğer lokal veritabanınızda var olan verileriniz varsa:

### Yöntem 1: Manuel Export/Import

1. MongoDB Compass kullanarak lokal verilerinizi export edin
2. MongoDB Atlas'a import edin

### Yöntem 2: Seed Script

Backend'inizde `backend/seed.js` dosyanız var. DigitalOcean'a deploy edildikten sonra:

1. DigitalOcean Console'da App'inize gidin
2. "Console" sekmesine tıklayın
3. Şu komutları çalıştırın:
   ```bash
   cd backend
   node seed.js
   ```

---

## Sonraki Adımlar

### 1. Domain Bağlama (Opsiyonel)

Kendi domain'iniz varsa (örn: `api.berberim.com`):
1. DigitalOcean App sayfasında "Settings" > "Domains" bölümüne gidin
2. "Add Domain" butonuna tıklayın
3. Domain'inizi girin ve DNS ayarlarını yapın

### 2. Monitoring ve Loglar

- DigitalOcean Dashboard > Apps > barberapp-backend
- **Insights** sekmesi: CPU, RAM, istek sayısı grafikleri
- **Runtime Logs** sekmesi: Console.log çıktıları ve hatalar

### 3. Otomatik Deploy

Artık her `git push` yaptığınızda:
1. DigitalOcean otomatik olarak yeni kodu algılayacak
2. Build yapacak
3. Deploy edecek
4. ~2-3 dakika içinde canlıya alacak

---

## Sorun Giderme

### Backend çalışmıyor / 503 hatası

1. DigitalOcean'da Logs'u kontrol edin
2. MONGODB_URI doğru mu kontrol edin
3. Environment variables kaydedilmiş mi kontrol edin

### MongoDB bağlanamıyor

1. Atlas'ta IP Whitelist'te `0.0.0.0/0` var mı kontrol edin
2. Connection string'de şifre doğru mu kontrol edin
3. Database user'ı oluşturdunuz mu kontrol edin

### Uygulama deploy olmuyor

1. GitHub repository public veya DigitalOcean'a erişim verilmiş mi
2. package.json doğru mu
3. Build logs'ta hata var mı kontrol edin

---

## Maliyet

- **MongoDB Atlas**: Ücretsiz (M0 tier - 512MB)
- **DigitalOcean App Platform**: $5/ay (Basic plan)
- **GitHub**: Ücretsiz (Private repo için)

**Toplam**: ~$5/ay

---

## Destek

Herhangi bir sorun yaşarsanız:
- DigitalOcean Community: https://www.digitalocean.com/community
- MongoDB Documentation: https://docs.mongodb.com/
- Backend logs'u kontrol edin

İyi çalışmalar!
