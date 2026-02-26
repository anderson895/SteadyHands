import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { Link, router } from 'expo-router';
import { loginUser } from '../../src/database/db';
import { useAuth } from '../../src/context/AuthContext';
import { colors, fonts } from '../../src/constants/theme';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Missing Info', 'Please enter username and password.');
      return;
    }
    setLoading(true);
    try {
      const user = await loginUser(username.trim(), password);
      if (user) {
        login(user);
        if (user.role === 'caregiver') {
          router.replace('/(caregiver)/dashboard');
        } else {
          router.replace('/(patient)/exercises');
        }
      } else {
        Alert.alert('Login Failed', 'Invalid username or password.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Branding */}
        <View style={styles.brand}>
          {/* <Image
            source={require('../../assets/logo.jpg')}
            style={styles.logo}
            resizeMode="contain"
          /> */}
          <Text style={styles.brandTitle}>SteadyHands</Text>
          <Text style={styles.brandSub}>Motor skills therapy for every day</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back! 👋</Text>
          <Text style={styles.cardSub}>Sign in to continue your therapy</Text>

          <Text style={styles.label}>USERNAME</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter your username"
            placeholderTextColor={colors.textLight}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor={colors.textLight}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.btnText}>Sign In →</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Register here</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        <Text style={styles.version}>v1.1.0 • SteadyHands Therapy</Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingVertical: 48,
  },

  // Branding
  brand: { alignItems: 'center', marginBottom: 40 },
  logo: {
  width: 160,   // dati 100
  height: 160,  // dati 100
  borderRadius: 32,  // slightly larger radius para proportional
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 10,
},
  brandTitle: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -1,
    marginBottom: 6,
  },
  brandSub: {
    fontSize: 15,
    color: colors.textLight,
    letterSpacing: 0.2,
  },

  // Card
  card: {
    backgroundColor: colors.white,
    borderRadius: 28,
    padding: 36,
    width: '55%',
    minWidth: 360,
    maxWidth: 520,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  cardTitle: {
    fontSize: fonts.heading,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 15,
    color: colors.textLight,
    marginBottom: 28,
  },

  // Form
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textLight,
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },

  // Button
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 28,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 0.5 },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 4,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 13,
    color: colors.textLight,
    fontWeight: '600',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerText: { fontSize: 15, color: colors.textLight },
  footerLink: { fontSize: 15, color: colors.primary, fontWeight: '700' },

  // Version tag
  version: {
    marginTop: 28,
    fontSize: 12,
    color: colors.textLight,
    opacity: 0.6,
    letterSpacing: 0.5,
  },
});