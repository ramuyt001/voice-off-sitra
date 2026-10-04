import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { DURATION_CONFIGS } from '../config/pricing.ts';
import { TargetDuration } from '../types.ts';

interface DurationSelectorProps {
  selectedDuration: TargetDuration;
  onSelectDuration: (duration: TargetDuration) => void;
  wordCount: number;
  estimatedDuration: number;
}

export const DurationSelector: React.FC<DurationSelectorProps> = ({
  selectedDuration,
  onSelectDuration,
  wordCount,
  estimatedDuration,
}) => {
  const currentConfig = DURATION_CONFIGS[selectedDuration];
  const durations: TargetDuration[] = [10, 15, 20, 30];

  // Duration status calculation
  let status: 'adapted' | 'too_long' | 'too_short' = 'adapted';
  let statusMessage = 'Longueur de texte parfaitement adaptée à la durée cible.';

  if (wordCount === 0) {
    status = 'adapted';
    statusMessage = `Recommandation pour ${selectedDuration}s : environ ${currentConfig.minWords} à ${currentConfig.maxWords} mots.`;
  } else if (wordCount < currentConfig.minWords) {
    status = 'too_short';
    statusMessage = `Texte probablement un peu court (${wordCount} mots sur ${currentConfig.minWords}-${currentConfig.maxWords} recommandés).`;
  } else if (wordCount > currentConfig.maxWords) {
    status = 'too_long';
    statusMessage = `Texte probablement trop long (${wordCount} mots, risque de dépassement de ${selectedDuration}s).`;
  } else {
    status = 'adapted';
    statusMessage = `Idéal : ${wordCount} mots (recommandé : ${currentConfig.minWords} à ${currentConfig.maxWords} mots).`;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 text-xs flex items-center justify-center font-bold">
            2
          </span>
          Choisir la durée cible
        </label>
        <span className="text-xs text-slate-400">
          Format publicitaire Meta (15s par défaut)
        </span>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {durations.map((sec) => {
          const isSelected = selectedDuration === sec;
          const conf = DURATION_CONFIGS[sec];
          return (
            <button
              key={sec}
              type="button"
              onClick={() => onSelectDuration(sec)}
              className={`p-3 rounded-xl border text-center transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-purple-500/40 ${
                isSelected
                  ? 'bg-purple-900/30 border-purple-500 text-white shadow-md shadow-purple-950/40 ring-1 ring-purple-500/50'
                  : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:bg-slate-900/70 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 font-bold text-base">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>{sec}s</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                ~ {conf.minWords}-{conf.maxWords} mots
              </div>
            </button>
          );
        })}
      </div>

      {/* Real-time word count & duration feedback indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 text-xs">
        <div className="flex items-center gap-4 text-slate-300">
          <div>
            <span className="text-slate-400">Mots : </span>
            <span className="font-semibold text-white">{wordCount}</span>
          </div>
          <div className="text-slate-600">|</div>
          <div>
            <span className="text-slate-400">Durée estimée : </span>
            <span className="font-semibold text-purple-300">
              ~{estimatedDuration}s
            </span>
          </div>
          <div className="text-slate-600">|</div>
          <div>
            <span className="text-slate-400">Cible : </span>
            <span className="font-semibold text-slate-200">{selectedDuration}s</span>
          </div>
        </div>

        {/* Indicator badge: Green if adapted, Orange if too long, Blue if too short */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium text-xs ${
            status === 'adapted'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : status === 'too_long'
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              : 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
          }`}
        >
          {status === 'adapted' ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : status === 'too_long' ? (
            <AlertTriangle className="w-3.5 h-3.5" />
          ) : (
            <Info className="w-3.5 h-3.5" />
          )}
          <span>{statusMessage}</span>
        </div>
      </div>
    </div>
  );
};
