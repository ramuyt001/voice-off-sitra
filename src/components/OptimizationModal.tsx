import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';
import { ScriptOptimizationResult } from '../types.ts';

interface OptimizationModalProps {
  isOpen: boolean;
  originalText: string;
  result: ScriptOptimizationResult | null;
  onAccept?: (optimizedText: string) => void;
  onApply?: (optimizedText: string) => void;
  onReject?: () => void;
  onClose?: () => void;
  targetDuration?: number;
}

export const OptimizationModal: React.FC<OptimizationModalProps> = ({
  isOpen,
  originalText,
  result,
  onAccept,
  onApply,
  onReject,
  onClose,
  targetDuration,
}) => {
  if (!isOpen || !result) return null;

  const handleClose = () => {
    if (onClose) onClose();
    else if (onReject) onReject();
  };

  const handleApply = (text: string) => {
    if (onApply) onApply(text);
    else if (onAccept) onAccept(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Proposition d’optimisation publicitaire
                {result.usedLocalFallback && (
                  <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    Mode local de secours
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Ajusté pour {targetDuration}s {result.usedLocalFallback ? '• Relais sémantique local (quota IA atteint)' : 'par Gemini 3.8 Flash'} • Aucune modification d’offre commerciale
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Fermer"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-sm">
          {/* Comparison Cards: Original vs Proposed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original Text */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  Votre texte original :
                </span>
                <p
                  dir="auto"
                  className="text-slate-300 font-sans text-sm sm:text-base leading-relaxed whitespace-pre-wrap select-text"
                >
                  {originalText}
                </p>
              </div>
              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
                Longueur : {originalText.length} caractères
              </div>
            </div>

            {/* Proposed Optimized Text */}
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/40 flex flex-col justify-between space-y-3 ring-1 ring-purple-500/20">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-purple-300">
                    Texte optimisé proposé :
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-purple-900/60 text-purple-200">
                    ~{result.estimatedDurationSeconds}s
                  </span>
                </div>
                <p
                  dir="auto"
                  className="text-white font-sans text-sm sm:text-base leading-relaxed whitespace-pre-wrap select-text font-medium"
                >
                  {result.optimizedText}
                </p>
              </div>
              <div className="text-[11px] text-purple-300/80 pt-2 border-t border-purple-900/40">
                Longueur : {result.optimizedText.length} caractères • Fluidité orale Meta
              </div>
            </div>
          </div>

          {/* Important Changes Summary */}
          <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1.5">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Changements importants et rythme oral :
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              {result.changesSummary}
            </p>
          </div>

          {/* Preserved commercial facts */}
          {result.preservedFacts.length > 0 && (
            <div className="p-3.5 rounded-xl bg-emerald-950/15 border border-emerald-900/30 space-y-2">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Faits commerciaux scrupuleusement préservés :
              </span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-emerald-200/90">
                {result.preservedFacts.map((fact, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings if any */}
          {result.warnings && result.warnings.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/40 space-y-1.5">
              <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Remarques & Avertissements :
              </span>
              <ul className="space-y-1 text-xs text-amber-200/90">
                {result.warnings.map((w, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5"
          >
            <X className="w-4 h-4" />
            <span>Garder mon texte</span>
          </button>
          <button
            type="button"
            onClick={() => handleApply(result.optimizedText)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-purple-950/50 transition-all flex items-center justify-center gap-2 ring-1 ring-purple-400/40"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Accepter la version optimisée</span>
          </button>
        </div>
      </div>
    </div>
  );
};
