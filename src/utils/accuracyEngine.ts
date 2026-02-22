/**
 * accuracyEngine.ts  — v2  (strict letter-matching)
 *
 * Root cause of the old bug:
 *   The engine only asked "are the drawn points close to THIS guide?"
 *   But it never asked "does the drawing stay WITHIN the bounding box of THIS guide?"
 *   So drawing 'B' near an 'A' guide still scored high because some B strokes
 *   happened to be near a few A waypoints.
 *
 * Fix strategy (3-factor scoring):
 *   1. PROXIMITY  (50%) — drawn points must be close to guide path
 *   2. COVERAGE   (35%) — guide path must be well-covered by drawn points
 *   3. STRAY PENALTY (15%) — drawn points far outside the guide bounding box
 *                            are penalised heavily
 *
 * Additionally, hard gates are applied BEFORE combining scores:
 *   • If coverage  < MIN_COVERAGE_GATE  → hard cap at 45
 *   • If stray ratio > MAX_STRAY_GATE   → hard cap at 45
 *   Both gates together prevent "wrong letter" false passes.
 */

export type Pt = { x: number; y: number };

// ─── Tuneable constants ───────────────────────────────────────────────────────

/** Drawn point within this px of guide = perfect hit (tight!) */
const ON_TRACK_PX = 18;

/** Drawn point beyond this px = zero score for that point */
const FAR_AWAY_PX = 40;

/**
 * Guide coverage threshold.
 * User must cover at least this fraction of the guide path.
 */
const MIN_COVERAGE_GATE = 0.65;   // 65%

/**
 * Stray tolerance.
 * If more than this fraction of drawn points fall outside the guide's
 * padded bounding box, score is capped.
 */
const MAX_STRAY_GATE = 0.20;      // 20% — stricter

/** Extra padding around guide bounding box before declaring a point "stray" */
const BBOX_PAD = 28;              // tighter bbox

/** Hard-cap score when a gate is triggered */
const GATE_CAP = 40;

/**
 * Minimum proximity score required before coverage even matters.
 * If user's strokes are mostly off-path, fail immediately.
 */
const MIN_PROXIMITY_GATE = 45;    // drawn points must actually hug the path

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Expand guide waypoints into densely-spaced points for fine distance checks.
 */
export function expandGuide(guide: [number, number][], step = 4): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < guide.length - 1; i++) {
    const [ax, ay] = guide[i];
    const [bx, by] = guide[i + 1];
    const segLen = Math.hypot(bx - ax, by - ay);
    const steps  = Math.max(1, Math.ceil(segLen / step));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      pts.push({ x: ax + (bx - ax) * t, y: ay + (by - ay) * t });
    }
  }
  return pts;
}

/** Sample drawn strokes — take every 3rd point for performance */
export function sampleStrokes(strokes: { points: Pt[] }[]): Pt[] {
  const all: Pt[] = [];
  for (const stroke of strokes) {
    for (let i = 0; i < stroke.points.length; i += 3) {
      all.push(stroke.points[i]);
    }
  }
  return all;
}

/** Minimum distance from a point to any point on the expanded guide */
function minDistToGuide(pt: Pt, guidePts: Pt[]): number {
  let min = Infinity;
  for (const gp of guidePts) {
    const d = dist(pt, gp);
    if (d < min) min = d;
  }
  return min;
}

/** Axis-aligned bounding box of a set of points */
function boundingBox(pts: Pt[]): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}

// ─── Scoring components ───────────────────────────────────────────────────────

/**
 * PROXIMITY SCORE (0–100)
 * What fraction of drawn points hug the guide path?
 */
function proximityScore(drawnPts: Pt[], guidePts: Pt[]): number {
  if (drawnPts.length === 0) return 0;
  let total = 0;
  for (const dp of drawnPts) {
    const d = minDistToGuide(dp, guidePts);
    if (d <= ON_TRACK_PX) {
      total += 1.0;
    } else if (d <= FAR_AWAY_PX) {
      total += 1 - (d - ON_TRACK_PX) / (FAR_AWAY_PX - ON_TRACK_PX);
    }
    // else += 0
  }
  return (total / drawnPts.length) * 100;
}

/**
 * COVERAGE SCORE (0–100)
 * What fraction of the guide path has a drawn point near it?
 * Prevents "one perfect dot" from scoring 100.
 */
function coverageScore(drawnPts: Pt[], guidePts: Pt[]): number {
  if (guidePts.length === 0) return 0;
  let covered = 0;
  let total   = 0;
  const coverThresh = ON_TRACK_PX + 10;
  for (let i = 0; i < guidePts.length; i += 3) {
    total++;
    const gp = guidePts[i];
    if (drawnPts.some(dp => dist(dp, gp) <= coverThresh)) covered++;
  }
  return total > 0 ? (covered / total) * 100 : 0;
}

