import React from 'react';
import { Volume2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { VoiceStatus } from '../types.ts';

interface HeaderProps {
  voiceStatus: VoiceStatus | null;
  isLoadingVoice: boolean;
  monthlySpentEur: number;
  monthlyBudgetEur: number;
  onBudgetChange: (budget: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  voiceStatus,
  isLoadingVoice,
  monthlySpentEur,
  monthlyBudgetEur,
  onBudgetChange,
}) => {
  const budgetPercentage = Math.min(100, (monthlySpentEur / monthlyBudgetEur) * 100);

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-900/30 ring-1 ring-purple-400/30">
            <Volume2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Voice Off
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  DZ Fashion
                </span>
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Créez une voix off algérienne naturelle pour vos publicités
            </p>
          </div>
        </div>

        {/* Right Info: Voice status & budget indicator */}
        <div className="flex items-center flex-wrap gap-2.5 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Voice status pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
            {isLoadingVoice ? (
              <>
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="text-slate-400">Connexion voix...</span>
              </>
            ) : voiceStatus?.ready ? (
              <>
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </div>
                <span className="text-emerald-400 font-medium">Voix prête</span>
                <span className="text-slate-500 text-[11px] hidden md:inline">
                  (Voice Off DZ Original)
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-rose-400">Voix hors ligne</span>
              </>
            )}
          </div>

          {/* Quick budget snapshot */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs">
            <span className="text-slate-400">Budget mois :</span>
            <span className="font-semibold text-purple-300">
              {monthlySpentEur.toFixed(3)} €
            </span>
            <span className="text-slate-500">/</span>
            <select
              aria-label="Budget mensuel"
              value={monthlyBudgetEur}
              onChange={(e) => onBudgetChange(Number(e.target.value))}
              className="bg-transparent text-slate-200 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-purple-500 rounded text-xs"
            >
              <option value={10} className="bg-slate-900 text-slate-200">10 €</option>
              <option value={15} className="bg-slate-900 text-slate-200">15 €</option>
              <option value={20} className="bg-slate-900 text-slate-200">20 €</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
