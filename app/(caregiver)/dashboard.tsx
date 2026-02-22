import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, TextInput, Alert, Modal,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import {
  getAllPatientProgress, getProgressStats, getTodaySessions, updateDailyGoal,
} from '../../src/database/db';
import { colors, fonts, shadows } from '../../src/constants/theme';

const formatTime = (sec: number | null) => {
  if (!sec) return '0s';
  const m = Math.floor(sec / 60);
  return m > 0 ? `${m}m ${sec % 60}s` : `${sec}s`;
};

const typeIcon: Record<string, string> = { letter: '🔤', number: '🔢', shape: '🔷', dots: '🔗' };

// ─────────────────── Goal Modal ───────────────────────────────
function GoalModal({
  patient, onClose, onSave,
}: { patient: any; onClose: () => void; onSave: (id: number, goal: number) => void }) {
  const [goal, setGoal] = useState(String(patient?.daily_goal ?? 5));

  const handleSave = () => {
    const g = parseInt(goal, 10);
    if (!g || g < 1 || g > 50) {
      Alert.alert('Invalid', 'Please enter a goal between 1 and 50.');
      return;
    }
    onSave(patient.id, g);
    onClose();
  };

  return (
    <Modal visible transparent animationType="fade">
      <View style={gm.overlay}>
        <View style={gm.card}>
          <Text style={gm.title}>🎯  Set Daily Goal</Text>
          <Text style={gm.patient}>{patient?.name}</Text>
          <Text style={gm.label}>Exercises per day:</Text>
          <TextInput
            style={gm.input}
            value={goal}
            onChangeText={setGoal}
            keyboardType="number-pad"
            maxLength={2}
          />
          <Text style={gm.hint}>Recommended: 3 – 10 per day</Text>
          <View style={gm.buttons}>
            <TouchableOpacity style={gm.cancel} onPress={onClose}>
              <Text style={gm.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={gm.save} onPress={handleSave}>
              <Text style={gm.saveTxt}>💾  Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
const gm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 28, padding: 36, width: 420,
    alignItems: 'center', elevation: 16,
  },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 6 },
  patient: { fontSize: 18, color: colors.primary, fontWeight: '700', marginBottom: 20 },
  label: { fontSize: 16, color: colors.textLight, marginBottom: 10 },
  input: {
    borderWidth: 3, borderColor: colors.primary, borderRadius: 16,
    paddingHorizontal: 28, paddingVertical: 14,
    fontSize: 40, fontWeight: '800', color: colors.text, textAlign: 'center', width: '55%', marginBottom: 8,
  },
  hint: { fontSize: 13, color: colors.textLight, marginBottom: 24 },
  buttons: { flexDirection: 'row', gap: 14, width: '100%' },
  cancel: {
    flex: 1, padding: 16, borderRadius: 14,
    borderWidth: 2, borderColor: colors.border, alignItems: 'center',
  },
  cancelTxt: { fontSize: 16, color: colors.textLight, fontWeight: '700' },
  save: { flex: 1, padding: 16, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center' },
  saveTxt: { fontSize: 16, color: '#fff', fontWeight: '800' },
});

// ─────────────────── Detail Modal ────────────────────────────
function DetailModal({ patient, onClose }: { patient: any; onClose: () => void }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useFocusEffect(useCallback(() => {
    if (!patient) return;
    getTodaySessions(patient.id).then(setSessions);
    getProgressStats(patient.id).then(setStats);
  }, [patient]));

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={dm.container}>
        <View style={dm.header}>
          <TouchableOpacity style={dm.close} onPress={onClose}>
            <Text style={dm.closeTxt}>✕  Close</Text>
          </TouchableOpacity>
          <Text style={dm.title}>{patient?.name}'s Details</Text>
          <View style={{ width: 90 }} />
        </View>
        <ScrollView style={dm.body}>
          <View style={dm.sumRow}>
            {[
              { label: "Today's Exercises", value: stats?.today?.total_exercises ?? 0 },
              { label: 'Practice Time', value: formatTime(stats?.today?.total_time) },
              { label: 'Accuracy', value: `${Math.round(stats?.today?.avg_accuracy ?? 0)}%` },
            ].map(item => (
              <View key={item.label} style={dm.sumCard}>
                <Text style={dm.sumVal}>{item.value}</Text>
                <Text style={dm.sumLbl}>{item.label}</Text>
              </View>
            ))}
          </View>

          <Text style={dm.sessionTitle}>Today's Sessions</Text>
          {sessions.length === 0 ? (
            <View style={dm.empty}>
              <Text style={dm.emptyEmoji}>🌱</Text>
              <Text style={dm.emptyTxt}>No exercises today yet</Text>
            </View>
          ) : sessions.map(s => (
            <View key={s.id} style={dm.sessionRow}>
              <Text style={dm.sessionIcon}>{typeIcon[s.exercise_type] ?? '📝'}</Text>
              <View style={dm.sessionInfo}>
                <Text style={dm.sessionName}>{s.exercise_name}</Text>
                <Text style={dm.sessionTime}>{formatTime(s.duration_seconds)}</Text>
              </View>
              <Text style={[dm.sessionScore, { color: s.accuracy_score >= 75 ? colors.success : colors.warning }]}>
                {Math.round(s.accuracy_score)}%
              </Text>
            </View>
          ))}
          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}
