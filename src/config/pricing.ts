import { DurationConfig, ReadingMode, ReadingModeId, TargetDuration } from '../types.ts';

export const READING_MODES: ReadingMode[] = [
  {
    id: 'ugc',
    name: 'UGC naturel',
    tagline: 'Authentique & Quotidien',
    displayDescription: 'Spontané, chaleureux et proche d’une vraie recommandation.',
    ttsStyle:
      'Conversational, spontaneous and warmly engaged, like sharing a genuine fashion discovery with another Algerian woman. Natural rhythm and subtle smiling energy.',
    iconName: 'MessageSquareHeart',
    badge: 'Populaire',
  },
  {
    id: 'elegant',
    name: 'Élégante et rassurante',
    tagline: 'Raffiné & Posé',
    displayDescription: 'Posé, féminin, raffiné et légèrement premium.',
    ttsStyle:
      'Poised, refined and reassuring, with controlled warmth, graceful pacing and understated premium confidence.',
    iconName: 'Sparkles',
    badge: 'Premium',
  },
  {
    id: 'promo',
    name: 'Promotion dynamique',
    tagline: 'Énergique & Direct',
    displayDescription: 'Énergique et persuasive pour les prix, offres et stocks limités.',
    ttsStyle:
      'Persuasive and lively, with clear excitement around the offer, price and call to action. Energetic but never shouted or rushed.',
    iconName: 'Flame',
    badge: 'Conversion',
  },
];

export const DURATION_CONFIGS: Record<TargetDuration, DurationConfig> = {
  10: {
    seconds: 10,
    minWords: 22,
    maxWords: 28,
    label: '10 secondes',
  },
  15: {
    seconds: 15,
    minWords: 34,
    maxWords: 42,
    label: '15 secondes',
  },
  20: {
    seconds: 20,
    minWords: 45,
    maxWords: 55,
    label: '20 secondes',
  },
  30: {
    seconds: 30,
    minWords: 70,
    maxWords: 85,
    label: '30 secondes',
  },
};

export const PRICING_CONFIG = {
  // USD per 10 seconds of audio
  audioRatePer10s2026: 0.00225,
  audioRatePer10s2027: 0.0045,
  // USD per 1M text tokens
  textRatePerMillion2026: 0.5,
  textRatePerMillion2027: 1.0,
  // Currency exchange
  usdToEurRate: 0.92,
};

/**
 * Calculates the current pricing based on the current date
 */
export function getCurrentRates() {
  const currentYear = new Date().getFullYear();
  const is2026OrEarlier = currentYear <= 2026;

  return {
    audioRatePer10s: is2026OrEarlier
      ? PRICING_CONFIG.audioRatePer10s2026
      : PRICING_CONFIG.audioRatePer10s2027,
    textRatePerMillion: is2026OrEarlier
      ? PRICING_CONFIG.textRatePerMillion2026
      : PRICING_CONFIG.textRatePerMillion2027,
    usdToEur: PRICING_CONFIG.usdToEurRate,
  };
}

/**
 * Estimate cost for a given text and estimated duration in seconds
 */
export function estimateCost(text: string, durationSeconds: number) {
  const rates = getCurrentRates();
  // Average ~1.3 tokens per word/character combination in bilingual arabic-french
  const estimatedTokens = Math.max(10, Math.ceil(text.length * 0.4));
  
  const textCostUsd = (estimatedTokens / 1_000_000) * rates.textRatePerMillion;
  const audioCostUsd = (Math.max(1, durationSeconds) / 10) * rates.audioRatePer10s;
  
  const totalUsd = textCostUsd + audioCostUsd;
  const totalEur = totalUsd * rates.usdToEur;

  return {
    totalUsd,
    totalEur,
    textCostUsd,
    audioCostUsd,
    usdToEurRate: rates.usdToEur,
  };
}

