# Barber App - Kullanım Kılavuzu

## 🔥 Network Request Failed Hatası Çözümü

### Sorun Neydi?
Her gün **"Network request failed"** hatası alıyordunuz çünkü:
- ❌ Backend sunucusu otomatik başlamıyordu
- ❌ IP adresi her dosyada farklı hardcode edilmişti
- ❌ Hata mesajları neyin yanlış olduğunu göstermiyordu

### Çözüm: Artık 3 Kolay Yöntem Var!

---

## 🚀 Yöntem 1: Tek Tıkla Her Şeyi Başlat (ÖNERİLEN)

```
start-all.bat
```

Bu dosyayı çift tıklayın, hem backend hem frontend otomatik başlar!

---

## 🚀 Yöntem 2: Sadece Backend Başlat

```
start-backend.bat
```

Backend'i çalıştırır, sonra ayrı bir terminalde frontend'i manuel başlatabilirsiniz.

---

## 🚀 Yöntem 3: Manuel Başlatma

### Backend:
```bash
cd backend
node index.js
```

### Frontend (yeni terminal):
```bash
npx expo start
```

---

## 📱 IP Adresi Değişirse Ne Yapmalıyım?

IP adresiniz değiştiğinde **SADECE BİR DOSYAYI** düzenleyin:

### `config.js` dosyasını açın:
```javascript
const LOCAL_IP = '192.168.1.13';  // ← Buraya yeni IP'nizi yazın
```

### Mevcut IP Adresinizi Öğrenme:
```bash
ipconfig
```

**Wi-Fi** bölümündeki **IPv4 Address** satırına bakın.

---

## ✅ Her Şey Çalışıyor mu Kontrol Et

### Backend Çalışıyor mu?
Tarayıcıda aç: http://192.168.1.13:5000/services

Eğer JSON veri görüyorsan ✅ Backend çalışıyor!

### Terminal'de Hatalar Var mı?
Expo terminalinde şunları göreceksin:
```
API Configuration: {
  platform: 'android',
  apiUrl: 'http://192.168.1.13:5000',
  ...
}
```

Eğer hata varsa:
```
❌ Error loading services: ...
📍 API URL: http://192.168.1.13:5000
💡 Lütfen backend sunucusunu başlattığınızdan emin olun
```

---

## 🛠️ Yapılan Değişiklikler

### 1. **config.js** oluşturuldu
- Tüm IP yapılandırması tek bir yerde
- Platform bazlı otomatik ayarlama

### 2. **Startup scriptler** eklendi
- `start-all.bat` - Her şeyi başlat
- `start-backend.bat` - Sadece backend
- `start-app.bat` - Sadece frontend

### 3. **Tüm screen dosyaları güncellendi**
- HomeScreen.js
- BookingScreen.js
- MyAppointmentsScreen.js
- AdminScreen.js
- Artık hepsi `config.js` kullanıyor

### 4. **Gelişmiş hata mesajları**
- Ne olduğunu anlaşılır şekilde gösteriyor
- Nasıl düzelteceğini söylüyor

---

## 🎯 Artık Yaşamayacağınız Sorunlar

✅ Backend'i unutup "neden çalışmıyor" diye sormak
✅ Her dosyada farklı IP adresi değiştirmek
✅ Hangi IP'yi kullanacağınızı karıştırmak
✅ Hata mesajının ne anlama geldiğini anlayamamak

---

## 📞 Hala Sorun mu Var?

1. Backend'in çalıştığından emin ol: `netstat -ano | findstr :5000`
2. IP adresinin doğru olduğunu kontrol et: `ipconfig`
3. Telefon ve bilgisayar aynı WiFi'de mi?
4. Firewall backend'i engelliyor mu?

---

## 💪 Kalıcı Çözüm İçin

Windows başlangıçta otomatik başlatmak için:
1. `start-all.bat` dosyasına sağ tık
2. "Kısayol oluştur"
3. Kısayolu buraya taşı: `C:\Users\[KullanıcıAdın]\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup`

Artık bilgisayar açıldığında backend otomatik başlayacak!

---

**Hazırlayan:** Claude Code
**Tarih:** 2025-12-04
