import React from 'react';
import { MessageSquareHeart, Sparkles, Flame, Check } from 'lucide-react';
import { READING_MODES } from '../config/pricing.ts';
import { ReadingModeId } from '../types.ts';

interface ModeSelectorProps {
  selectedMode: ReadingModeId;
  onSelectMode: (mode: ReadingModeId) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  selectedMode,
  onSelectMode,
}) => {
  const getIcon = (id: ReadingModeId) => {
    switch (id) {
      case 'ugc':
        return <MessageSquareHeart className="w-5 h-5 text-fuchsia-400" />;
      case 'elegant':
        return <Sparkles className="w-5 h-5 text-purple-400" />;
      case 'promo':
        return <Flame className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 text-xs flex items-center justify-center font-bold">
            1
          </span>
          Choisir le mode de lecture
        </label>
        <span className="text-xs text-slate-400">
          Même voix féminine algérienne, intention adaptée
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {READING_MODES.map((mode) => {
          const isSelected = selectedMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onSelectMode(mode.id)}
              className={`relative text-left p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between group focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                isSelected
                  ? 'bg-slate-900/90 border-purple-500 shadow-lg shadow-purple-950/40 ring-1 ring-purple-500/40'
                  : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/70 hover:border-slate-700'
              }`}
            >
              {/* Badge & Icon */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2 rounded-lg transition-colors ${
                      isSelected ? 'bg-purple-500/20' : 'bg-slate-800/80'
                    }`}
                  >
                    {getIcon(mode.id)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-slate-100">
                      {mode.name}
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      {mode.tagline}
                    </span>
                  </div>
                </div>

                {isSelected ? (
                  <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center shadow">
                    <Check className="w-3 h-3 text-white stroke-[3]" />
                  </div>
                ) : (
                  <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {mode.badge}
                  </span>
                )}
              </div>

              {/* Display description requested by user */}
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                « {mode.displayDescription} »
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
