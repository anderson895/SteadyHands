import React, { useRef, useState, useCallback } from 'react';
import { View, StyleSheet, PanResponder, Text, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, Text as SvgText, Line, G, Polyline } from 'react-native-svg';
import { colors } from '../constants/theme';
import { calculateAccuracy } from '../utils/accuracyEngine';
import ResultOverlay from './ResultOverlay';

const W = 420;
const H = 330;
const STROKE = 14;

// Dense waypoints per letter/number so the accuracy engine has enough
// reference points to measure proximity correctly.
const LETTER_GUIDES: Record<string, [number, number][]> = {
  A: [[210,40],[175,112],[155,170],[120,285],[210,40],[245,112],[265,170],[300,285],[148,195],[172,195],[210,195],[248,195],[272,195]],
  B: [[120,40],[120,285],[120,40],[175,42],[210,48],[235,62],[248,85],[248,105],[238,125],[215,138],[120,138],[215,138],[240,152],[255,172],[255,195],[242,218],[218,242],[188,260],[155,268],[120,268]],
  C: [[295,88],[270,60],[242,45],[210,38],[175,42],[145,55],[118,78],[100,108],[92,142],[92,178],[102,212],[120,242],[148,265],[178,278],[210,285],[245,280],[272,265],[292,248]],
  D: [[120,40],[120,285],[120,40],[162,42],[200,50],[232,65],[258,88],[272,118],[278,148],[278,175],[268,205],[248,232],[222,252],[192,265],[158,272],[120,272]],
  E: [[280,40],[200,40],[155,40],[120,40],[120,100],[120,162],[175,162],[218,162],[120,162],[120,220],[120,285],[175,285],[225,285],[280,285]],
  F: [[280,40],[200,40],[120,40],[120,100],[120,162],[175,162],[218,162],[120,162],[120,220],[120,285]],
  G: [[295,88],[270,60],[242,45],[210,38],[175,42],[145,55],[118,78],[100,108],[92,142],[92,178],[102,212],[120,242],[148,265],[178,278],[210,285],[245,280],[272,265],[295,245],[298,215],[298,188],[262,188],[225,188]],
  H: [[120,40],[120,100],[120,162],[120,220],[120,285],[120,162],[175,162],[220,162],[265,162],[300,162],[300,100],[300,40],[300,220],[300,285]],
  I: [[165,40],[210,40],[255,40],[210,40],[210,100],[210,162],[210,220],[210,285],[165,285],[210,285],[255,285]],
  J: [[255,40],[300,40],[300,100],[300,162],[300,220],[295,248],[278,268],[252,280],[220,285],[188,280],[162,262],[148,238]],
  K: [[120,40],[120,100],[120,162],[120,220],[120,285],[120,162],[162,132],[205,100],[255,65],[295,40],[120,162],[165,192],[208,222],[255,255],[295,285]],
  L: [[120,40],[120,100],[120,162],[120,220],[120,285],[165,285],[210,285],[255,285],[280,285]],
  M: [[120,40],[120,100],[120,162],[120,220],[120,285],[120,40],[165,90],[210,135],[255,90],[300,40],[300,100],[300,162],[300,220],[300,285]],
  N: [[120,40],[120,100],[120,162],[120,220],[120,285],[120,40],[165,82],[210,125],[255,168],[300,210],[300,285],[300,220],[300,162],[300,100],[300,40]],
  O: [[210,40],[172,45],[142,62],[115,88],[100,118],[92,150],[92,178],[100,210],[118,240],[142,262],[172,278],[210,285],[248,278],[278,262],[302,240],[318,210],[325,178],[325,150],[318,118],[302,88],[278,62],[248,45],[210,40]],
  P: [[120,40],[120,100],[120,162],[120,220],[120,285],[120,40],[175,42],[215,52],[245,70],[258,95],[258,120],[245,145],[215,158],[175,165],[120,165]],
  Q: [[210,40],[172,45],[142,62],[115,88],[100,118],[92,150],[92,178],[100,210],[118,240],[142,262],[172,278],[210,285],[248,278],[278,262],[302,240],[318,210],[325,178],[325,150],[318,118],[302,88],[278,62],[248,45],[210,40],[245,248],[268,265],[295,285],[310,298]],
  R: [[120,40],[120,100],[120,162],[120,220],[120,285],[120,40],[175,42],[215,52],[245,70],[258,95],[258,120],[245,145],[215,158],[175,165],[120,165],[165,198],[205,225],[248,258],[285,285]],
  S: [[295,82],[272,58],[248,45],[218,38],[185,40],[158,52],[135,72],[122,100],[122,128],[135,152],[162,168],[195,178],[228,188],[258,202],[278,222],[285,248],[278,268],[258,280],[228,288],[195,285],[162,278],[138,262],[118,245]],
  T: [[120,40],[165,40],[210,40],[255,40],[300,40],[210,40],[210,100],[210,162],[210,220],[210,285]],
  U: [[120,40],[120,100],[120,162],[120,205],[122,230],[132,255],[150,272],[175,283],[210,285],[245,283],[270,272],[288,255],[298,230],[300,205],[300,162],[300,100],[300,40]],
  V: [[120,40],[145,88],[170,135],[190,182],[210,230],[210,285],[230,230],[250,182],[270,135],[285,88],[300,40]],
  W: [[120,40],[135,90],[155,148],[175,205],[195,262],[210,285],[225,262],[245,205],[265,148],[285,90],[300,40]],
  X: [[120,40],[148,72],[175,105],[200,135],[235,175],[265,218],[285,248],[300,285],[210,162],[120,285],[148,255],[175,225],[200,195],[235,155],[265,108],[285,75],[300,40]],
  Y: [[120,40],[148,72],[175,105],[200,138],[210,162],[300,40],[272,72],[248,105],[225,138],[210,162],[210,220],[210,285]],
  Z: [[120,40],[175,40],[228,40],[280,40],[300,40],[278,62],[255,88],[228,118],[200,148],[172,178],[148,205],[125,232],[120,258],[120,285],[175,285],[228,285],[280,285],[300,285]],
};

