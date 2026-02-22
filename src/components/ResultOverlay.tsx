import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { scoreFeedback } from '../utils/accuracyEngine';
import { colors } from '../constants/theme';

interface Props {
  score: number;
  duration: number;
  label: string;
  onTryAgain: () => void;
  onNext: () => void;
}

export default function ResultOverlay({ score, duration, label, onTryAgain, onNext }: Props) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.6)).current;

  const fb = scoreFeedback(score);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
    ]).start();
  }, []);

  const ScoreRing = () => {
    // Simple arc representation using a large circle + text
    const size = 120;
    return (
      <View style={[ring.outer, { borderColor: fb.color }]}>
        <Text style={[ring.score, { color: fb.color }]}>{score}</Text>
        <Text style={ring.pct}>/ 100</Text>
      </View>
    );
  };

  return (
    <Animated.View style={[s.overlay, { opacity: fadeAnim }]}>
      <Animated.View style={[s.card, { transform: [{ scale: scaleAnim }] }]}>
        {/* Emoji */}
        <Text style={s.emoji}>{fb.emoji}</Text>

        {/* Label */}
        <Text style={[s.feedbackLabel, { color: fb.color }]}>{fb.label}</Text>

        {/* Exercise name */}
        <Text style={s.exerciseName}>"{label}"</Text>

        {/* Score ring */}
        <ScoreRing />

        {/* Message */}
        <Text style={s.message}>{fb.message}</Text>

        {/* Stats row */}
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statVal}>{score}%</Text>
            <Text style={s.statLbl}>Accuracy</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <Text style={s.statVal}>{duration}s</Text>
            <Text style={s.statLbl}>Time</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={s.btnRow}>
          <TouchableOpacity style={[s.btn, s.tryAgainBtn]} onPress={onTryAgain} activeOpacity={0.85}>
            <Text style={s.tryAgainTxt}>🔄  Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, s.nextBtn]} onPress={onNext} activeOpacity={0.85}>
            <Text style={s.nextTxt}>✅  Save & Next</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const ring = StyleSheet.create({
  outer: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 8, alignItems: 'center', justifyContent: 'center',
    marginVertical: 16, backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6,
  },
  score: { fontSize: 36, fontWeight: '900', lineHeight: 40 },
  pct:   { fontSize: 13, color: colors.textLight, fontWeight: '600' },
});

const s = StyleSheet.create({
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(10,20,40,0.72)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 100,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 28, padding: 32,
    width: 380, alignItems: 'center',
    elevation: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25, shadowRadius: 20,
  },
  emoji:         { fontSize: 56, marginBottom: 6 },
  feedbackLabel: { fontSize: 28, fontWeight: '900', marginBottom: 4 },
  exerciseName:  { fontSize: 18, color: colors.textLight, marginBottom: 4 },
  message:       { fontSize: 15, color: colors.textLight, textAlign: 'center', marginBottom: 16, lineHeight: 22 },
  statsRow: {
    flexDirection: 'row', backgroundColor: colors.background,
    borderRadius: 16, paddingVertical: 14, paddingHorizontal: 24,
    width: '100%', marginBottom: 24,
  },
  statBox:     { flex: 1, alignItems: 'center' },
  statVal:     { fontSize: 22, fontWeight: '800', color: colors.text },
  statLbl:     { fontSize: 12, color: colors.textLight, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: colors.border, marginHorizontal: 8 },
  btnRow:      { flexDirection: 'row', gap: 12, width: '100%' },
  btn:         { flex: 1, borderRadius: 16, paddingVertical: 16, alignItems: 'center', elevation: 3 },
  tryAgainBtn: { backgroundColor: colors.warning },
  nextBtn:     { backgroundColor: colors.success },
  tryAgainTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
  nextTxt:     { color: '#fff', fontWeight: '800', fontSize: 16 },
});
