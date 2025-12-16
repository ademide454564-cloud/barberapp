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

export default function RegisterScreen({ navigation, route }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const returnTo = route.params?.returnTo || 'Home';
  const returnParams = route.params?.returnParams || {};

  const sendVerificationCode = async () => {
    if (!phoneNumber.trim() || phoneNumber.length < 10) {
      Alert.alert('Hata', 'Geçerli bir telefon numarası girin');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/auth/send-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phoneNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        setSentCode(data.code);
        setStep(2);
        Alert.alert(
          'Kod Gönderildi',
          `Telefon numaranıza doğrulama kodu gönderildi.\n\n[TEST] Kod: ${data.code}`,
          [{ text: 'Tamam' }]
        );
      } else {
        Alert.alert('Hata', data.message || 'Kod gönderilemedi');
      }
    } catch (error) {
      Alert.alert('Hata', 'Doğrulama kodu gönderilemedi');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (verificationCode.length !== 6) {
      Alert.alert('Hata', 'Lütfen 6 haneli kodu girin');
      return;
    }

    setStep(3);
  };

  const completeRegistration = async () => {
    if (!name.trim()) {
      Alert.alert('Hata', 'Lütfen adınızı girin');
      return;
    }

    if (!password.trim() || password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/auth/verify-and-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: phoneNumber,
          code: verificationCode,
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('userPhone', phoneNumber);
        await AsyncStorage.setItem('userName', name);
        await AsyncStorage.setItem('userEmail', email || '');
        await AsyncStorage.setItem('isLoggedIn', 'true');
        await AsyncStorage.setItem('isAdmin', data.customer.is_admin ? 'true' : 'false');
        await AsyncStorage.setItem('userData', JSON.stringify({
          phone_number: phoneNumber,
          name: name,
          email: email || '',
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

        Alert.alert(
          'Kayıt Başarılı!',
          'Hesabınız başarıyla oluşturuldu.',
          [
            {
              text: 'Tamam',
              onPress: () => navigation.navigate(returnTo, returnParams),
            },
          ]
        );
      } else {
        Alert.alert('Hata', data.message || 'Kayıt başarısız');
      }
    } catch (error) {
      Alert.alert('Hata', 'Kayıt sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kayıt Ol</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={step === 1 ? 'phone' : step === 2 ? 'message-text' : 'account-edit'}
            size={64}
            color={Colors.primary}
          />
        </View>

        <Text style={styles.title}>
          {step === 1 ? 'Telefon Numaranız' : step === 2 ? 'Doğrulama Kodu' : 'Bilgileriniz'}
        </Text>

        <Text style={styles.subtitle}>
          {step === 1
            ? 'Kayıt olmak için telefon numaranızı girin'
            : step === 2
            ? `${phoneNumber} numarasına gönderilen kodu girin`
            : 'Son olarak adınızı ve e-posta adresinizi girin'}
        </Text>

        {step === 1 && (
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
        )}

        {step === 2 && (
          <View>
            <TextInput
              style={styles.codeInput}
              placeholder="000000"
              placeholderTextColor="#ADB5BD"
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus={true}
            />
            {sentCode && (
              <Text style={styles.testCodeText}>[TEST] Kod: {sentCode}</Text>
            )}
          </View>
        )}

        {step === 3 && (
          <View>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="account" size={20} color="#868E96" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Adınız Soyadınız"
                placeholderTextColor="#ADB5BD"
                value={name}
                onChangeText={setName}
                autoFocus={true}
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="email" size={20} color="#868E96" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="E-posta (Opsiyonel)"
                placeholderTextColor="#ADB5BD"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="lock" size={20} color="#868E96" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Şifre (en az 6 karakter)"
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

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="lock-check" size={20} color="#868E96" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Şifre Tekrar"
                placeholderTextColor="#ADB5BD"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            ((step === 1 && !phoneNumber) ||
              (step === 2 && verificationCode.length !== 6) ||
              (step === 3 && (!name || !password || !confirmPassword))) &&
              styles.buttonDisabled,
          ]}
          onPress={step === 1 ? sendVerificationCode : step === 2 ? verifyCode : completeRegistration}
          disabled={
            loading ||
            (step === 1 && !phoneNumber) ||
            (step === 2 && verificationCode.length !== 6) ||
            (step === 3 && (!name || !password || !confirmPassword))
          }
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {step === 1 ? 'Kod Gönder' : step === 2 ? 'Doğrula' : 'Kayıt Ol'}
            </Text>
          )}
        </TouchableOpacity>

        {step === 2 && (
          <TouchableOpacity style={styles.resendButton} onPress={sendVerificationCode} disabled={loading}>
            <Text style={styles.resendButtonText}>Kodu Tekrar Gönder</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login', { returnTo, returnParams })}
        >
          <Text style={styles.loginLinkText}>
            Zaten hesabınız var mı? <Text style={styles.loginLinkBold}>Giriş Yapın</Text>
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
  codeInput: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 16,
    color: '#1A1A1A',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  testCodeText: {
    fontSize: 13,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '600',
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
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
  resendButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  resendButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  loginLink: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  loginLinkText: {
    fontSize: 15,
    color: '#868E96',
  },
  loginLinkBold: {
    fontWeight: '700',
    color: Colors.primary,
  },
});
