import React from 'react';
import { UserCheck, Sparkles, Check, AlertCircle, Loader2, Bot, ShoppingBag } from 'lucide-react';
import { VoiceProfileId, VoiceStatus } from '../types.ts';

interface ProfileSelectorProps {
  selectedProfile: VoiceProfileId;
  onSelectProfile: (profile: VoiceProfileId) => void;
  voiceStatus: VoiceStatus | null;
  isLoadingVoice: boolean;
  isCreatingMaleVoice: boolean;
  onCreateMaleVoice: () => Promise<void>;
}

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({
  selectedProfile,
  onSelectProfile,
  voiceStatus,
  isLoadingVoice,
  isCreatingMaleVoice,
  onCreateMaleVoice,
}) => {
  const isMale = selectedProfile === 'male';
  const isMaleReady = voiceStatus?.profile === 'male' ? voiceStatus.ready : false;

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 text-xs flex items-center justify-center font-bold">
            0
          </span>
          Profil vocal & Identité
        </label>
        <span className="text-xs text-slate-400">
          Deux voix originales indépendantes avec réglages dédiés
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Choice 1: Voix féminine — Boutique */}
        <button
          type="button"
          onClick={() => onSelectProfile('female')}
          className={`relative text-left p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between group focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
            selectedProfile === 'female'
              ? 'bg-slate-900/90 border-purple-500 shadow-xl shadow-purple-950/40 ring-1 ring-purple-500/40'
              : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/70 hover:border-slate-700'
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  selectedProfile === 'female'
                    ? 'bg-gradient-to-tr from-purple-600 to-fuchsia-500 text-white shadow-md shadow-purple-900/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-1.5">
                  Voix féminine — Boutique
                </h3>
                <p className="text-[11px] text-purple-300/90 font-medium">
                  Voice Off DZ Original
                </p>
              </div>
            </div>

            {selectedProfile === 'female' ? (
              <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center shadow">
                <Check className="w-3 h-3 text-white stroke-[3]" />
              </div>
            ) : (
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                Mode & Vente
              </span>
            )}
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mt-1">
            Vendeuse mode & e-commerce féminin algérien (30–50 ans). Cadence chaleureuse, élégante ou promo.
          </p>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              Identifiant immuable
            </span>
            <code className="text-purple-300 font-mono text-[10px] bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-800/40">
              voice_yn4478n2nv1d
            </code>
          </div>
        </button>

        {/* Choice 2: Voix masculine — Créateur IA */}
        <button
          type="button"
          onClick={() => onSelectProfile('male')}
          className={`relative text-left p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between group focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${
            selectedProfile === 'male'
              ? 'bg-slate-900/90 border-cyan-500 shadow-xl shadow-cyan-950/40 ring-1 ring-cyan-500/40'
              : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/70 hover:border-slate-700'
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  selectedProfile === 'male'
                    ? 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-1.5">
                  Voix masculine — Créateur IA
                </h3>
                <p className="text-[11px] text-cyan-300/90 font-medium">
                  Voice Off DZ Creator Male
                </p>
              </div>
            </div>

            {selectedProfile === 'male' ? (
              <div className="w-5 h-5 rounded-full bg-cyan-600 flex items-center justify-center shadow">
                <Check className="w-3 h-3 text-white stroke-[3]" />
              </div>
            ) : (
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                TikTok & IA
              </span>
            )}
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mt-1">
            Créateur TikTok/Reels pour petits vendeurs algériens (15–25 ans). Conseil amical, outils IA et workflows concrets.
          </p>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1.5">
              {isMaleReady ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  Prête
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                  À initialiser
                </>
              )}
            </span>
            {isMaleReady && voiceStatus?.voiceId ? (
              <code className="text-cyan-300 font-mono text-[10px] bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-800/40 truncate max-w-[140px]">
                {voiceStatus.voiceId}
              </code>
            ) : (
              <span className="text-amber-400 font-medium text-[10px]">
                Bouton explicite requis
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Explicit Creation Banner for Male Voice when uncreated */}
      {isMale && !isMaleReady && !isLoadingVoice && (
        <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-cyan-200">
                Créer l’identité « Voice Off DZ Creator Male »
              </h4>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                Conformément à vos consignes, aucune voix n'est créée automatiquement. Cliquez ci-dessous pour concevoir la voix masculine via Gemini Voice Design (stockée de manière permanente avec <code className="text-cyan-300">store: true</code>).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCreateMaleVoice}
            disabled={isCreatingMaleVoice}
            className="w-full sm:w-auto shrink-0 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 border border-cyan-400/40 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isCreatingMaleVoice ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Création en cours...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Créer ma voix masculine</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
