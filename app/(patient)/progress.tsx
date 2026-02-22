import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { getProgressStats, getTodaySessions, getUserById } from '../../src/database/db';
import { colors, fonts, shadows } from '../../src/constants/theme';

const ProgressBar = ({
  value, max, color = colors.primary, height = 18, label,
}: {
  value: number; max: number; color?: string; height?: number; label?: string;
}) => {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <View style={pb.wrap}>
      {label && <Text style={pb.label}>{label}</Text>}
      <View style={[pb.track, { height }]}>
        <View style={[pb.fill, { width: `${pct}%`, backgroundColor: color, height }]} />
      </View>
      <Text style={pb.pct}>{Math.round(pct)}%</Text>
    </View>
  );
};
const pb = StyleSheet.create({
  wrap: { marginVertical: 4 },
  label: { fontSize: 13, color: colors.textLight, marginBottom: 5 },
  track: { backgroundColor: '#E0E0E0', borderRadius: 99, overflow: 'hidden' },
  fill: { borderRadius: 99 },
  pct: { fontSize: 12, color: colors.textLight, marginTop: 4, textAlign: 'right', fontWeight: '600' },
});

const StatCard = ({ emoji, value, label, color }: { emoji: string; value: string; label: string; color: string }) => (
  <View style={[s.statCard, { borderTopColor: color, borderTopWidth: 5 }]}>
    <Text style={s.statEmoji}>{emoji}</Text>
    <Text style={s.statValue}>{value}</Text>
    <Text style={s.statLabel}>{label}</Text>
  </View>
);

const formatTime = (sec: number | null) => {
  if (!sec) return '0s';
  const m = Math.floor(sec / 60);
  const rest = sec % 60;
  return m > 0 ? `${m}m ${rest}s` : `${rest}s`;
};

const typeIcon: Record<string, string> = {
  letter: '🔤', number: '🔢', shape: '🔷', dots: '🔗',
};

