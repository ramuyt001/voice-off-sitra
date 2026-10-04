export type ReadingModeId = 'ugc' | 'elegant' | 'promo';

export interface ReadingMode {
  id: ReadingModeId;
  name: string;
  tagline: string;
  displayDescription: string;
  ttsStyle: string;
  iconName: string;
  badge: string;
}

export type TargetDuration = 10 | 15 | 20 | 30;

export interface DurationConfig {
  seconds: TargetDuration;
  minWords: number;
  maxWords: number;
  label: string;
}

export interface ReadingInstruction {
  id: string;
  targetText: string;
  instructionType: string;
  label: string;
  customNote?: string;
}

export type DirectionSource = 'manual' | 'automatic';
export type DirectionPace = 'slow' | 'measured' | 'natural' | 'lively' | 'fast';
export type DirectionPause = 'none' | 'before' | 'after' | 'both';

export type PitchContour =
  | 'level'
  | 'gentle_rise'
  | 'rise_then_fall'
  | 'gentle_fall'
  | 'reset_then_fall'
  | 'question_rise';

export type VoiceEnergy = 'soft' | 'medium' | 'bright' | 'strong';

export type SegmentContinuity = 'connected' | 'soft_boundary' | 'clear_boundary';

export type SegmentCommercialRole =
  | 'accueil'
  | 'hook'
  | 'problème'
  | 'solution'
  | 'présentation_produit'
  | 'découverte'
  | 'caractéristique'
  | 'démonstration'
  | 'bénéfice'
  | 'bénéfice_visuel'
  | 'preuve_sociale'
  | 'qualité'
  | 'confort'
  | 'conseil_pratique'
  | 'prix'
  | 'promotion'
  | 'personnalisation'
  | 'couleur'
  | 'taille'
  | 'livraison'
  | 'disponibilité'
  | 'rareté'
  | 'CTA'
  | 'invitation'
  | 'information_rassurante'
  | 'conclusion_marque'
  | 'transition'
  | 'information';

export interface EmotionalDirection {
  id: string;
  source: DirectionSource;
  locked: boolean;
  startIndex: number;
  endIndex: number;
  targetText: string;
  role: SegmentCommercialRole;
  emotion: string;
  intention?: string;
  intensity: number; // 1 to 5
  pace: DirectionPace;
  pitchContour?: PitchContour;
  energy?: VoiceEnergy;
  emphasisTokens?: string[];
  emphasisWords?: string; // legacy fallback
  pauseBeforeTargetMs?: number;
  pauseAfterTargetMs?: number;
  continuity?: SegmentContinuity;
  pauseBefore: boolean;
  pauseAfter: boolean;
  shortTtsStyle: string;
  customNote?: string;
  isValid: boolean;
  status?: 'valid' | 'invalid' | 'archived';
  scriptFingerprint?: string;
}

export interface MacroGroup {
  groupId: string;
  segmentIds: string[];
  text: string;
  style: string;
  roleSummary: string;
  pauseBefore?: boolean;
  pauseAfter?: boolean;
}

export interface SynthesisContinuityResult {
  macroGroups: MacroGroup[];
  totalMicroSegments: number;
  ttsPartsCount: number;
  synthesisStrategy: 'unified_flow' | 'macro_groups';
  usedLocalFallback?: boolean;
  silenceMeasurements?: Array<{
    start: number;
    end: number;
    duration: number;
  }>;
}

export interface SegmentAnalysisInput {
  segmentId: string;
  text: string;
  startIndex: number;
  endIndex: number;
}

export interface ScriptOptimizationResult {
  optimizedText: string;
  estimatedDurationSeconds: number;
  preservedFacts: string[];
  warnings: string[];
  changesSummary: string;
  usedLocalFallback?: boolean;
}

export interface VoiceStatus {
  ready: boolean;
  voiceId?: string;
  displayName: string;
  hasSample: boolean;
  error?: string;
}

export interface AudioDetailedMetrics {
  totalDuration: number;
  wavDuration?: number;
  mp3Duration?: number;
  voiceStart: number;
  voiceEnd: number;
  spokenDuration: number;
  initialSilenceMarginMs: number;
  finalSilenceMarginMs: number;
  internalPausesCount: number;
  internalPauses: Array<{ start: number; end: number; duration: number }>;
  medianPauseMs: number;
  maxPauseMs: number;
  cumulativePauseDurationSeconds: number;
}

export interface AudioGenerationResult {
  audioBlobUrl: string;
  wavBlobUrl?: string;
  durationSeconds: number;
  wavDurationSeconds?: number;
  fileSizeBytes: number;
  costEstimateUsd: number;
  costEstimateEur: number;
  mode: ReadingModeId;
  targetDuration: TargetDuration;
  generatedAt: string;
  fileName: string;
  hasEmotionalDirection?: boolean;
  strategyUsed?: 'unified_flow' | 'macro_groups' | 'legacy_multipart';
  macroGroupsCount?: number;
  microSegmentsCount?: number;
  usedLocalFallback?: boolean;
  detectedSilences?: Array<{
    start: number;
    end: number;
    duration: number;
  }>;
  measurements?: AudioDetailedMetrics;
  wavMeasurements?: AudioDetailedMetrics;
}

export interface ComparisonResult {
  standard: AudioGenerationResult;
  directed: AudioGenerationResult;
  generatedAt: string;
}