export function countWords(text: string): number {
  if (!text || !text.trim()) return 0;
  // Clean punctuation and whitespace, handles arabic letters & french accents
  const tokens = text
    .trim()
    .replace(/[«»"،.?!;:\-_/\\()[\]{}'"]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  return tokens.length;
}

export interface DurationCalibrationParams {
  text?: string;
  wordCount?: number;
  mode?: ReadingModeId;
  macroGroupsCount?: number;
  pauseCount?: number;
  observedSessionRateMultiplier?: number;
}

// Session calibration cache for Voice Off DZ Original
const SESSION_RATE_KEY = 'voiceoff_session_rates';

export function recordObservedSessionRate(
  wordCount: number,
  actualDurationSeconds: number,
  mode: ReadingModeId = 'ugc'
): void {
  if (wordCount <= 5 || actualDurationSeconds <= 3) return;
  try {
    const rawRate = wordCount / actualDurationSeconds; // words per second
    const stored = sessionStorage.getItem(SESSION_RATE_KEY);
    const rates: Record<string, { totalWords: number; totalSeconds: number; avgRate: number }> =
      stored ? JSON.parse(stored) : {};

    const prev = rates[mode] || { totalWords: 0, totalSeconds: 0, avgRate: rawRate };
    const newWords = prev.totalWords + wordCount;
    const newSeconds = prev.totalSeconds + actualDurationSeconds;
    rates[mode] = {
      totalWords: newWords,
      totalSeconds: newSeconds,
      avgRate: Math.round((newWords / newSeconds) * 100) / 100,
    };
    sessionStorage.setItem(SESSION_RATE_KEY, JSON.stringify(rates));
  } catch {}
}

export function getObservedSessionRate(mode: ReadingModeId = 'ugc'): number | null {
  try {
    const stored = sessionStorage.getItem(SESSION_RATE_KEY);
    if (!stored) return null;
    const rates = JSON.parse(stored);
    return rates[mode]?.avgRate || null;
  } catch {
    return null;
  }
}

/**
 * Calibrated duration estimation considering:
 * - mode pace factor according to Algerian commercial benchmarks:
 *   - UGC naturel: ~185–205 words/min (~3.25 w/s) -> 71 words = ~22s
 *   - Promo: ~190–215 words/min (~3.35 w/s)
 *   - Elegant: ~165–185 words/min (~2.90 w/s)
 * - language composition (Darija & French mix)
 * - punctuation pauses (micro-breathing)
 * - continuous session calibration from Voice Off DZ Original
 */
export function estimateSpeechDurationSeconds(
  paramsOrWordCount: number | DurationCalibrationParams
): number {
  if (typeof paramsOrWordCount === 'number') {
    if (paramsOrWordCount <= 0) return 0;
    return Math.round((paramsOrWordCount / 3.25) * 10) / 10;
  }

  const {
    text = '',
    wordCount: explicitWords,
    mode = 'ugc',
    macroGroupsCount = 3,
    pauseCount = 0,
    observedSessionRateMultiplier,
  } = paramsOrWordCount;

  const wCount = explicitWords ?? countWords(text);
  if (wCount <= 0) return 0;

  // Calibrated Algerian voice benchmarks (words per second)
  let baseRate = 3.25; // UGC: ~195 wpm (Section 9 & 11)
  if (mode === 'promo') baseRate = 3.35; // Promo: ~201 wpm
  if (mode === 'elegant') baseRate = 2.90; // Elegant: ~174 wpm
  if (mode === 'ugc') baseRate = 3.25; // UGC: ~195 wpm

  // Check if session calibration has recorded actual runs for this voice
  const sessionObservedRate = getObservedSessionRate(mode);
  if (sessionObservedRate && sessionObservedRate > 2.0 && sessionObservedRate < 4.5) {
    baseRate = (baseRate * 0.4) + (sessionObservedRate * 0.6);
  }

  // Explicit pause adjustment (minimal natural breathing: ~120-180ms per pause)
  const explicitPauseSec = pauseCount * 0.15;

  let estimated = (wCount / baseRate) + explicitPauseSec;

  if (observedSessionRateMultiplier && observedSessionRateMultiplier > 0.5 && observedSessionRateMultiplier < 2.0) {
    estimated *= observedSessionRateMultiplier;
  }

  return Math.round(estimated * 10) / 10;
}