const NUMBER_GUIDES: Record<string, [number, number][]> = {
  '0': [[210,40],[172,45],[142,62],[115,88],[100,118],[92,150],[92,178],[100,210],[118,240],[142,262],[172,278],[210,285],[248,278],[278,262],[302,240],[318,210],[325,178],[325,150],[318,118],[302,88],[278,62],[248,45],[210,40]],
  '1': [[170,68],[192,58],[212,45],[212,80],[212,120],[212,162],[212,205],[212,245],[212,285],[178,285],[248,285]],
  '2': [[130,92],[148,68],[168,52],[195,40],[225,40],[255,52],[275,72],[285,98],[285,122],[272,145],[252,165],[225,185],[195,205],[165,225],[140,248],[120,272],[120,285],[175,285],[228,285],[280,285],[305,285]],
  '3': [[132,58],[155,45],[182,38],[215,38],[248,48],[272,68],[282,95],[278,122],[260,142],[238,158],[215,162],[238,165],[262,180],[280,205],[285,232],[275,258],[255,275],[225,285],[195,285],[168,278],[142,262]],
  '4': [[262,42],[235,72],[205,108],[175,148],[142,188],[108,188],[175,188],[228,188],[262,188],[295,188],[318,188],[262,188],[262,220],[262,252],[262,285]],
  '5': [[295,40],[265,40],[235,40],[205,40],[172,40],[140,40],[120,40],[112,65],[108,90],[108,118],[115,142],[132,155],[158,162],[188,165],[218,168],[248,178],[268,198],[278,225],[275,255],[258,275],[230,285],[200,285],[172,278],[148,262],[128,242]],
  '6': [[278,72],[258,50],[232,38],[202,35],[172,40],[145,55],[118,80],[102,112],[92,148],[90,185],[95,222],[108,255],[128,272],[155,283],[185,288],[215,285],[245,275],[268,255],[280,228],[282,198],[272,168],[252,148],[225,135],[195,130],[165,135],[135,148],[112,168]],
  '7': [[122,42],[162,42],[205,42],[248,42],[292,42],[305,42],[288,68],[268,98],[245,132],[220,168],[198,202],[175,238],[158,265],[145,285]],
  '8': [[210,162],[175,155],[148,138],[132,112],[135,85],[152,62],[178,48],[210,42],[242,48],[268,62],[285,85],[288,112],[272,138],[245,155],[210,162],[172,170],[142,188],[125,212],[125,242],[142,265],[168,280],[210,285],[252,280],[278,265],[295,242],[295,212],[278,188],[248,170],[210,162]],
  '9': [[210,42],[178,48],[152,65],[132,90],[122,118],[125,148],[142,172],[168,185],[200,192],[232,190],[260,178],[278,158],[288,130],[285,100],[268,75],[248,55],[222,42],[195,40],[212,195],[215,240],[212,285]],
};

type Point  = { x: number; y: number };
type Stroke = { id: number; points: Point[] };

interface Props {
  label: string;
  labelType?: 'letter' | 'number';
  onComplete?: (duration: number, accuracy: number) => void;
}

