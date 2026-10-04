import React from 'react';
import { Coins, HelpCircle, TrendingUp, Info } from 'lucide-react';
import { estimateCost, getCurrentRates } from '../config/pricing.ts';

interface CostAndBudgetProps {
  script: string;
  durationSeconds: number;
  monthlySpentEur: number;
  monthlyBudgetEur: number;
  onBudgetChange: (budget: number) => void;
}

export const CostAndBudget: React.FC<CostAndBudgetProps> = ({
  script,
  durationSeconds,
  monthlySpentEur,
  monthlyBudgetEur,
  onBudgetChange,
}) => {
  const cost = estimateCost(script, durationSeconds);
  const budgetRatio = Math.min(100, (monthlySpentEur / monthlyBudgetEur) * 100);
  const rates = getCurrentRates();

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 text-xs flex items-center justify-center font-bold">
            5
          </span>
          <span className="font-semibold text-sm text-slate-200">
            Coût approximatif de cette génération
          </span>
        </div>

        {/* Local disclaimer tag */}
        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
          Estimation basée sur les tarifs Gemini 3.8 Flash TTS
        </span>
      </div>

      {/* Main Cost Display */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Estimated Price this generation */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <span className="text-xs text-slate-400 block">
            Estimation génération ({durationSeconds}s) :
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-extrabold text-purple-300">
              ~{cost.totalEur < 0.001 ? '< 0,001' : cost.totalEur.toFixed(4)} €
            </span>
            <span className="text-xs text-slate-500">
              (~{cost.totalUsd.toFixed(4)} $)
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block">
            Taux indicatif : 1 $ = {rates.usdToEur} €
          </span>
        </div>

        {/* Monthly budget tracking */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 sm:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
              Consommation estimée ce mois-ci :
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">
                {monthlySpentEur.toFixed(3)} €
              </span>
              <span className="text-xs text-slate-500">/</span>
              <select
                aria-label="Sélectionner le budget mensuel"
                value={monthlyBudgetEur}
                onChange={(e) => onBudgetChange(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-xs text-slate-200 px-2 py-0.5 rounded font-medium focus:outline-none focus:border-purple-500"
              >
                <option value={10}>10 €</option>
                <option value={15}>15 € (défaut)</option>
                <option value={20}>20 €</option>
              </select>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  budgetRatio > 90
                    ? 'bg-rose-500'
                    : budgetRatio > 70
                    ? 'bg-amber-500'
                    : 'bg-gradient-to-r from-purple-500 to-fuchsia-500'
                }`}
                style={{ width: `${budgetRatio}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>{budgetRatio.toFixed(1)}% du plafond mensuel</span>
              <span>Reste : ~{Math.max(0, monthlyBudgetEur - monthlySpentEur).toFixed(3)} €</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transparent Disclaimer */}
      <p className="text-[11px] text-slate-400/90 leading-relaxed flex items-start gap-1.5 pt-1">
        <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
        <span>
          Le coût réel facturé par Google peut être nul si vous bénéficiez du quota gratuit ou varier selon les conditions de facturation de Google Cloud. Ce montant est fourni à titre purement indicatif.
        </span>
      </p>
    </div>
  );
};