/**
 * STRAY RATIO (0–1)
 * Fraction of drawn points that fall outside the guide's padded bounding box.
 * High stray ratio → user drew in the wrong place (wrong letter).
 */
function strayRatio(drawnPts: Pt[], guidePts: Pt[]): number {
  if (drawnPts.length === 0) return 0;
  const bb = boundingBox(guidePts);
  const { minX, minY, maxX, maxY } = {
    minX: bb.minX - BBOX_PAD,
    minY: bb.minY - BBOX_PAD,
    maxX: bb.maxX + BBOX_PAD,
    maxY: bb.maxY + BBOX_PAD,
  };
  let stray = 0;
  for (const dp of drawnPts) {
    if (dp.x < minX || dp.x > maxX || dp.y < minY || dp.y > maxY) stray++;
  }
  return stray / drawnPts.length;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Calculate accuracy score (0–100).
 *
 * Weights:  50% proximity  +  35% coverage  +  15% stray-penalty
 * Gates:    if coverage or stray ratio exceeds thresholds, score is capped at 45
 *           so the user cannot "accidentally pass" by drawing the wrong letter.
 */
export function calculateAccuracy(
  strokes: { points: Pt[] }[],
  guide: [number, number][],
): number {
  if (strokes.length === 0 || guide.length < 2) return 0;

  const guidePts = expandGuide(guide, 4);
  const drawnPts = sampleStrokes(strokes);
  if (drawnPts.length === 0) return 0;

  const prox  = proximityScore(drawnPts, guidePts);
  const cov   = coverageScore(drawnPts, guidePts);
  const stray = strayRatio(drawnPts, guidePts);

  // ── Hard gates (ANY one failing = capped) ──────────────────────────────────

  // Gate 1: proximity — drawn strokes are mostly off-path (wrong letter shape)
  const proximityFailed = prox < MIN_PROXIMITY_GATE;

  // Gate 2: coverage — didn't trace enough of the letter
  const coverageFailed = (cov / 100) < MIN_COVERAGE_GATE;

  // Gate 3: stray — too many strokes outside the letter's bounding area
  const strayFailed = stray > MAX_STRAY_GATE;

  if (proximityFailed || coverageFailed || strayFailed) {
    // Give a partial score so feedback shows HOW bad, but never passes
    const raw = prox * 0.5 + cov * 0.35 + (1 - stray) * 15;
    return Math.round(Math.min(GATE_CAP, Math.max(0, raw)));
  }

  // ── Normal scoring (all gates passed) ─────────────────────────────────────
  const strayScore = (1 - stray) * 100;
  const raw = prox * 0.50 + cov * 0.35 + strayScore * 0.15;

  return Math.round(Math.min(100, Math.max(0, raw)));
}

/**
 * Overload for callers that supply pre-expanded guide points (e.g. shape tracers).
 */
export function calculateAccuracyFromPts(
  strokes: { points: Pt[] }[],
  guidePts: Pt[],
): number {
  if (strokes.length === 0 || guidePts.length === 0) return 0;

  const drawnPts = sampleStrokes(strokes);
  if (drawnPts.length === 0) return 0;

  const prox  = proximityScore(drawnPts, guidePts);
  const cov   = coverageScore(drawnPts, guidePts);
  const stray = strayRatio(drawnPts, guidePts);

  const proximityFailed = prox < MIN_PROXIMITY_GATE;
  const coverageFailed  = (cov / 100) < MIN_COVERAGE_GATE;
  const strayFailed     = stray > MAX_STRAY_GATE;

  if (proximityFailed || coverageFailed || strayFailed) {
    const raw = prox * 0.5 + cov * 0.35 + (1 - stray) * 15;
    return Math.round(Math.min(GATE_CAP, Math.max(0, raw)));
  }

  const strayScore = (1 - stray) * 100;
  const raw = prox * 0.50 + cov * 0.35 + strayScore * 0.15;
  return Math.round(Math.min(100, Math.max(0, raw)));
}

// ─── Feedback ─────────────────────────────────────────────────────────────────

/** Human-readable feedback based on score */
export function scoreFeedback(score: number): {
  emoji: string; label: string; color: string; message: string;
} {
  if (score >= 85) return {
    emoji: '🌟', label: 'Excellent!', color: '#4CAF50',
    message: 'Amazing tracing! You stayed right on the guide!',
  };
  if (score >= 70) return {
    emoji: '👍', label: 'Good Job!', color: '#4A90D9',
    message: 'Great work! Most of your drawing followed the path.',
  };
  if (score >= 50) return {
    emoji: '💪', label: 'Keep Trying!', color: '#FF9800',
    message: 'Getting closer! Try to follow the dotted guide line.',
  };
  return {
    emoji: '🔄', label: 'Try Again!', color: '#FF5252',
    message: 'Stay close to the dotted guide path. You can do it!',
  };
}