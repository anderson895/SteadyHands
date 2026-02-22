import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, ScrollView, ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import { createUser } from '../../src/database/db';
import { colors, fonts } from '../../src/constants/theme';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'patient' | 'caregiver'>('patient');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !username.trim() || !password.trim()) {
      Alert.alert('Missing Info', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 4) {
      Alert.alert('Weak Password', 'Password must be at least 4 characters.');
      return;
    }
    setLoading(true);
    try {
      await createUser(username.trim(), password, name.trim(), role);
      Alert.alert('Account Created! 🎉', 'You can now login with your credentials.', [
        { text: 'Go to Login', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (e: any) {
      if (e.message?.includes('UNIQUE')) {
        Alert.alert('Username Taken', 'That username is already in use. Please choose another.');
      } else {
        Alert.alert('Error', e.message);
      }
    }
    setLoading(false);
  };

  const RoleOption = ({ value, emoji, title, desc }: {
    value: 'patient' | 'caregiver'; emoji: string; title: string; desc: string;
  }) => (
    <TouchableOpacity
      style={[styles.roleCard, role === value && styles.roleCardActive]}
      onPress={() => setRole(value)}
      activeOpacity={0.8}
    >
      <Text style={styles.roleEmoji}>{emoji}</Text>
      <Text style={[styles.roleTitle, role === value && styles.roleTitleActive]}>{title}</Text>
      <Text style={styles.roleDesc}>{desc}</Text>
      <View style={[styles.radioOuter, role === value && styles.radioOuterActive]}>
        {role === value && <View style={styles.radioInner} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <Text style={styles.brandEmoji}>✋</Text>
          <Text style={styles.brandTitle}>Create Account</Text>
          <Text style={styles.brandSub}>Join Steadyhand today</Text>
        </View>

        <View style={styles.card}>
          {/* Role */}
          <Text style={styles.sectionLabel}>I AM A...</Text>
          <View style={styles.roleRow}>
            <RoleOption
              value="patient"
              emoji="🧒"
              title="Patient"
              desc="Practice exercises & track my progress"
            />
            <RoleOption
              value="caregiver"
              emoji="👨‍⚕️"
              title="Caregiver"
              desc="Monitor patients & set their goals"
            />
          </View>

          <Text style={styles.label}>FULL NAME</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your full name"
            placeholderTextColor={colors.textLight}
          />

          <Text style={styles.label}>USERNAME</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Choose a username"
            placeholderTextColor={colors.textLight}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Choose a password"
            placeholderTextColor={colors.textLight}
            secureTextEntry
          />

          <Text style={styles.label}>CONFIRM PASSWORD</Text>
          <TextInput
            style={[
              styles.input,
              confirmPassword.length > 0 && confirmPassword !== password && styles.inputError,
            ]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter password"
            placeholderTextColor={colors.textLight}
            secureTextEntry
          />
          {confirmPassword.length > 0 && confirmPassword !== password && (
            <Text style={styles.errorText}>Passwords don't match</Text>
          )}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.btnText}>✨  Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Sign in</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  brand: { alignItems: 'center', marginBottom: 28 },
  brandEmoji: { fontSize: 56, marginBottom: 8 },
  brandTitle: { fontSize: 36, fontWeight: '800', color: colors.primary, letterSpacing: -0.5 },
  brandSub: { fontSize: 15, color: colors.textLight, marginTop: 4 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 28,
    padding: 36,
    width: '60%',
    minWidth: 400,
    maxWidth: 600,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textLight,
    letterSpacing: 1.2, marginBottom: 12,
  },
  roleRow: { flexDirection: 'row', gap: 14, marginBottom: 20 },
  roleCard: {
    flex: 1, borderRadius: 18, borderWidth: 2.5,
    borderColor: colors.border, backgroundColor: colors.background,
    padding: 18, alignItems: 'center',
  },
  roleCardActive: { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
  roleEmoji: { fontSize: 38, marginBottom: 8 },
  roleTitle: { fontSize: 17, fontWeight: '700', color: colors.textLight, marginBottom: 4 },
  roleTitleActive: { color: colors.primary },
  roleDesc: { fontSize: 12, color: colors.textLight, textAlign: 'center', marginBottom: 12 },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2.5, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioOuterActive: { borderColor: colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  label: {
    fontSize: 11, fontWeight: '700', color: colors.textLight,
    letterSpacing: 1.2, marginBottom: 8, marginTop: 16,
  },
  input: {
    borderWidth: 2, borderColor: colors.border, borderRadius: 14,
    paddingHorizontal: 18, paddingVertical: 14, fontSize: 17,
    color: colors.text, backgroundColor: colors.background,
  },
  inputError: { borderColor: colors.danger },
  errorText: { fontSize: 13, color: colors.danger, marginTop: 4 },
  btn: {
    backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 18,
    alignItems: 'center', marginTop: 28, elevation: 3,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 19, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { fontSize: 15, color: colors.textLight },
  footerLink: { fontSize: 15, color: colors.primary, fontWeight: '700' },
});
