import React, { useRef, useState } from 'react';
import { View, StyleSheet, PanResponder, TouchableOpacity, Text } from 'react-native';
import Svg, { Path, Circle, Polygon, Text as SvgText, G } from 'react-native-svg';
import { colors } from '../constants/theme';
import { calculateAccuracyFromPts, expandGuide, type Pt } from '../utils/accuracyEngine';
import ResultOverlay from './ResultOverlay';
import type { Shape } from '../constants/exercises';

const W = 420;
const H = 330;

// Each shape has: guide waypoints (for accuracy), SVG element (for display), start dot
const SHAPE_DATA: Record<string, {
  guidePoints: [number, number][];
  start: Pt;
  svgGuide: React.ReactElement;
}> = {
  circle: {
    guidePoints: (() => {
      const pts: [number, number][] = [];
      for (let a = 0; a <= 360; a += 8) {
        const r = a * Math.PI / 180;
        pts.push([210 + 115 * Math.cos(r), 165 + 115 * Math.sin(r)]);
      }
      return pts;
    })(),
    start: { x: 210, y: 50 },
    svgGuide: <Circle cx={210} cy={165} r={115} stroke="#4A90D9" strokeWidth={3} strokeDasharray="10,6" fill="none" opacity={0.5}/>,
  },
  square: {
    guidePoints: [[85,52],[210,52],[335,52],[335,140],[335,278],[210,278],[85,278],[85,140],[85,52]],
    start: { x: 85, y: 52 },
    svgGuide: <Polygon points="85,52 335,52 335,278 85,278" stroke="#4A90D9" strokeWidth={3} strokeDasharray="10,6" fill="none" opacity={0.5}/>,
  },
  triangle: {
    guidePoints: [[210,40],[252,112],[295,185],[335,258],[272,258],[210,258],[148,258],[85,258],[127,185],[168,112],[210,40]],
    start: { x: 210, y: 40 },
    svgGuide: <Polygon points="210,40 355,278 65,278" stroke="#4CAF50" strokeWidth={3} strokeDasharray="10,6" fill="none" opacity={0.5}/>,
  },
  star: {
    guidePoints: [[210,38],[224,92],[238,145],[285,145],[315,145],[286,168],[260,190],[270,240],[288,292],[210,252],[132,292],[150,240],[160,190],[134,168],[105,145],[138,145],[182,145],[196,92],[210,38]],
    start: { x: 210, y: 38 },
    svgGuide: <Polygon points="210,38 238,145 345,145 260,205 288,312 210,252 132,312 160,205 75,145 182,145" stroke="#FFD600" strokeWidth={3} strokeDasharray="8,6" fill="none" opacity={0.5}/>,
  },
  heart: {
    guidePoints: (() => {
      const pts: [number, number][] = [];
      // Top-left arc
      for (let a = 140; a >= -25; a -= 8) {
        const r = a * Math.PI / 180;
        pts.push([134 + 78 * Math.cos(r), 112 + 72 * Math.sin(r)]);
      }
      // Top-right arc  
      for (let a = 205; a <= 370; a += 8) {
        const r = a * Math.PI / 180;
        pts.push([286 + 78 * Math.cos(r), 112 + 72 * Math.sin(r)]);
      }
      pts.push([210, 268]);
      return pts;
    })(),
    start: { x: 134, y: 52 },
    svgGuide: <Path d="M210,268 C210,268 62,162 62,108 C62,68 94,48 134,58 C165,67 192,90 210,112 C228,90 255,67 286,58 C326,48 358,68 358,108 C358,162 210,268 210,268 Z" stroke="#E91E63" strokeWidth={3} strokeDasharray="10,6" fill="none" opacity={0.5}/>,
  },
  diamond: {
    guidePoints: [[210,38],[252,88],[295,138],[335,165],[295,192],[252,242],[210,292],[168,242],[125,192],[85,165],[125,138],[168,88],[210,38]],
    start: { x: 210, y: 38 },
    svgGuide: <Polygon points="210,38 335,165 210,292 85,165" stroke="#7C4DFF" strokeWidth={3} strokeDasharray="10,6" fill="none" opacity={0.5}/>,
  },
};

type Point  = { x: number; y: number };
type Stroke = { id: number; points: Point[] };

interface Props {
  shape: Shape;
  onComplete?: (duration: number, accuracy: number) => void;
}

export default function ShapeTracer({ shape, onComplete }: Props) {
  const [strokes,      setStrokes]      = useState<Stroke[]>([]);
  const [currentPts,   setCurrentPts]   = useState<Point[]>([]);
  const [currentPath,  setCurrentPath]  = useState('');
  const [result, setResult] = useState<{ score: number; duration: number } | null>(null);
  const startTime  = useRef(Date.now());
  const strokesRef = useRef<Stroke[]>([]);
  strokesRef.current = strokes;

  const shapeData = SHAPE_DATA[shape.id] ?? SHAPE_DATA.circle;

  // Pre-expand guide into dense Pt[] for accuracy engine
  const guidePts = useRef<Pt[]>(expandGuide(shapeData.guidePoints, 4));

  const toD = (pts: Point[]) =>
    pts.length < 2 ? '' : pts.reduce((d, p, i) => i === 0 ? `M${p.x} ${p.y}` : `${d} L${p.x} ${p.y}`, '');

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: ({ nativeEvent: { locationX: x, locationY: y } }) => {
        setCurrentPts([{ x, y }]);
      },
      onPanResponderMove: ({ nativeEvent: { locationX: x, locationY: y } }) => {
        setCurrentPts(prev => {
          const pts = [...prev, { x, y }];
          setCurrentPath(toD(pts));
          return pts;
        });
      },
      onPanResponderRelease: () => {
        setCurrentPts(prev => {
          if (prev.length > 1) {
            const stroke: Stroke = { id: Date.now(), points: prev };
            setStrokes(s => [...s, stroke]);
          }
          setCurrentPath('');
          return [];
        });
      },
    }),
  ).current;

  const handleDone = () => {
    if (!strokes.length) return;
    const duration = Math.round((Date.now() - startTime.current) / 1000);
    const score = calculateAccuracyFromPts(strokesRef.current, guidePts.current);
    setResult({ score, duration });
  };

  const handleTryAgain = () => {
    setStrokes([]);
    setCurrentPts([]);
    setCurrentPath('');
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
          {/* Thick soft guide band */}
          {React.cloneElement(shapeData.svgGuide, {
            strokeWidth: 26, stroke: colors.primaryLight, strokeDasharray: undefined,
            opacity: 0.15, strokeLinecap: 'round', strokeLinejoin: 'round',
          } as any)}
          {/* Dashed outline */}
          {shapeData.svgGuide}

          {/* Start dot */}
          {strokes.length === 0 && (
            <G>
              <Circle cx={shapeData.start.x} cy={shapeData.start.y} r={17} fill={colors.secondary} opacity={0.85}/>
              <SvgText x={shapeData.start.x} y={shapeData.start.y - 24} textAnchor="middle"
                fontSize={13} fill={colors.secondary} fontWeight="bold">Start here!</SvgText>
            </G>
          )}

          {/* Drawn strokes */}
          {strokes.map(stroke => (
            <Path key={stroke.id} d={toD(stroke.points)}
              stroke={colors.primary} strokeWidth={13}
              fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          ))}
          {currentPath && (
            <Path d={currentPath} stroke={colors.secondary} strokeWidth={13}
              fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          )}
        </Svg>
      </View>

      <View style={s.controls}>
        <Text style={s.hint}>✏️  Trace along the shape guide</Text>
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
          label={shape.name}
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
