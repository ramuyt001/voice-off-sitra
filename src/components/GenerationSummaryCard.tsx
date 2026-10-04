import React from 'react';
import {
  Layers,
  Clock,
  Zap,
  Activity,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  AudioWaveform,
} from 'lucide-react';
import {
  AudioDetailedMetrics,
  EmotionalDirection,
  MacroGroup,
  ReadingModeId,
} from '../types.ts';

interface GenerationSummaryCardProps {
  mode: ReadingModeId;
  targetDuration: number;
  estimatedDuration: number;
  macroGroups: MacroGroup[];
  microSegments: EmotionalDirection[];
  usedLocalFallback?: boolean;
  measurements?: AudioDetailedMetrics;
  wavMeasurements?: AudioDetailedMetrics;
  strategyUsed?: string;
  archivedDirectionsCount?: number;
}

export const GenerationSummaryCard: React.FC<GenerationSummaryCardProps> = ({
  mode,
  targetDuration,
  estimatedDuration,
  macroGroups,
  microSegments,
  usedLocalFallback = false,
  measurements,
  wavMeasurements,
  strategyUsed = 'unified_flow',
  archivedDirectionsCount = 0,
}) => {
  const validMicro = microSegments.filter(
    (d) => d.isValid && d.status !== 'invalid' && d.status !== 'archived'
  );
  const macroCount = macroGroups.length;

  const isSignificantlyShorter =
    estimatedDuration > 0 && targetDuration - estimatedDuration >= 4;

  // Extract key emphasis tokens
  const keyTokens: string[] = [];
  for (const g of macroGroups) {
    for (const d of validMicro) {
      if (d.emphasisTokens && Array.isArray(d.emphasisTokens)) {
        for (const tok of d.emphasisTokens) {
          if (tok && !keyTokens.includes(tok) && keyTokens.length < 4) {
            keyTokens.push(tok);
          }
        }
      }
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                {measurements ? 'Mesures acoustiques & Synthèse vocale' : 'Objectifs d’interprétation pour la synthèse'}
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Format {targetDuration}s
              </span>
              {usedLocalFallback ? (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-950/80 text-sky-300 border border-sky-500/40">
                  Analyseur sémantique local de secours (quota 429 géré)
                </span>
              ) : (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/40">
                  Analyse sémantique Gemini 3.8 Flash
                </span>
              )}
              {archivedDirectionsCount > 0 && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {archivedDirectionsCount} anciennes directions exclues
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Style {mode.toUpperCase()} naturel algérien • Débit fluide ~190–200 mots/min sans étirement
            </p>
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-xs font-bold text-emerald-400">
            ~{estimatedDuration}s durée naturelle
          </span>
          <p className="text-[10px] text-slate-500">format cible {targetDuration}s</p>
        </div>
      </div>

      {/* Pacing Advice Banner (Section 9) */}
      {isSignificantlyShorter && (
        <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs space-y-1">
          <div className="flex items-center gap-2 text-indigo-300 font-semibold">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              Durée naturelle estimée : ~{estimatedDuration} s • Format sélectionné : {targetDuration} s
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Le texte est plus court que le format sélectionné ({targetDuration}s). La voix gardera son débit vivant naturel (~195 mots/min) et <strong>ne sera pas ralentie artificiellement</strong> pour étirer les mots.
          </p>
        </div>
      )}

      {/* Real Post-Generation Measurements Table (Section 14 & 15) */}
      {measurements ? (
        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <AudioWaveform className="w-4 h-4 text-emerald-400" />
              <span>Mesures réelles après génération (WAV brut & MP3 final)</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Stratégie : {strategyUsed === 'unified_flow' ? 'Flux continu (Strategy A)' : 'Macro-groupes (Strategy B)'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            {/* MP3 Duration */}
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Durée MP3 finale</span>
              <span className="text-sm font-bold text-white">{measurements.totalDuration.toFixed(2)} s</span>
              {wavMeasurements && (
                <span className="text-[10px] text-slate-500 block font-mono">WAV brut : {wavMeasurements.totalDuration.toFixed(2)} s</span>
              )}
            </div>

            {/* Micro/Macro architecture */}
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Architecture TTS</span>
              <span className="text-sm font-bold text-emerald-400">{validMicro.length} micro-segs</span>
              <span className="text-[10px] text-slate-400 block">{macroCount} macro-groupes envoyés</span>
            </div>

            {/* Internal pauses */}
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Pauses internes (≥80ms)</span>
              <span className="text-sm font-bold text-white">
                {measurements.internalPausesCount} pauses
              </span>
              <span className="text-[10px] text-slate-400 block">
                médiane : {measurements.medianPauseMs} ms • max : {measurements.maxPauseMs} ms
              </span>
            </div>

            {/* Editing margins */}
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Marges de montage</span>
              <span className="text-sm font-bold text-purple-300">
                +{measurements.initialSilenceMarginMs} ms / +{measurements.finalSilenceMarginMs} ms
              </span>
              <span className="text-[10px] text-slate-400 block">
                cumul pauses : {measurements.cumulativePauseDurationSeconds.toFixed(2)} s
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Pre-Generation Target Grid */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Metric 1: Micro & Macro counts */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Architecture TTS</span>
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>{validMicro.length} micro-segments</span>
              <ArrowRight className="w-3 h-3 text-slate-600" />
              <span className="text-emerald-400">{macroCount} macro-groupes</span>
            </div>
            <p className="text-[10px] text-slate-500">
              Regroupement prosodique unifié évitant la fragmentation
            </p>
          </div>

          {/* Metric 2: Important pauses */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Pauses & Cadence cible</span>
            </div>
            <div className="text-xs font-medium text-slate-300 truncate">
              Pauses naturelles 100–250 ms intégrées
            </div>
            <p className="text-[10px] text-slate-500">
              Marge d’attaque 100 ms • Fin 160 ms
            </p>
          </div>

          {/* Metric 3: Key emphasized tokens */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>Accentuation subtile</span>
            </div>
            <div className="text-xs font-medium text-purple-300 truncate font-arabic">
              {keyTokens.length > 0 ? keyTokens.map((t) => `« ${t} »`).join(' • ') : 'Accentuation naturelle'}
            </div>
            <p className="text-[10px] text-slate-500">
              Légère impulsion sans altération de tessiture
            </p>
          </div>
        </div>
      )}

      {/* Progression Ribbon */}
      {macroGroups.length > 0 && (
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>Progression émotionnelle continue (3 macro-groupes)</span>
            </span>
            <span className="text-[10px] text-emerald-400/90 font-normal">
              Continuité vocale sans rupture
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {macroGroups.map((g, idx) => (
              <React.Fragment key={g.groupId}>
                <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-[11px] text-slate-200 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] text-slate-400 flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  <span className="font-medium capitalize">{g.roleSummary}</span>
                </div>
                {idx < macroGroups.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

