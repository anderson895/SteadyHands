import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal,
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { saveSession } from '../../src/database/db';
import { colors, fonts, shadows } from '../../src/constants/theme';
import { LETTERS, NUMBERS, SHAPES, DOT_PATTERNS, getLetterColor } from '../../src/constants/exercises';
import TracingCanvas from '../../src/components/TracingCanvas';
import ShapeTracer from '../../src/components/ShapeTracer';
import ConnectDots from '../../src/components/ConnectDots';

type Category = 'letters' | 'numbers' | 'shapes' | 'dots' | null;
type ExerciseItem = { type: string; item: any } | null;

const CATEGORIES = [
  { id: 'letters',  label: 'Letters A–Z',       emoji: '🔤', color: '#FF6B6B', desc: 'Trace the alphabet' },
  { id: 'numbers',  label: 'Numbers 0–9',        emoji: '🔢', color: '#4A90D9', desc: 'Trace numbers 0 to 9' },
  { id: 'shapes',   label: 'Basic Shapes',       emoji: '🔷', color: '#4CAF50', desc: 'Circles, squares & more' },
  { id: 'dots',     label: 'Connect the Dots',   emoji: '🔗', color: '#9B59B6', desc: 'Connect dots to form pictures' },
] as const;

export default function ExercisesScreen() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<Category>(null);
  const [activeExercise, setActiveExercise] = useState<ExerciseItem>(null);
  const [lastResult, setLastResult] = useState<{ label: string; accuracy: number; duration: number } | null>(null);

  const handleComplete = useCallback(async (duration: number, accuracy: number, label: string, type: string) => {
    try {
      await saveSession(user!.id, type, label, duration, accuracy);
      setLastResult({ label, accuracy, duration });
    } catch (e) {
      console.log('Save error:', e);
    }
    setActiveExercise(null);
  }, [user]);

  // ── Category Home ────────────────────────────────────────────────
  if (!selectedCategory) {
    return (
      <ScrollView contentContainerStyle={styles.homeContent}>
        <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]}! 👋</Text>
        <Text style={styles.greetingSub}>What would you like to practice today?</Text>

        <View style={styles.grid}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catCard, { borderTopColor: cat.color }]}
              onPress={() => setSelectedCategory(cat.id)}
              activeOpacity={0.85}
            >
              <Text style={styles.catEmoji}>{cat.emoji}</Text>
              <Text style={styles.catLabel}>{cat.label}</Text>
              <Text style={styles.catDesc}>{cat.desc}</Text>
              <View style={[styles.catArrow, { backgroundColor: cat.color }]}>
                <Text style={styles.catArrowText}>→</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {lastResult && (
          <View style={styles.lastResultBanner}>
            <Text style={styles.lastResultIcon}>🏆</Text>
            <View style={styles.lastResultInfo}>
              <Text style={styles.lastResultTitle}>Last completed: "{lastResult.label}"</Text>
              <Text style={styles.lastResultSub}>
                Score: {Math.round(lastResult.accuracy)}%  ·  Time: {lastResult.duration}s
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    );
  }

  // ── Sub-screens ──────────────────────────────────────────────────
  const BackHeader = ({ title }: { title: string }) => (
    <View style={styles.subHeader}>
      <TouchableOpacity onPress={() => setSelectedCategory(null)} style={styles.backBtn}>
        <Text style={styles.backText}>←  Back</Text>
      </TouchableOpacity>
      <Text style={styles.subTitle}>{title}</Text>
      <View style={{ width: 90 }} />
    </View>
  );

  if (selectedCategory === 'letters') {
    return (
      <View style={styles.flex}>
        <BackHeader title="🔤  Letters A–Z" />
        <ScrollView contentContainerStyle={styles.itemGrid}>
          {LETTERS.map((l, i) => (
            <TouchableOpacity
              key={l}
              style={[styles.letterBtn, { backgroundColor: getLetterColor(i) }]}
              onPress={() => setActiveExercise({ type: 'letter', item: l })}
            >
              <Text style={styles.letterText}>{l}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ExerciseModal exercise={activeExercise} onComplete={handleComplete} onClose={() => setActiveExercise(null)} />
      </View>
    );
  }

  if (selectedCategory === 'numbers') {
    return (
      <View style={styles.flex}>
        <BackHeader title="🔢  Numbers 0–9" />
        <ScrollView contentContainerStyle={styles.itemGrid}>
          {NUMBERS.map((n, i) => (
            <TouchableOpacity
              key={n}
              style={[styles.letterBtn, { backgroundColor: getLetterColor(i + 2) }]}
              onPress={() => setActiveExercise({ type: 'number', item: n })}
            >
              <Text style={styles.letterText}>{n}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ExerciseModal exercise={activeExercise} onComplete={handleComplete} onClose={() => setActiveExercise(null)} />
      </View>
    );
  }

  if (selectedCategory === 'shapes') {
    return (
      <View style={styles.flex}>
        <BackHeader title="🔷  Basic Shapes" />
        <ScrollView contentContainerStyle={styles.shapeGrid}>
          {SHAPES.map(shape => (
            <TouchableOpacity
              key={shape.id}
              style={[styles.shapeBtn, { backgroundColor: shape.color }]}
              onPress={() => setActiveExercise({ type: 'shape', item: shape })}
            >
              <Text style={styles.shapeEmoji}>{shape.emoji}</Text>
              <Text style={styles.shapeName}>{shape.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ExerciseModal exercise={activeExercise} onComplete={handleComplete} onClose={() => setActiveExercise(null)} />
      </View>
    );
  }

  if (selectedCategory === 'dots') {
    return (
      <View style={styles.flex}>
        <BackHeader title="🔗  Connect the Dots" />
        <ScrollView contentContainerStyle={styles.shapeGrid}>
          {DOT_PATTERNS.map(pattern => (
            <TouchableOpacity
              key={pattern.id}
              style={styles.dotCard}
              onPress={() => setActiveExercise({ type: 'dots', item: pattern })}
            >
              <Text style={styles.dotEmoji}>{pattern.emoji}</Text>
              <Text style={styles.dotName}>{pattern.name}</Text>
              <Text style={styles.dotCount}>{pattern.dots.length} dots</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ExerciseModal exercise={activeExercise} onComplete={handleComplete} onClose={() => setActiveExercise(null)} />
      </View>
    );
  }

  return null;
}

// ── Exercise Modal ───────────────────────────────────────────────────
function ExerciseModal({
  exercise,
  onComplete,
  onClose,
}: {
  exercise: ExerciseItem;
  onComplete: (duration: number, accuracy: number, label: string, type: string) => void;
  onClose: () => void;
}) {
  if (!exercise) return null;
  const { type, item } = exercise;
  const title =
    type === 'letter' ? `Trace Letter  ${item}` :
    type === 'number' ? `Trace Number  ${item}` :
    type === 'shape'  ? `Trace a ${item.name}` :
    `Connect the Dots — ${item.name}`;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <TouchableOpacity style={styles.modalClose} onPress={onClose}>
            <Text style={styles.modalCloseText}>✕  Close</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{title}</Text>
          <View style={{ width: 90 }} />
        </View>
        <View style={styles.modalBody}>
          {(type === 'letter' || type === 'number') && (
            <TracingCanvas
              label={item}
              labelType={type}
              onComplete={(dur, acc) => onComplete(dur, acc, item, type)}
            />
          )}
          {type === 'shape' && (
            <ShapeTracer
              shape={item}
              onComplete={(dur, acc) => onComplete(dur, acc, item.name, 'shape')}
            />
          )}
          {type === 'dots' && (
            <ConnectDots
              pattern={item}
              onComplete={(dur, acc) => onComplete(dur, acc, item.name, 'dots')}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  homeContent: { padding: 20, alignItems: 'center' },
  greeting: { fontSize: fonts.heading, fontWeight: '800', color: colors.text, marginTop: 8, textAlign: 'center' },
  greetingSub: { fontSize: 16, color: colors.textLight, marginTop: 6, marginBottom: 24, textAlign: 'center' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, maxWidth: 900, width: '100%' },
  catCard: {
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 28,
    width: 210,
    alignItems: 'center',
    borderTopWidth: 6,
    ...shadows.card,
  },
  catEmoji: { fontSize: 52, marginBottom: 10 },
  catLabel: { fontSize: 17, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 6 },
  catDesc: { fontSize: 13, color: colors.textLight, textAlign: 'center', marginBottom: 14 },
  catArrow: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 6 },
  catArrowText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  lastResultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 18,
    marginTop: 24,
    width: '90%',
    maxWidth: 600,
    borderLeftWidth: 5,
    borderLeftColor: colors.yellow,
    ...shadows.card,
  },
  lastResultIcon: { fontSize: 32, marginRight: 14 },
  lastResultInfo: { flex: 1 },
  lastResultTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  lastResultSub: { fontSize: 14, color: colors.textLight, marginTop: 3 },

  // Sub screen
  subHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: colors.white, elevation: 3,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  backText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  subTitle: { fontSize: fonts.subheading, fontWeight: '800', color: colors.text },

  itemGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', padding: 16, gap: 10 },
  letterBtn: { width: 76, height: 76, borderRadius: 18, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  letterText: { fontSize: 38, fontWeight: '800', color: '#fff' },

  shapeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', padding: 24, gap: 16 },
  shapeBtn: { width: 150, height: 150, borderRadius: 22, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  shapeEmoji: { fontSize: 56, marginBottom: 8 },
  shapeName: { color: '#fff', fontWeight: '800', fontSize: 17 },

  dotCard: {
    backgroundColor: colors.white, borderRadius: 22, width: 170, height: 170,
    alignItems: 'center', justifyContent: 'center', ...shadows.card,
    borderWidth: 3, borderColor: colors.primaryLight,
  },
  dotEmoji: { fontSize: 56, marginBottom: 8 },
  dotName: { fontSize: 17, fontWeight: '800', color: colors.text },
  dotCount: { fontSize: 13, color: colors.textLight, marginTop: 4 },

  // Modal
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: colors.white, elevation: 4,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modalClose: { backgroundColor: colors.danger, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  modalCloseText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalTitle: { fontSize: fonts.subheading, fontWeight: '800', color: colors.text },
  modalBody: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
});
