import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors } from './constants/Colors';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from './config';

// Screens
import HomeScreen from './screens/HomeScreen';
import BookingScreen from './screens/NewBookingScreen';
import MyAppointmentsScreen from './screens/MyAppointmentsScreen';
import AdminScreen from './screens/AdminScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ReviewScreen from './screens/ReviewScreen';
import NotificationCenterScreen from './screens/NotificationCenterScreen';

// Admin Management Screens
import ServicesScreen from './screens/admin/management/ServicesScreen';
import BlockedTimesScreen from './screens/admin/management/BlockedTimesScreen';
import AddCustomerScreen from './screens/admin/management/AddCustomerScreen';
import NewVisitScreen from './screens/admin/management/NewVisitScreen';
import GalleryManagementScreen from './screens/admin/management/GalleryManagementScreen';
import ReviewsManagementScreen from './screens/admin/management/ReviewsManagementScreen';

// Admin Settings Screens
import CalendarSettingsScreen from './screens/admin/settings/CalendarSettingsScreen';
import NotificationSettingsScreen from './screens/admin/settings/NotificationSettingsScreen';
import GeneralSettingsScreen from './screens/admin/settings/GeneralSettingsScreen';

// Admin Report Screens
import BlacklistScreen from './screens/admin/reports/BlacklistScreen';
import AppointmentHistoryScreen from './screens/admin/reports/AppointmentHistoryScreen';
import FrequentCancellersScreen from './screens/admin/reports/FrequentCancellersScreen';
import RevenueReportScreen from './screens/admin/reports/RevenueReportScreen';

const Stack = createNativeStackNavigator();

// Bildirimlerin nasıl gösterileceğini ayarla
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Bildirim izni iste ve token'ı al
    registerForPushNotificationsAsync();

    // Bildirim geldiğinde dinle
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Bildirime tıklandığında dinle
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification clicked:', response);
    });

    return () => {
      if (notificationListener.current && notificationListener.current.remove) {
        notificationListener.current.remove();
      }
      if (responseListener.current && responseListener.current.remove) {
        responseListener.current.remove();
      }
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.background },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Booking" component={BookingScreen} />
            <Stack.Screen name="MyAppointments" component={MyAppointmentsScreen} />
            <Stack.Screen name="Admin" component={AdminScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Review" component={ReviewScreen} />
            <Stack.Screen name="NotificationCenter" component={NotificationCenterScreen} />

            {/* Admin Management Screens */}
            <Stack.Screen name="Services" component={ServicesScreen} />
            <Stack.Screen name="BlockedTimes" component={BlockedTimesScreen} />
            <Stack.Screen name="AddCustomer" component={AddCustomerScreen} />
            <Stack.Screen name="NewVisit" component={NewVisitScreen} />
            <Stack.Screen name="GalleryManagement" component={GalleryManagementScreen} />
            <Stack.Screen name="ReviewsManagement" component={ReviewsManagementScreen} />

            {/* Admin Settings Screens */}
            <Stack.Screen name="CalendarSettings" component={CalendarSettingsScreen} />
            <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
            <Stack.Screen name="GeneralSettings" component={GeneralSettingsScreen} />

            {/* Admin Report Screens */}
            <Stack.Screen name="Blacklist" component={BlacklistScreen} />
            <Stack.Screen name="AppointmentHistory" component={AppointmentHistoryScreen} />
            <Stack.Screen name="FrequentCancellers" component={FrequentCancellersScreen} />
            <Stack.Screen name="RevenueReport" component={RevenueReportScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// Push notification için kayıt ol ve token al
async function registerForPushNotificationsAsync() {
  let token;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Bildirim izni alınamadı!');
        return;
      }

      // Expo Go SDK 53+ bu özelliği desteklemiyor, development build gerekli
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Push token:', token);

      // Token'ı AsyncStorage'a kaydet
      await AsyncStorage.setItem('pushToken', token);

      // Kullanıcı giriş yapmışsa token'ı backend'e gönder
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        await updatePushToken(user.phone_number, token);
      }
    } else {
      console.log('Fiziksel cihaz gerekli');
    }
  } catch (error) {
    console.log('⚠️ Push notifications Expo Go\'da desteklenmiyor (SDK 53+)');
    console.log('Uygulama normal çalışmaya devam edecek, sadece bildirimler devre dışı.');
    // Hata olsa bile uygulama çalışmaya devam etsin
  }

  return token;
}

// Backend'e push token'ı gönder
async function updatePushToken(phone_number, pushToken) {
  try {
    await axios.post(`${API_URL}/customers/update-push-token`, {
      phone_number,
      push_token: pushToken,
    });
    console.log('Push token güncellendi');
  } catch (error) {
    console.error('Push token güncellenemedi:', error);
  }
}