export default function ProgressScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [todaySessions, setTodaySessions] = useState<any[]>([]);
  const [dailyGoal, setDailyGoal] = useState(5);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    const [s, ts, freshUser] = await Promise.all([
      getProgressStats(user.id),
      getTodaySessions(user.id),
      getUserById(user.id),
    ]);
    setStats(s);
    setTodaySessions(ts);
    setDailyGoal(freshUser?.daily_goal ?? 5);
  }, [user]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const todayCount = stats?.today?.total_exercises ?? 0;
  const todayTime  = stats?.today?.total_time ?? 0;
  const todayAcc   = stats?.today?.avg_accuracy ?? 0;
  const weekCount  = stats?.weekly?.total_exercises ?? 0;
  const weekAcc    = stats?.weekly?.avg_accuracy ?? 0;
  const goalPct    = dailyGoal > 0 ? Math.min(1, todayCount / dailyGoal) : 0;

  return (
    <ScrollView
      style={s.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Hero */}
      <View style={s.hero}>
        <Text style={s.heroTitle}>📊  Your Progress</Text>
        <Text style={s.heroName}>{user?.name}</Text>
      </View>

      {/* Daily Goal */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>🎯  Today's Goal</Text>
        <View style={s.goalCard}>
          <View style={s.goalLeft}>
            <Text style={[s.goalCount, { color: goalPct >= 1 ? colors.success : colors.primary }]}>
              {todayCount}
            </Text>
            <Text style={s.goalSlash}>/ {dailyGoal}</Text>
            <Text style={s.goalLabel}>exercises</Text>
          </View>
          <View style={s.goalRight}>
            <ProgressBar
              value={todayCount}
              max={dailyGoal}
              color={goalPct >= 1 ? colors.success : colors.primary}
              height={22}
            />
            {goalPct >= 1 && <Text style={s.goalDone}>🎉  Daily goal achieved! Keep it up!</Text>}
          </View>
        </View>
      </View>

      {/* Today stats */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>☀️  Today</Text>
        <View style={s.statRow}>
          <StatCard emoji="✅" value={String(todayCount)} label="Exercises" color={colors.success} />
          <StatCard emoji="⏱️" value={formatTime(todayTime)} label="Practice Time" color={colors.primary} />
          <StatCard emoji="🎯" value={`${Math.round(todayAcc)}%`} label="Avg Accuracy" color={colors.warning} />
        </View>
        <View style={s.accCard}>
          <Text style={s.accTitle}>Accuracy Score</Text>
          <ProgressBar
            value={Math.round(todayAcc)}
            max={100}
            height={20}
            color={todayAcc >= 75 ? colors.success : todayAcc >= 50 ? colors.warning : colors.danger}
          />
        </View>
      </View>

      {/* Weekly */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>📅  This Week</Text>
        <View style={s.weekCard}>
          <View style={s.weekRow}>
            <View style={s.weekStat}>
              <Text style={[s.weekVal, { color: colors.accent }]}>{weekCount}</Text>
              <Text style={s.weekLbl}>Total Exercises</Text>
            </View>
            <View style={s.weekStat}>
              <Text style={[s.weekVal, { color: colors.teal }]}>{Math.round(weekAcc)}%</Text>
              <Text style={s.weekLbl}>Avg Accuracy</Text>
            </View>
          </View>
          <ProgressBar
            value={weekCount}
            max={dailyGoal * 7}
            color={colors.accent}
            height={14}
            label={`Weekly target: ${dailyGoal * 7} exercises`}
          />
        </View>
      </View>

      {/* Recent */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>🕒  Today's Sessions</Text>
        {todaySessions.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>🌱</Text>
            <Text style={s.emptyTitle}>No exercises yet today</Text>
            <Text style={s.emptySub}>Go to Exercises and start your first session!</Text>
          </View>
        ) : (
          todaySessions.slice(0, 10).map(session => (
            <View key={session.id} style={s.sessionRow}>
              <Text style={s.sessionIcon}>{typeIcon[session.exercise_type] ?? '📝'}</Text>
              <View style={s.sessionInfo}>
                <Text style={s.sessionName}>{session.exercise_name}</Text>
                <Text style={s.sessionTime}>{formatTime(session.duration_seconds)}</Text>
              </View>
              <View style={s.sessionScore}>
                <Text style={[
                  s.sessionScoreText,
                  { color: session.accuracy_score >= 75 ? colors.success : colors.warning }
                ]}>
                  {Math.round(session.accuracy_score)}%
                </Text>
                <View style={s.miniTrack}>
                  <View style={[s.miniFill, {
                    width: `${session.accuracy_score}%` as any,
                    backgroundColor: session.accuracy_score >= 75 ? colors.success : colors.warning,
                  }]} />
                </View>
              </View>
            </View>
          ))
        )}
      </View>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: { backgroundColor: colors.primary, padding: 24, alignItems: 'center' },
  heroTitle: { fontSize: 20, color: 'rgba(255,255,255,0.85)', fontWeight: '700' },
  heroName: { fontSize: fonts.heading, fontWeight: '800', color: '#fff', marginTop: 4 },

  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: { fontSize: fonts.subheading, fontWeight: '800', color: colors.text, marginBottom: 12 },

  goalCard: {
    backgroundColor: colors.white, borderRadius: 22, padding: 22,
    flexDirection: 'row', alignItems: 'center', gap: 20, ...shadows.card,
  },
  goalLeft: { alignItems: 'center', minWidth: 90 },
  goalCount: { fontSize: 52, fontWeight: '800', lineHeight: 56 },
  goalSlash: { fontSize: 22, color: colors.textLight, fontWeight: '700' },
  goalLabel: { fontSize: 13, color: colors.textLight, marginTop: 2 },
  goalRight: { flex: 1 },
  goalDone: { color: colors.success, fontWeight: '700', fontSize: 15, marginTop: 8 },

  statRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  statCard: {
    flex: 1, backgroundColor: colors.white, borderRadius: 18,
    padding: 18, alignItems: 'center', ...shadows.card,
  },
  statEmoji: { fontSize: 32, marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 12, color: colors.textLight, textAlign: 'center', marginTop: 2 },

  accCard: { backgroundColor: colors.white, borderRadius: 18, padding: 18, ...shadows.card },
  accTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 10 },

  weekCard: { backgroundColor: colors.white, borderRadius: 22, padding: 22, ...shadows.card },
  weekRow: { flexDirection: 'row', marginBottom: 16 },
  weekStat: { flex: 1, alignItems: 'center' },
  weekVal: { fontSize: 40, fontWeight: '800' },
  weekLbl: { fontSize: 13, color: colors.textLight, marginTop: 2 },

  empty: { backgroundColor: colors.white, borderRadius: 22, padding: 36, alignItems: 'center', ...shadows.card },
  emptyEmoji: { fontSize: 52, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  emptySub: { fontSize: 14, color: colors.textLight, marginTop: 6, textAlign: 'center' },

  sessionRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: 16,
    padding: 14, marginBottom: 8, ...shadows.card,
  },
  sessionIcon: { fontSize: 28, marginRight: 12 },
  sessionInfo: { flex: 1 },
  sessionName: { fontSize: 16, fontWeight: '700', color: colors.text },
  sessionTime: { fontSize: 13, color: colors.textLight, marginTop: 2 },
  sessionScore: { alignItems: 'flex-end', minWidth: 68 },
  sessionScoreText: { fontSize: 18, fontWeight: '800' },
  miniTrack: { width: 60, height: 6, backgroundColor: '#E0E0E0', borderRadius: 3, overflow: 'hidden', marginTop: 4 },
  miniFill: { height: '100%', borderRadius: 3 },
});
