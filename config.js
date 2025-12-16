import { Platform } from 'react-native';

// Production backend URL (Render'a deploy edince bu URL'yi güncelleyin)
// Örnek: https://barberapp-backend.onrender.com
const PRODUCTION_URL = 'https://barberapp-server.onrender.com';

// Development için local IP
const LOCAL_IP = '192.168.1.13';
const PORT = '5000';

// Otomatik URL yapılandırması
// Her zaman Render backend kullan (Expo Go'da da çalışır)
export const API_URL = PRODUCTION_URL;

// Debug için
export const getAPIInfo = () => ({
  platform: Platform.OS,
  apiUrl: API_URL,
  localIp: LOCAL_IP,
  port: PORT,
});

console.log('API Configuration:', getAPIInfo());
