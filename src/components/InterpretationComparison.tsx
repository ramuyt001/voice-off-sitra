import React, { useState, useRef } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Download,
  Sparkles,
  Volume2,
  FileAudio,
  AlertTriangle,
  HardDrive,
  Clock,
  Layers,
  Check,
  Activity,
  ShieldCheck,
} from 'lucide-react';
import { AudioGenerationResult, ComparisonResult } from '../types.ts';

interface InterpretationComparisonProps {
  comparisonData: ComparisonResult | null;
  onGenerateStandard: (compareMode?: 'standard' | 'compilers') => void;
  onGenerateDirected: () => void;
  onGenerateBoth: (compareMode?: 'standard' | 'compilers') => void;
  isGeneratingStandard: boolean;
  isGeneratingDirected: boolean;
  isGeneratingBoth: boolean;
  hasScript: boolean;
}

export const InterpretationComparison: React.FC<InterpretationComparisonProps> = ({
  comparisonData,
  onGenerateStandard,
  onGenerateDirected,
  onGenerateBoth,
  isGeneratingStandard,
  isGeneratingDirected,
  isGeneratingBoth,
  hasScript,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmBoth, setShowConfirmBoth] = useState(false);
  const [comparisonMode, setComparisonMode] = useState<'standard' | 'compilers'>('compilers');

  // Audio players state
  const [playingStandard, setPlayingStandard] = useState(false);
  const [playingDirected, setPlayingDirected] = useState(false);
  const audioStandardRef = useRef<HTMLAudioElement>(null);
  const audioDirectedRef = useRef<HTMLAudioElement>(null);

  const toggleStandard = () => {
    if (!audioStandardRef.current) return;
    if (playingStandard) {
      audioStandardRef.current.pause();
    } else {
      if (audioDirectedRef.current && playingDirected) {
        audioDirectedRef.current.pause();
      }
      audioStandardRef.current.play().catch(console.error);
    }
  };

  const toggleDirected = () => {
    if (!audioDirectedRef.current) return;
    if (playingDirected) {
      audioDirectedRef.current.pause();
    } else {
      if (audioStandardRef.current && playingStandard) {
        audioStandardRef.current.pause();
      }
      audioDirectedRef.current.play().catch(console.error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
  };

  const renderSilenceBreakdown = (silences?: Array<{ start: number; end: number; duration: number }>) => {
    if (!silences || silences.length === 0) {
      return (
        <span className="text-[11px] text-slate-400">
          Silences fluides naturels (&lt; 250ms)
        </span>
      );
    }

    const largeSilences = silences.filter((s) => s.duration >= 0.45);
    const naturalSilences = silences.filter((s) => s.duration < 0.45 && s.duration >= 0.1);

    return (
      <div className="space-y-1 text-[11px]">
        <div className="flex items-center justify-between text-slate-300">
          <span>Pauses naturelles (100–320ms) :</span>
          <strong className="text-emerald-400">{naturalSilences.length}</strong>
        </div>
        <div className="flex items-center justify-between text-slate-300">
          <span>Silences longs (&gt;450ms) :</span>
          <strong className={largeSilences.length > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
            {largeSilences.length}
          </strong>
        </div>
        {largeSilences.length > 0 && (
          <div className="text-[10px] text-amber-300/90 pt-0.5">
            Durées longues : {largeSilences.map((s) => `${s.duration.toFixed(2)}s`).join(', ')}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
              Test d’interprétation & Calibration de continuité (Comparaison A/B)
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                WAV brut & MP3
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Mesurez l'impact des silences internes et la fluidité entre l'ancien multi-part et le nouveau compilateur continu
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <span>{isOpen ? 'Masquer' : 'Afficher'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Body */}
      {isOpen && (
        <div className="p-4 sm:p-6 pt-1 border-t border-slate-800/80 space-y-5">
          {/* Comparison Mode Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white">Mode de comparaison :</span>
              <p className="text-[11px] text-slate-400">
                {comparisonMode === 'compilers'
                  ? 'Compare l’ancien découpage saccadé (6 parts TTS avec silences de 600-1000ms) au nouveau flux continu (150-250ms).'
                  : 'Compare la lecture neutre standard à la version dirigée émotionnellement.'}
              </p>
            </div>

            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-900 border border-slate-800">
              <button
                type="button"
                onClick={() => setComparisonMode('compilers')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  comparisonMode === 'compilers'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Ancien vs Nouveau compilateur
              </button>
              <button
                type="button"
                onClick={() => setComparisonMode('standard')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  comparisonMode === 'standard'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Standard vs Dirigé
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-400 max-w-xl">
              Même voix féminine algéroise (<code>Voice Off DZ Original</code>), même identité vocale, même normalisation audio.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              {/* Generate standard / A */}
              <button
                type="button"
                onClick={() => onGenerateStandard(comparisonMode)}
                disabled={!hasScript || isGeneratingStandard || isGeneratingBoth}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
              >
                {isGeneratingStandard ? 'Génération…' : comparisonMode === 'compilers' ? 'Générer version A (Ancien)' : 'Générer standard'}
              </button>

              {/* Generate directed / B */}
              <button
                type="button"
                onClick={onGenerateDirected}
                disabled={!hasScript || isGeneratingDirected || isGeneratingBoth}
                className="px-3 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white text-xs font-medium transition-colors shadow-sm"
              >
                {isGeneratingDirected ? 'Génération…' : comparisonMode === 'compilers' ? 'Générer version B (Continu)' : 'Générer avec direction'}
              </button>

              {/* Generate both (A/B Test) */}
              <button
                type="button"
                onClick={() => setShowConfirmBoth(true)}
                disabled={!hasScript || isGeneratingBoth || isGeneratingStandard || isGeneratingDirected}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md shadow-indigo-950/40 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGeneratingBoth ? 'Test A/B en cours…' : 'Lancer le comparatif A/B'}</span>
              </button>
            </div>
          </div>

          {/* Dual Players Comparison Display */}
          {comparisonData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Hidden HTML5 audio elements */}
              <audio
                ref={audioStandardRef}
                src={comparisonData.standard.audioBlobUrl}
                onPlay={() => setPlayingStandard(true)}
                onPause={() => setPlayingStandard(false)}
                onEnded={() => setPlayingStandard(false)}
              />
              <audio
                ref={audioDirectedRef}
                src={comparisonData.directed.audioBlobUrl}
                onPlay={() => setPlayingDirected(true)}
                onPause={() => setPlayingDirected(false)}
                onEnded={() => setPlayingDirected(false)}
              />

              {/* 1. Version A */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-slate-500" />
                      <h4 className="font-bold text-sm text-white">
                        {comparisonMode === 'compilers' ? 'Version A : Compilateur précédent (Multi-part)' : 'Version Standard (Sans direction)'}
                      </h4>
                    </div>
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {comparisonMode === 'compilers' ? '6 Parts TTS' : 'Ton général'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    {comparisonMode === 'compilers'
                      ? 'Chaque micro-segment forme une part séparée, créant des ruptures et de longs silences de 600 à 1 000 ms.'
                      : `Interprétation uniforme basée uniquement sur le mode ${comparisonData.standard.mode.toUpperCase()}.`}
                  </p>

                  {/* Player control */}
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      aria-label={playingStandard ? 'Pause' : 'Écouter'}
                      onClick={toggleStandard}
                      className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center shrink-0 shadow"
                    >
                      {playingStandard ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>
                    <div className="flex-1 text-xs">
                      <div className="font-semibold text-white">
                        Durée : {comparisonData.standard.durationSeconds.toFixed(2)}s
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {formatFileSize(comparisonData.standard.fileSizeBytes)} • MP3 192k
                      </div>
                    </div>
                  </div>

                  {/* Silence Analysis Card */}
                  <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Audit des silences internes
                    </span>
                    {renderSilenceBreakdown(comparisonData.standard.detectedSilences)}
                  </div>
                </div>

                {/* Downloads: MP3 & Raw WAV */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500">Télécharger :</span>
                  <div className="flex items-center gap-2">
                    <a
                      href={comparisonData.standard.audioBlobUrl}
                      download={`VersionA_${comparisonData.standard.fileName}`}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      <span>MP3 final</span>
                    </a>
                    {comparisonData.standard.wavBlobUrl && (
                      <a
                        href={comparisonData.standard.wavBlobUrl}
                        download={`RawWAV_VersionA_${comparisonData.standard.fileName.replace('.mp3', '.wav')}`}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        <span>WAV brut</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Version B */}
              <div className="p-4 sm:p-5 rounded-2xl bg-purple-950/20 border border-purple-500/40 space-y-4 flex flex-col justify-between ring-1 ring-purple-500/20">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                      <h4 className="font-bold text-sm text-white">
                        {comparisonMode === 'compilers' ? 'Version B : Nouveau Compilateur de Continuité' : 'Version avec direction émotionnelle'}
                      </h4>
                    </div>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                      Flux continu
                    </span>
                  </div>

                  <p className="text-xs text-purple-200/90">
                    Synthèse continue avec macro-groupes prosodiques et pauses humaines calibrées (150-250ms).
                  </p>

                  {/* Player control */}
                  <div className="p-3 rounded-xl bg-slate-950/90 border border-purple-500/30 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      aria-label={playingDirected ? 'Pause' : 'Écouter'}
                      onClick={toggleDirected}
                      className="w-10 h-10 rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-purple-950/50"
                    >
                      {playingDirected ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>
                    <div className="flex-1 text-xs">
                      <div className="font-semibold text-white">
                        Durée : {comparisonData.directed.durationSeconds.toFixed(2)}s
                      </div>
                      <div className="text-[11px] text-purple-300/80">
                        {formatFileSize(comparisonData.directed.fileSizeBytes)} • MP3 192k normalisé
                      </div>
                    </div>
                  </div>

                  {/* Silence Analysis Card */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                      Audit des silences internes
                    </span>
                    {renderSilenceBreakdown(comparisonData.directed.detectedSilences)}
                  </div>
                </div>

                {/* Downloads: MP3 & Raw WAV */}
                <div className="pt-2 border-t border-purple-900/40 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-purple-300/70">Télécharger :</span>
                  <div className="flex items-center gap-2">
                    <a
                      href={comparisonData.directed.audioBlobUrl}
                      download={`VersionB_Continu_${comparisonData.directed.fileName}`}
                      className="px-2.5 py-1.5 rounded-lg bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/30 text-purple-200 text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      <span>MP3 final</span>
                    </a>
                    {comparisonData.directed.wavBlobUrl && (
                      <a
                        href={comparisonData.directed.wavBlobUrl}
                        download={`RawWAV_VersionB_${comparisonData.directed.fileName.replace('.mp3', '.wav')}`}
                        className="px-2.5 py-1.5 rounded-lg bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/30 text-purple-200 text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        <span>WAV brut</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-xl border border-dashed border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
                <Volume2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">
                  Prêt pour le test comparatif
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Cliquez sur « Lancer le comparatif A/B » pour générer les deux versions avec analyse des silences et des WAV.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal before A/B Test */}
      {showConfirmBoth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="max-w-md w-full rounded-2xl border border-indigo-500/40 bg-slate-900 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-indigo-400">
              <Sparkles className="w-5 h-5 shrink-0" />
              <h4 className="font-bold text-sm text-white">
                Confirmer la double génération A/B ?
              </h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ce test génère deux fichiers audio distincts avec la voix <code>Voice Off DZ Original</code>. Cela réalisera deux synthèses consécutives pour comparer objectivement les silences et les timbres.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmBoth(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmBoth(false);
                  onGenerateBoth(comparisonMode);
                }}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
              >
                Confirmer & Générer (A/B)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