export default function TracingCanvas({ label, labelType = 'letter', onComplete }: Props) {
  const [strokes,       setStrokes]       = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [result, setResult] = useState<{ score: number; duration: number } | null>(null);
  const startTime  = useRef(Date.now());
  const strokesRef = useRef<Stroke[]>([]);
  strokesRef.current = strokes;

  const guide = labelType === 'letter' ? LETTER_GUIDES[label] : NUMBER_GUIDES[label];

  const toD = (pts: Point[]) =>
    pts.length < 2 ? '' : pts.reduce((d, p, i) => i === 0 ? `M${p.x} ${p.y}` : `${d} L${p.x} ${p.y}`, '');

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: ({ nativeEvent: { locationX: x, locationY: y } }) => {
        setCurrentStroke({ id: Date.now(), points: [{ x, y }] });
      },
      onPanResponderMove: ({ nativeEvent: { locationX: x, locationY: y } }) => {
        setCurrentStroke(prev => prev ? { ...prev, points: [...prev.points, { x, y }] } : prev);
      },
      onPanResponderRelease: () => {
        setCurrentStroke(prev => {
          if (prev) setStrokes(s => [...s, prev]);
          return null;
        });
      },
    }),
  ).current;

  const handleDone = useCallback(() => {
    const duration = Math.round((Date.now() - startTime.current) / 1000);
    const score = guide ? calculateAccuracy(strokesRef.current, guide) : 0;
    setResult({ score, duration });
  }, [guide]);

  const handleTryAgain = () => {
    setStrokes([]);
    setCurrentStroke(null);
    setResult(null);
    startTime.current = Date.now();
  };

  const handleNext = () => {
    if (result) onComplete?.(result.duration, result.score);
  };

  return (
    <View style={s.container}>
      <View {...panResponder.panHandlers} style={s.canvas}>
        <Svg width={W} height={H}>
          {/* Grid */}
          {Array.from({ length: 9 }).map((_, i) => (
            <Line key={`h${i}`} x1={0} y1={i*40} x2={W} y2={i*40} stroke="#ECF4FF" strokeWidth={1}/>
          ))}
          {Array.from({ length: 11 }).map((_, i) => (
            <Line key={`v${i}`} x1={i*42} y1={0} x2={i*42} y2={H} stroke="#ECF4FF" strokeWidth={1}/>
          ))}

          {/* Ghost letter */}
          <SvgText x={W/2} y={H/2+65} textAnchor="middle" fontSize={200} fontWeight="bold"
            fill={colors.primaryLight} opacity={0.08}>{label}</SvgText>

          {/* Guide: thick soft band + dashed line + dots */}
          {guide && (
            <G>
              <Polyline
                points={guide.map(p=>`${p[0]},${p[1]}`).join(' ')}
                stroke={colors.primaryLight} strokeWidth={26}
                fill="none" opacity={0.18} strokeLinecap="round" strokeLinejoin="round"
              />
              <Polyline
                points={guide.map(p=>`${p[0]},${p[1]}`).join(' ')}
                stroke={colors.primary} strokeWidth={2.5}
                strokeDasharray="9,5" fill="none" opacity={0.6}
              />
              {guide.map(([cx,cy],i)=>(
                <Circle key={i} cx={cx} cy={cy} r={4} fill={colors.primary} opacity={0.3}/>
              ))}
              {strokes.length === 0 && (
                <G>
                  <Circle cx={guide[0][0]} cy={guide[0][1]} r={17} fill={colors.secondary} opacity={0.85}/>
                  <SvgText x={guide[0][0]} y={guide[0][1]-24} textAnchor="middle"
                    fontSize={13} fill={colors.secondary} fontWeight="bold">Start here!</SvgText>
                </G>
              )}
            </G>
          )}

          {/* Completed strokes */}
          {strokes.map(stroke=>(
            <Path key={stroke.id} d={toD(stroke.points)}
              stroke={colors.primary} strokeWidth={STROKE}
              fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          ))}
          {/* Active stroke */}
          {currentStroke && (
            <Path d={toD(currentStroke.points)}
              stroke={colors.secondary} strokeWidth={STROKE}
              fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          )}
        </Svg>
      </View>

      <View style={s.controls}>
        <Text style={s.hint}>✏️  Follow the dotted guide line</Text>
        <TouchableOpacity style={s.clearBtn} onPress={handleTryAgain} activeOpacity={0.8}>
          <Text style={s.btnTxt}>🗑️  Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.doneBtn, strokes.length === 0 && s.btnDis]}
          onPress={handleDone}
          disabled={strokes.length === 0}
          activeOpacity={0.8}
        >
          <Text style={s.btnTxt}>✅  Done!</Text>
        </TouchableOpacity>
      </View>

      {result && (
        <ResultOverlay
          score={result.score}
          duration={result.duration}
          label={label}
          onTryAgain={handleTryAgain}
          onNext={handleNext}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { alignItems: 'center', position: 'relative' },
  canvas: {
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 3, borderColor: colors.primaryLight,
    backgroundColor: '#FAFCFF', elevation: 6,
  },
  controls: { flexDirection: 'row', alignItems: 'center', marginTop: 18, gap: 14 },
  hint: { fontSize: 14, color: colors.textLight, fontWeight: '600', flex: 1 },
  clearBtn: { backgroundColor: colors.warning, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 14, elevation: 2 },
  doneBtn: { backgroundColor: colors.success, paddingHorizontal: 26, paddingVertical: 12, borderRadius: 14, elevation: 2 },
  btnDis: { backgroundColor: colors.border },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
