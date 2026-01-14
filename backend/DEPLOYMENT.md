# Backend Deployment Rehberi

Bu rehber, Kaan Herli Barber App backend'ini production ortamına deploy etmek için gerekli adımları içerir.

## Seçenek 1: Render.com (ÖNERİLEN - ÜCRETSİZ)

### 1. Hazırlık
1. GitHub hesabınızda bir repository oluşturun
2. Backend kodlarınızı GitHub'a push edin:
```bash
cd backend
git init
git add .
git commit -m "Initial backend commit"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### 2. Render.com'da Proje Oluşturma
1. https://render.com adresine gidin ve GitHub ile giriş yapın
2. "New +" butonuna tıklayın ve "Web Service" seçin
3. GitHub repository'nizi seçin
4. Ayarları yapın:
   - **Name**: `barberapp-backend` (veya istediğiniz isim)
   - **Root Directory**: `backend` (eğer backend klasörü içindeyse)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free` (0$/ay)

### 3. Environment Variables (Çevre Değişkenleri)
Render dashboard'da "Environment" sekmesine gidin ve şu değişkenleri ekleyin:

```
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
ATLAS_URI=your_mongodb_atlas_connection_string
NETGSM_USERNAME=your_netgsm_username
NETGSM_PASSWORD=your_netgsm_password
NETGSM_MSGHEADER=your_netgsm_header
SMS_ENABLED=true
```

**NOT**: MongoDB connection string'i MongoDB Atlas'tan alabilirsiniz (ücretsiz).

### 4. Deploy
1. "Create Web Service" butonuna tıklayın
2. Render otomatik olarak deploy işlemini başlatacak
3. Deploy tamamlandığında size bir URL verecek (örn: https://barberapp-backend.onrender.com)

### 5. App'i Güncelleme
Deploy sonrası verilen URL'yi `config.js` dosyasında güncelleyin:

```javascript
const PRODUCTION_URL = 'https://barberapp-backend.onrender.com';
const USE_PRODUCTION = true; // APK derlerken true yapın
```

---

## Seçenek 2: Railway.app (ÜCRETSİZ)

### 1. Railway'e Kayıt
1. https://railway.app adresine gidin
2. GitHub ile giriş yapın

### 2. Yeni Proje Oluşturma
1. "New Project" > "Deploy from GitHub repo"
2. Repository'nizi seçin
3. Backend klasörünü seçin

### 3. Environment Variables
Railway dashboard'da Settings > Variables bölümünden yukarıdaki environment variables'ı ekleyin.

### 4. Deploy
Railway otomatik deploy edecek ve size bir URL verecek.

---

## Seçenek 3: Kendi Sunucunuz (VPS)

Eğer DigitalOcean, Linode, AWS EC2 gibi bir VPS'niz varsa:

### 1. Sunucuya Bağlanma
```bash
ssh root@your_server_ip
```

### 2. Node.js Kurulumu
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. PM2 Kurulumu (Process Manager)
```bash
npm install -g pm2
```

### 4. Kod Aktarma
```bash
cd /var/www
git clone YOUR_GITHUB_REPO_URL
cd YOUR_REPO_NAME/backend
npm install
```

### 5. .env Dosyası Oluşturma
```bash
nano .env
# Yukarıdaki environment variables'ı yapıştırın
```

### 6. PM2 ile Başlatma
```bash
pm2 start index.js --name barberapp-backend
pm2 save
pm2 startup
```

### 7. Nginx Reverse Proxy (Opsiyonel)
Domain kullanmak için nginx kurabilirsiniz.

---

## MongoDB Atlas Kurulumu (Gerekli)

Backend'in çalışması için bir MongoDB veritabanına ihtiyacı var.

1. https://www.mongodb.com/cloud/atlas adresine gidin
2. Ücretsiz hesap oluşturun
3. Free Cluster oluşturun (0$/ay)
4. Database Access'den user oluşturun
5. Network Access'den 0.0.0.0/0 ekleyin (tüm IP'lere izin ver)
6. "Connect" > "Connect your application" > Connection string'i kopyalayın
7. String içindeki `<password>` kısmını şifrenizle değiştirin
8. Bu connection string'i `ATLAS_URI` ve `MONGODB_URI` olarak environment variables'a ekleyin

---

## Test Etme

Deploy sonrası test için:

```bash
curl https://YOUR_BACKEND_URL/services
```

Eğer servisler dönüyorsa backend çalışıyor demektir.

---

## Sorun Giderme

### 1. Backend başlamıyor
- Render/Railway log'larını kontrol edin
- Environment variables'ların doğru girildiğinden emin olun
- MongoDB connection string'in doğru olduğundan emin olun

### 2. SMS gönderilmiyor
- NETGSM bilgilerinizi kontrol edin
- SMS_ENABLED=true olduğundan emin olun

### 3. Cron job çalışmıyor
- Render'ın free tier'ında uygulama 15 dakika inaktiviteden sonra sleep mode'a geçer
- Bu durumda paid plan'e geçmeniz veya başka bir servis kullanmanız gerekir

---

## Güncellemeler

Kod değişikliği yaptığınızda:

1. GitHub'a push edin:
```bash
git add .
git commit -m "Update message"
git push
```

2. Render/Railway otomatik deploy edecek
3. VPS kullanıyorsanız:
```bash
git pull
pm2 restart barberapp-backend
```

---

## Maliyet

- **Render.com Free**: 0$/ay (sleep mode var, 15dk inaktivite sonrası)
- **Render.com Paid**: 7$/ay (always-on, daha iyi performans)
- **Railway.app Free**: 0$/ay (500 saat/ay limit)
- **Railway.app Paid**: 5$/ay'dan başlayan fiyatlar
- **MongoDB Atlas Free**: 0$/ay (512MB storage)
- **VPS (DigitalOcean)**: 5-10$/ay

---

## Önerilen Kurulum

Küçük işletmeler için:
1. **MongoDB Atlas** (Free tier) - Veritabanı
2. **Render.com** (Paid 7$/ay) - Backend hosting (always-on gerekli cron job için)
3. **APK build** - Frontend (Google Play Store'da yayınlayabilirsiniz)

**Toplam maliyet**: ~7$/ay
