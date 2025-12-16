import { Platform } from 'react-native';

// Production backend URL (Render'a deploy edince bu URL'yi güncelleyin)
// Örnek: https://barberapp-backend.onrender.com
const PRODUCTION_URL = 'https://your-app-name.onrender.com';

// Development için local IP
const LOCAL_IP = '192.168.1.13';
const PORT = '5000';

// Otomatik URL yapılandırması
export const API_URL = __DEV__
  ? Platform.select({
      web: `http://localhost:${PORT}`,
      android: `http://10.0.2.2:${PORT}`, // Android Emulator için standart IP
      ios: `http://${LOCAL_IP}:${PORT}`,
      default: `http://${LOCAL_IP}:${PORT}`,
    })
  : PRODUCTION_URL; // Production build'de DigitalOcean URL'sini kullan

// Debug için
export const getAPIInfo = () => ({
  platform: Platform.OS,
  apiUrl: API_URL,
  localIp: LOCAL_IP,
  port: PORT,
});

console.log('API Configuration:', getAPIInfo());
