import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, PanResponder } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { colors } from '../constants/theme';
import ResultOverlay from './ResultOverlay';
import type { DotPattern } from '../constants/exercises';

const W = 430;
const H = 330;

/**
 * TAP FIX v3:
 * - PanResponder on whole canvas (no SVG onPress)
 * - Fires on BOTH grant (finger down) AND move (finger slides)
 * - Debounce: same dot can't register twice within 300ms
 * - MAX_TAP_DIST increased to 80px
 */
const MAX_TAP_DIST = 80;
const DEBOUNCE_MS  = 300;

interface Props {
  pattern: DotPattern;
  onComplete?: (duration: number, accuracy: number) => void;
}

export default function ConnectDots({ pattern, onComplete }: Props) {
  const [connected,  setConnected]  = useState<number[]>([]);
  const [nextDot,    setNextDot]    = useState(0);
  const [wrongTaps,  setWrongTaps]  = useState(0);
  const [finished,   setFinished]   = useState(false);
  const [result,     setResult]     = useState<{ score: number; duration: number } | null>(null);
  const [wrongFlash, setWrongFlash] = useState<number | null>(null);
  const startTime     = useRef(Date.now());
  const lastTappedRef = useRef<{ idx: number; time: number } | null>(null);

  const stateRef = useRef({ connected, nextDot, wrongTaps, finished, result });
  stateRef.current = { connected, nextDot, wrongTaps, finished, result };

  const dots = pattern.dots as ReadonlyArray<{ x: number; y: number }>;

  const tryTapAt = (tx: number, ty: number) => {
    const { finished, result, connected, nextDot, wrongTaps } = stateRef.current;
    if (finished || result) return;

    // Find nearest dot within MAX_TAP_DIST
    let nearestIdx  = -1;
    let nearestDist = MAX_TAP_DIST;
    dots.forEach((dot, i) => {
      const d = Math.hypot(dot.x - tx, dot.y - ty);
      if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
    });
    if (nearestIdx === -1) return;

    // Debounce — don't re-fire same dot too fast (e.g. finger held down)
    const now = Date.now();
    const last = lastTappedRef.current;
    if (last && last.idx === nearestIdx && now - last.time < DEBOUNCE_MS) return;
    lastTappedRef.current = { idx: nearestIdx, time: now };

    if (nearestIdx === nextDot) {
      const next = [...connected, nearestIdx];
      setConnected(next);
      setNextDot(nearestIdx + 1);

      if (next.length === dots.length) {
        setFinished(true);
        const duration = Math.round((Date.now() - startTime.current) / 1000);
        const score = Math.max(30, 100 - wrongTaps * 8);
        setTimeout(() => setResult({ score, duration }), 600);
      }
    } else {
      setWrongTaps(w => w + 1);
      setWrongFlash(nearestIdx);
      setTimeout(() => setWrongFlash(null), 500);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder:       () => true,
      onMoveShouldSetPanResponder:        () => true,
      onPanResponderGrant: ({ nativeEvent: { locationX, locationY } }) => {
        tryTapAt(locationX, locationY);
      },
      onPanResponderMove: ({ nativeEvent: { locationX, locationY } }) => {
        tryTapAt(locationX, locationY);
      },
    })
  ).current;

  const reset = () => {
    setConnected([]);
    setNextDot(0);
    setWrongTaps(0);
    setFinished(false);
    setResult(null);
    setWrongFlash(null);
    lastTappedRef.current = null;
    startTime.current = Date.now();
  };

  const handleNext = () => {
    if (result) onComplete?.(result.duration, result.score);
  };

  const pct = (connected.length / dots.length) * 100;

  return (
    <View style={s.container}>
      <View style={s.instrRow}>
        <Text style={s.instruction}>
          {finished ? '🎉  You connected all the dots!' : 'Tap dot  '}
          {!finished && <Text style={s.instrBold}>{nextDot + 1}</Text>}
          {!finished && '  of  '}
          {!finished && <Text style={s.instrBold}>{dots.length}</Text>}
        </Text>
        {wrongTaps > 0 && !finished && (
          <Text style={s.wrongCount}>❌ {wrongTaps} wrong tap{wrongTaps !== 1 ? 's' : ''}</Text>
        )}
      </View>

      <View style={s.canvas} {...panResponder.panHandlers}>
        <Svg width={W} height={H} pointerEvents="none">
          {/* Lines */}
          {connected.slice(0, -1).map((ci, idx) => {
            const a = dots[ci], b = dots[connected[idx + 1]];
            return <Line key={idx} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={colors.primary} strokeWidth={4} strokeLinecap="round" />;
          })}
          {finished && dots.length > 2 && (
            <Line
              x1={dots[dots.length - 1].x} y1={dots[dots.length - 1].y}
              x2={dots[0].x} y2={dots[0].y}
              stroke={colors.primary} strokeWidth={4} strokeLinecap="round" />
          )}

          {/* Dots */}
          {(dots as { x: number; y: number }[]).map((dot, i) => {
            const isDone   = connected.includes(i);
            const isNext   = i === nextDot && !finished;
            const isWrong  = i === wrongFlash;
            const dotColor = isWrong ? colors.danger
                           : isDone  ? colors.success
                           : isNext  ? colors.secondary
                           :           '#CBD5E0';
            const r = isNext ? 30 : 22;

            return (
              <G key={i}>
                {isNext && (
                  <Circle cx={dot.x} cy={dot.y} r={46}
                    fill="none" stroke={colors.secondary} strokeWidth={2.5} opacity={0.35} />
                )}
                <Circle cx={dot.x} cy={dot.y} r={r} fill={dotColor}
                  stroke={isNext ? colors.warning : isDone ? colors.success : 'transparent'}
                  strokeWidth={isNext ? 3.5 : isDone ? 2 : 0} />
                <SvgText x={dot.x} y={dot.y + 6} textAnchor="middle"
                  fontSize={isNext ? 16 : 13} fontWeight="bold"
                  fill={isDone || isNext || isWrong ? '#fff' : colors.textLight}>
                  {i + 1}
                </SvgText>
              </G>
            );
          })}

          {finished && (
            <SvgText x={W / 2} y={H - 10} textAnchor="middle"
              fontSize={16} fill={colors.success} fontWeight="bold">
              ⭐  {pattern.name}  ⭐
            </SvgText>
          )}
        </Svg>
      </View>

      <View style={s.progressRow}>
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${pct}%` as any }]} />
        </View>
        <Text style={s.progressTxt}>{connected.length}/{dots.length}</Text>
        <TouchableOpacity style={s.resetBtn} onPress={reset} activeOpacity={0.8}>
          <Text style={s.btnTxt}>🔄  Reset</Text>
        </TouchableOpacity>
      </View>

      {result && (
        <ResultOverlay
          score={result.score}
          duration={result.duration}
          label={pattern.name}
          onTryAgain={reset}
          onNext={handleNext}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { alignItems: 'center', position: 'relative' },
  instrRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12 },
  instruction: { fontSize: 18, fontWeight: '600', color: colors.text, textAlign: 'center' },
  instrBold: { fontWeight: '900', color: colors.primary, fontSize: 20 },
  wrongCount: { fontSize: 14, fontWeight: '700', color: colors.danger },
  canvas: {
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 3, borderColor: colors.primaryLight,
    backgroundColor: '#FAFCFF', elevation: 6,
  },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18, gap: 14, width: '100%', maxWidth: W },
  progressTrack: { flex: 1, height: 14, backgroundColor: '#E0E0E0', borderRadius: 7, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.success, borderRadius: 7 },
  progressTxt: { fontSize: 16, fontWeight: '800', color: colors.text, minWidth: 52 },
  resetBtn: { backgroundColor: colors.warning, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, elevation: 2 },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
});