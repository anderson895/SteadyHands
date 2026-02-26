import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { colors, fonts, shadows } from '../../src/constants/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive', onPress: () => {
          logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );

  return (
    <View style={s.container}>
      <View style={s.profileCard}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
        </View>
        <Text style={s.name}>{user?.name}</Text>
        <Text style={s.username}>@{user?.username}</Text>
        <View style={s.badge}>
          <Text style={s.badgeText}>🧒  Patient</Text>
        </View>
      </View>

      <View style={s.infoCard}>
        <Text style={s.cardTitle}>Account Details</Text>
        <InfoRow label="Full Name" value={user?.name ?? ''} />
        <InfoRow label="Username" value={`@${user?.username}`} />
        <InfoRow label="Account Type" value="Patient" />
        <InfoRow label="Daily Goal" value={`${user?.daily_goal ?? 5} exercises`} />
      </View>

      <View style={s.aboutCard}>
        <Text style={s.aboutTitle}>💡  About SteadyHands</Text>
        <Text style={s.aboutText}>
          SteadyHands helps cerebral palsy patients build motor skills through guided tracing,
          shape drawing, and connect-the-dots activities. Track your progress and celebrate
          every achievement!
        </Text>
      </View>

      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
        <Text style={s.logoutText}>🚪  Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, alignItems: 'center' },
  profileCard: {
    backgroundColor: colors.white, borderRadius: 28, padding: 36,
    alignItems: 'center', ...shadows.card, width: '60%', maxWidth: 480, marginBottom: 20,
  },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, elevation: 6,
  },
  avatarText: { fontSize: 48, fontWeight: '800', color: '#fff' },
  name: { fontSize: fonts.heading, fontWeight: '800', color: colors.text },
  username: { fontSize: 16, color: colors.textLight, marginTop: 4 },
  badge: {
    backgroundColor: colors.primary + '18', borderRadius: 20,
    paddingHorizontal: 22, paddingVertical: 8, marginTop: 14,
    borderWidth: 1.5, borderColor: colors.primary + '40',
  },
  badgeText: { fontSize: 16, color: colors.primary, fontWeight: '700' },
  infoCard: {
    backgroundColor: colors.white, borderRadius: 22, padding: 24,
    ...shadows.card, width: '60%', maxWidth: 480, marginBottom: 16,
  },
  cardTitle: { fontSize: fonts.subheading, fontWeight: '800', color: colors.text, marginBottom: 16 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.background,
  },
  rowLabel: { fontSize: 16, color: colors.textLight },
  rowValue: { fontSize: 16, fontWeight: '700', color: colors.text },
  aboutCard: {
    backgroundColor: colors.primary + '12', borderRadius: 20, padding: 22,
    width: '60%', maxWidth: 480, marginBottom: 28,
    borderWidth: 1.5, borderColor: colors.primaryLight + '60',
  },
  aboutTitle: { fontSize: 16, fontWeight: '800', color: colors.primary, marginBottom: 10 },
  aboutText: { fontSize: 15, color: colors.text, lineHeight: 23 },
  logoutBtn: {
    backgroundColor: colors.danger, borderRadius: 18,
    paddingHorizontal: 44, paddingVertical: 18, elevation: 4,
  },
  logoutText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
