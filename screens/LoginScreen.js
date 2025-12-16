import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { API_URL } from '../config';

export default function LoginScreen({ navigation, route }) {
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const returnTo = route.params?.returnTo || 'Home';
  const returnParams = route.params?.returnParams || {};

  const handleLogin = async () => {
    if (!phoneNumber.trim() || phoneNumber.length < 10) {
      Alert.alert('Hata', 'Geçerli bir telefon numarası girin');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Hata', 'Şifre gereklidir');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: phoneNumber,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('userPhone', phoneNumber);
        await AsyncStorage.setItem('userName', data.customer.name);
        await AsyncStorage.setItem('userEmail', data.customer.email || '');
        await AsyncStorage.setItem('isLoggedIn', 'true');
        await AsyncStorage.setItem('isAdmin', data.customer.is_admin ? 'true' : 'false');
        await AsyncStorage.setItem('userData', JSON.stringify({
          phone_number: phoneNumber,
          name: data.customer.name,
          email: data.customer.email || '',
        }));

        // Push token'ı backend'e gönder
        const pushToken = await AsyncStorage.getItem('pushToken');
        if (pushToken) {
          try {
            await fetch(`${API_URL}/customers/update-push-token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                phone_number: phoneNumber,
                push_token: pushToken,
              }),
            });
          } catch (error) {
            console.log('Push token gönderilemedi:', error);
          }
        }

        if (data.customer.is_admin) {
          Alert.alert(
            'Hoş Geldiniz!',
            'Admin paneline yönlendiriliyorsunuz...',
            [
              {
                text: 'Tamam',
                onPress: () => {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Admin' }],
                  });
                },
              },
            ]
          );
        } else {
          Alert.alert(
            'Giriş Başarılı!',
            'Hoş geldiniz!',
            [
              {
                text: 'Tamam',
                onPress: () => navigation.navigate(returnTo, returnParams),
              },
            ]
          );
        }
      } else {
        if (response.status === 404) {
          Alert.alert(
            'Kullanıcı Bulunamadı',
            'Bu telefon numarası ile kayıtlı kullanıcı yok. Kayıt olmak ister misiniz?',
            [
              { text: 'İptal', style: 'cancel' },
              {
                text: 'Kayıt Ol',
                onPress: () => navigation.navigate('Register', { returnTo, returnParams }),
              },
            ]
          );
        } else {
          Alert.alert('Hata', data.message || 'Giriş başarısız');
        }
      }
    } catch (error) {
      Alert.alert('Hata', 'Giriş sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const isAdminLogin = phoneNumber === '5541215231';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giriş Yap</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={isAdminLogin ? 'shield-account' : 'login'}
            size={64}
            color={Colors.primary}
          />
        </View>

        <Text style={styles.title}>
          {isAdminLogin ? 'Admin Girişi' : 'Hoş Geldiniz'}
        </Text>

        <Text style={styles.subtitle}>
          {isAdminLogin
            ? 'Yönetim paneline erişmek için bilgilerinizi girin'
            : 'Giriş yapmak için bilgilerinizi girin'}
        </Text>

        <View style={styles.inputContainer}>
          <MaterialCommunityIcons name="phone" size={20} color="#868E96" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="05XX XXX XX XX"
            placeholderTextColor="#ADB5BD"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            maxLength={11}
            autoFocus={true}
          />
        </View>

        <View style={styles.inputContainer}>
          <MaterialCommunityIcons name="lock" size={20} color="#868E96" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Şifre"
            placeholderTextColor="#ADB5BD"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <MaterialCommunityIcons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color="#868E96"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            (!phoneNumber || !password) && styles.buttonDisabled,
          ]}
          onPress={handleLogin}
          disabled={loading || !phoneNumber || !password}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons
                name={isAdminLogin ? 'shield-check' : 'login'}
                size={24}
                color="#fff"
              />
              <Text style={styles.buttonText}>Giriş Yap</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => navigation.navigate('Register', { returnTo, returnParams })}
        >
          <Text style={styles.registerLinkText}>
            Hesabınız yok mu? <Text style={styles.registerLinkBold}>Kayıt Olun</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#868E96',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#F1F3F5',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    fontSize: 16,
    color: '#1A1A1A',
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ADB5BD',
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  registerLink: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  registerLinkText: {
    fontSize: 15,
    color: '#868E96',
  },
  registerLinkBold: {
    fontWeight: '700',
    color: Colors.primary,
  },
});
