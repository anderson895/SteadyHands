import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { colors, fonts, shadows } from '../../src/constants/theme';

export default function CaregiverProfile() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => { logout(); router.replace('/(auth)/login'); } },
    ]);
  };

  return (
    <View style={s.container}>
      <View style={s.card}>
        <View style={[s.avatar, { backgroundColor: colors.accent }]}>
          <Text style={s.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
        </View>
        <Text style={s.name}>{user?.name}</Text>
        <Text style={s.username}>@{user?.username}</Text>
        <View style={[s.badge, { backgroundColor: colors.accent + '18', borderColor: colors.accent + '40' }]}>
          <Text style={[s.badgeText, { color: colors.accent }]}>👨‍⚕️  Caregiver</Text>
        </View>
      </View>

      <View style={s.infoCard}>
        <Text style={s.cardTitle}>Account Details</Text>
        {[
          { label: 'Full Name', value: user?.name ?? '' },
          { label: 'Username', value: `@${user?.username}` },
          { label: 'Account Type', value: 'Caregiver' },
        ].map(item => (
          <View key={item.label} style={s.row}>
            <Text style={s.rowLabel}>{item.label}</Text>
            <Text style={s.rowValue}>{item.value}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
        <Text style={s.logoutText}>🚪  Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, alignItems: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 28, padding: 36, alignItems: 'center',
    ...shadows.card, width: '55%', maxWidth: 440, marginBottom: 20,
  },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16, elevation: 6,
  },
  avatarText: { fontSize: 48, fontWeight: '800', color: '#fff' },
  name: { fontSize: fonts.heading, fontWeight: '800', color: colors.text },
  username: { fontSize: 16, color: colors.textLight, marginTop: 4 },
  badge: { borderRadius: 20, paddingHorizontal: 22, paddingVertical: 8, marginTop: 14, borderWidth: 1.5 },
  badgeText: { fontSize: 16, fontWeight: '700' },
  infoCard: {
    backgroundColor: '#fff', borderRadius: 22, padding: 24,
    ...shadows.card, width: '55%', maxWidth: 440, marginBottom: 28,
  },
  cardTitle: { fontSize: fonts.subheading, fontWeight: '800', color: colors.text, marginBottom: 16 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.background,
  },
  rowLabel: { fontSize: 16, color: colors.textLight },
  rowValue: { fontSize: 16, fontWeight: '700', color: colors.text },
  logoutBtn: {
    backgroundColor: colors.danger, borderRadius: 18,
    paddingHorizontal: 44, paddingVertical: 18, elevation: 4,
  },
  logoutText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