const dm = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff', elevation: 4, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  close: { backgroundColor: colors.danger, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  closeTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  body: { flex: 1, padding: 16 },
  sumRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  sumCard: { flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: 18, alignItems: 'center', ...shadows.card },
  sumVal: { fontSize: 28, fontWeight: '800', color: colors.primary },
  sumLbl: { fontSize: 13, color: colors.textLight, marginTop: 4, textAlign: 'center' },
  sessionTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 12 },
  empty: { alignItems: 'center', padding: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 10 },
  emptyTxt: { fontSize: 16, color: colors.textLight },
  sessionRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, ...shadows.card,
  },
  sessionIcon: { fontSize: 28, marginRight: 12 },
  sessionInfo: { flex: 1 },
  sessionName: { fontSize: 16, fontWeight: '700', color: colors.text },
  sessionTime: { fontSize: 13, color: colors.textLight, marginTop: 2 },
  sessionScore: { fontSize: 18, fontWeight: '800' },
});

// ─────────────────── Patient Card ─────────────────────────────
function PatientCard({
  patient, onSetGoal, onViewDetails,
}: { patient: any; onSetGoal: () => void; onViewDetails: () => void }) {
  const pct = patient.daily_goal > 0 ? Math.min(1, (patient.today_count ?? 0) / patient.daily_goal) : 0;
  const met = (patient.today_count ?? 0) >= (patient.daily_goal ?? 5);
  return (
    <View style={pc.card}>
      <View style={pc.header}>
        <View style={pc.avatar}>
          <Text style={pc.avatarTxt}>{patient.name?.[0]?.toUpperCase()}</Text>
        </View>
        <View style={pc.info}>
          <Text style={pc.name}>{patient.name}</Text>
          <Text style={pc.uname}>@{patient.username}</Text>
        </View>
        <View style={pc.badge}>
          <Text style={pc.badgeNum}>{patient.today_count ?? 0}</Text>
          <Text style={pc.badgeLbl}>today</Text>
        </View>
      </View>

      <View style={pc.goalRow}>
        <Text style={pc.goalLbl}>Goal: {patient.daily_goal ?? 5} exercises</Text>
        <Text style={pc.goalPct}>{Math.round(pct * 100)}%</Text>
      </View>
      <View style={pc.bar}><View style={[pc.barFill, { width: `${pct * 100}%`, backgroundColor: met ? colors.success : colors.primary }]} /></View>

      <View style={pc.stats}>
        <View style={pc.stat}>
          <Text style={pc.statVal}>{Math.round(patient.weekly_accuracy ?? 0)}%</Text>
          <Text style={pc.statLbl}>Weekly Accuracy</Text>
        </View>
        <View style={pc.stat}>
          <Text style={[pc.statVal, { color: met ? colors.success : colors.textLight }]}>
            {met ? '✅ Met' : '⏳ Pending'}
          </Text>
          <Text style={pc.statLbl}>Today's Goal</Text>
        </View>
      </View>

      <View style={pc.actions}>
        <TouchableOpacity style={pc.btn} onPress={onViewDetails}>
          <Text style={pc.btnTxt}>📊  Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[pc.btn, { backgroundColor: colors.accent }]} onPress={onSetGoal}>
          <Text style={pc.btnTxt}>🎯  Set Goal</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const pc = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 22, padding: 20, width: '47%', ...shadows.card },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarTxt: { color: '#fff', fontSize: 24, fontWeight: '800' },
  info: { flex: 1 },
  name: { fontSize: 17, fontWeight: '800', color: colors.text },
  uname: { fontSize: 13, color: colors.textLight, marginTop: 2 },
  badge: { alignItems: 'center', backgroundColor: colors.background, borderRadius: 12, padding: 8 },
  badgeNum: { fontSize: 26, fontWeight: '800', color: colors.primary },
  badgeLbl: { fontSize: 11, color: colors.textLight },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  goalLbl: { fontSize: 13, color: colors.textLight },
  goalPct: { fontSize: 13, fontWeight: '700', color: colors.text },
  bar: { height: 10, backgroundColor: '#E0E0E0', borderRadius: 5, overflow: 'hidden', marginBottom: 16 },
  barFill: { height: '100%', borderRadius: 5 },
  stats: { flexDirection: 'row', marginBottom: 16 },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '800', color: colors.text },
  statLbl: { fontSize: 12, color: colors.textLight, marginTop: 2, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  btnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

// ─────────────────── Main Screen ──────────────────────────────
export default function CaregiverDashboard() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [goalTarget, setGoalTarget] = useState<any>(null);
  const [detailTarget, setDetailTarget] = useState<any>(null);

  const load = useCallback(async () => {
    const list = await getAllPatientProgress();
    setPatients(list);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleSaveGoal = async (id: number, goal: number) => {
    await updateDailyGoal(id, goal);
    await load();
    Alert.alert('✅  Saved', 'Daily goal updated!');
  };

  const metGoal = patients.filter(p => (p.today_count ?? 0) >= (p.daily_goal ?? 5)).length;
  const avgAcc  = patients.length > 0
    ? Math.round(patients.reduce((s, p) => s + (p.weekly_accuracy ?? 0), 0) / patients.length)
    : 0;

  return (
    <View style={ds.container}>
      {/* Header */}
      <View style={ds.header}>
        <View>
          <Text style={ds.headerTitle}>👨‍⚕️  Caregiver Dashboard</Text>
          <Text style={ds.headerSub}>Welcome, {user?.name}</Text>
        </View>
        <View style={ds.chips}>
          {[
            { label: 'Patients', value: patients.length },
            { label: 'Met Goal', value: metGoal },
            { label: 'Avg Accuracy', value: `${avgAcc}%` },
          ].map(chip => (
            <View key={chip.label} style={ds.chip}>
              <Text style={ds.chipVal}>{chip.value}</Text>
              <Text style={ds.chipLbl}>{chip.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={ds.listTitle}>Patient Overview</Text>
        {patients.length === 0 ? (
          <View style={ds.empty}>
            <Text style={ds.emptyEmoji}>🌟</Text>
            <Text style={ds.emptyTitle}>No patients yet</Text>
            <Text style={ds.emptySub}>Patients will appear here once they register with a patient account.</Text>
          </View>
        ) : (
          <View style={ds.grid}>
            {patients.map(p => (
              <PatientCard
                key={p.id}
                patient={p}
                onSetGoal={() => setGoalTarget(p)}
                onViewDetails={() => setDetailTarget(p)}
              />
            ))}
          </View>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>

      {goalTarget && (
        <GoalModal
          patient={goalTarget}
          onClose={() => setGoalTarget(null)}
          onSave={handleSaveGoal}
        />
      )}
      {detailTarget && (
        <DetailModal
          patient={detailTarget}
          onClose={() => setDetailTarget(null)}
        />
      )}
    </View>
  );
}

const ds = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.accent, padding: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  chips: { flexDirection: 'row', gap: 12 },
  chip: {
    alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
  },
  chipVal: { fontSize: 24, fontWeight: '800', color: '#fff' },
  chipLbl: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  listTitle: { fontSize: fonts.subheading, fontWeight: '800', color: colors.text, padding: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 14 },
  empty: { alignItems: 'center', padding: 56 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 8 },
  emptySub: { fontSize: 16, color: colors.textLight, textAlign: 'center' },
});
