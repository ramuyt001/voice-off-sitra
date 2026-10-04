import React, { useState } from 'react';
import {
  Sparkles,
  Sliders,
  Plus,
  Trash2,
  Lock,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Zap,
  Edit3,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Eye,
  ChevronDown,
  ChevronUp,
  Layers,
  Activity,
  Link2,
} from 'lucide-react';
import { EmotionalDirection, MacroGroup } from '../types.ts';

interface EmotionalDirectionSectionProps {
  script: string;
  directions: EmotionalDirection[];
  macroGroups: MacroGroup[];
  selectedSnippet: string;
  selectedRange: { startIndex: number; endIndex: number } | null;
  onOpenAddModal: () => void;
  onEditDirection: (dir: EmotionalDirection) => void;
  onDeleteDirection: (id: string) => void;
  onConvertToManual: (dir: EmotionalDirection) => void;
  onAnalyzeScript: () => void;
  isAnalyzing: boolean;
  useAutoSuggestions: boolean;
  onToggleUseAuto: (val: boolean) => void;
  onClearAutoSuggestions: () => void;
  onResetAllDirections: () => void;
}

export const EmotionalDirectionSection: React.FC<EmotionalDirectionSectionProps> = ({
  script,
  directions,
  macroGroups,
  selectedSnippet,
  selectedRange,
  onOpenAddModal,
  onEditDirection,
  onDeleteDirection,
  onConvertToManual,
  onAnalyzeScript,
  isAnalyzing,
  useAutoSuggestions,
  onToggleUseAuto,
  onClearAutoSuggestions,
  onResetAllDirections,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showAnnotatedPreview, setShowAnnotatedPreview] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  const validDirections = directions.filter(
    (d) => d.isValid && d.status !== 'invalid' && d.status !== 'archived'
  );
  const invalidOrArchivedDirections = directions.filter(
    (d) => !d.isValid || d.status === 'invalid' || d.status === 'archived'
  );

  const manualCount = validDirections.filter((d) => d.source === 'manual').length;
  const autoCount = validDirections.filter((d) => d.source === 'automatic').length;
  const oldDirectionsCount = invalidOrArchivedDirections.length;

  const handleResetClick = () => {
    if (manualCount > 0) {
      setShowConfirmReset(true);
    } else {
      onResetAllDirections();
    }
  };

  const getPaceLabel = (pace: string) => {
    switch (pace) {
      case 'slow':
        return 'Ralenti';
      case 'measured':
        return 'Posé';
      case 'lively':
        return 'Vivant (~195 wpm)';
      case 'fast':
        return 'Accéléré';
      default:
        return 'Naturel';
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden transition-all">
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-300 text-xs flex items-center justify-center font-bold border border-purple-500/30">
            4
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Réglages avancés (Direction émotionnelle)
              </h2>
              {manualCount > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {manualCount} manuelle{manualCount > 1 ? 's' : ''} active{manualCount > 1 ? 's' : ''}
                </span>
              )}
              {autoCount > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {autoCount} auto
                </span>
              )}
              {macroGroups.length > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {macroGroups.length} macro-groupes TTS
                </span>
              )}
              {oldDirectionsCount > 0 && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {oldDirectionsCount} d’un ancien texte
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Laissez l’analyse automatique préparer l’interprétation, ou personnalisez les passages importants.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <span>{isOpen ? 'Replier' : 'Déplier les réglages'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="p-4 sm:p-6 pt-2 border-t border-slate-800/80 space-y-5">
          {/* Main Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Analyze Script button */}
              <button
                type="button"
                onClick={onAnalyzeScript}
                disabled={!script.trim() || isAnalyzing}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-sky-950/40 transition-all focus:outline-none"
              >
                {isAnalyzing ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyse du script en cours…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Analyser le script</span>
                  </>
                )}
              </button>

              {/* Add Direction Button (Active if text selected) */}
              <div className="relative group">
                <button
                  type="button"
                  onClick={onOpenAddModal}
                  disabled={!selectedSnippet.trim()}
                  className={`px-3.5 py-2 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all focus:outline-none ${
                    selectedSnippet.trim()
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-950/40 ring-1 ring-purple-400/40 cursor-pointer animate-pulse'
                      : 'bg-slate-800/80 text-slate-500 border border-slate-700/60 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter une direction</span>
                </button>
                {!selectedSnippet.trim() && (
                  <div className="hidden group-hover:block absolute left-0 top-full mt-1.5 z-20 px-2.5 py-1 rounded bg-slate-950 text-[11px] text-slate-300 border border-slate-800 whitespace-nowrap shadow-lg">
                    Sélectionnez d’abord un passage dans le script ci-dessus.
                  </div>
                )}
              </div>

              {/* Toggle Auto Suggestions */}
              <button
                type="button"
                onClick={() => onToggleUseAuto(!useAutoSuggestions)}
                className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  useAutoSuggestions
                    ? 'bg-sky-950/40 border-sky-500/40 text-sky-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                {useAutoSuggestions ? (
                  <ToggleRight className="w-4 h-4 text-sky-400" />
                ) : (
                  <ToggleLeft className="w-4 h-4 text-slate-500" />
                )}
                <span>Suggestions auto {useAutoSuggestions ? 'activées' : 'désactivées'}</span>
              </button>
            </div>

            {/* Secondary controls */}
            <div className="flex items-center gap-2">
              {autoCount > 0 && (
                <button
                  type="button"
                  onClick={onClearAutoSuggestions}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors"
                >
                  Effacer auto
                </button>
              )}

              {directions.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetClick}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-rose-400 hover:text-rose-300 text-xs transition-colors"
                >
                  Tout réinitialiser
                </button>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs">
            <span className="text-slate-400 text-[11px] font-semibold">Légende :</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-purple-500 border border-purple-400 shadow-sm shadow-purple-500/40" />
              <span className="text-purple-300 font-medium text-[11px]">Violet : Direction manuelle (prioritaire)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-sky-500 border border-sky-400" />
              <span className="text-sky-300 font-medium text-[11px]">Bleu : Suggestion automatique</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-600" />
              <span className="text-slate-400 text-[11px]">Gris : Ton général</span>
            </div>
            {oldDirectionsCount > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-amber-300 font-medium text-[11px]">Orange : Invalide après modification du texte</span>
              </div>
            )}
          </div>

          {/* Macro-groups TTS Architecture Preview */}
          {macroGroups.length > 0 && (
            <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Macro-groupes prosodiques envoyés au modèle TTS ({macroGroups.length})</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  Fusion sémantique des micro-segments
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {macroGroups.map((mg, i) => (
                  <div
                    key={mg.groupId}
                    className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] flex items-center justify-center font-bold">
                          {i + 1}
                        </span>
                        <span>{mg.roleSummary}</span>
                      </span>
                    </div>
                    <div dir="auto" className="text-slate-300 font-arabic text-[11px] line-clamp-2">
                      « {mg.text} »
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Micro-segments cards list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <span>Directions actives pour le script actuel ({validDirections.length})</span>
              </span>
              <span className="text-[11px] font-normal text-slate-400">
                Priorité absolue : Manuel &gt; Auto &gt; Style global
              </span>
            </div>

            {validDirections.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-800 text-center space-y-2 text-slate-400">
                <Sliders className="w-6 h-6 text-slate-600 mx-auto" />
                <p className="text-xs">
                  Aucune direction active pour le script actuel. Cliquez sur « Analyser le script » pour générer les suggestions automatiques adaptées au nouveau texte.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {validDirections.map((dir) => {
                  const isManual = dir.source === 'manual';
                  const cardBorder = isManual
                    ? 'border-purple-500/40 bg-purple-950/20 shadow-sm shadow-purple-950/40'
                    : 'border-sky-500/30 bg-sky-950/20';

                  return (
                    <div
                      key={dir.id}
                      className={`p-3.5 rounded-xl border ${cardBorder} flex flex-col justify-between space-y-3 transition-all`}
                    >
                      <div className="space-y-2">
                        {/* Top badges */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                isManual
                                  ? 'bg-purple-500/30 text-purple-200 border border-purple-400/40'
                                  : 'bg-sky-500/30 text-sky-200 border border-sky-400/30'
                              }`}
                            >
                              {isManual && <Lock className="w-2.5 h-2.5" />}
                              {isManual ? 'Manuel' : 'Auto'}
                            </span>

                            {dir.role && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                                {dir.role}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {!isManual && (
                              <button
                                type="button"
                                title="Verrouiller en manuel"
                                onClick={() => onConvertToManual(dir)}
                                className="p-1 rounded text-slate-400 hover:text-purple-300 hover:bg-purple-950/40 transition-colors"
                              >
                                <Lock className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              title="Modifier"
                              onClick={() => onEditDirection(dir)}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Supprimer"
                              onClick={() => onDeleteDirection(dir.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Passage text */}
                        <div
                          dir="auto"
                          className="font-arabic text-xs font-semibold text-white leading-relaxed line-clamp-2"
                        >
                          « {dir.targetText} »
                        </div>

                        {/* Emotion & Parameters */}
                        <div className="space-y-1 text-[11px] text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">Émotion :</span>
                            <strong className="text-white">{dir.emotion}</strong>
                          </div>

                          <div className="flex items-center gap-3 text-slate-400 text-[10px]">
                            <span>Intensité : <strong className="text-slate-200">{dir.intensity}/5</strong></span>
                            <span>Rythme : <strong className="text-slate-200">{getPaceLabel(dir.pace)}</strong></span>
                            {dir.energy && (
                              <span>Énergie : <strong className="text-slate-200">{dir.energy}</strong></span>
                            )}
                          </div>

                          {/* Emphasized tokens */}
                          {dir.emphasisTokens && dir.emphasisTokens.length > 0 && (
                            <div className="flex items-center gap-1 text-[10px] text-amber-300/90 font-arabic pt-0.5">
                              <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>Accentuation : {dir.emphasisTokens.map((t) => `« ${t} »`).join(', ')}</span>
                            </div>
                          )}

                          {/* Pauses */}
                          {(dir.pauseBefore || dir.pauseAfter) && (
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-0.5">
                              <Clock className="w-3 h-3 text-sky-400 shrink-0" />
                              <span>
                                {dir.pauseBefore && dir.pauseAfter
                                  ? 'Pause courte avant et après'
                                  : dir.pauseBefore
                                  ? 'Pause courte avant'
                                  : 'Pause courte après'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Collapsed Archive Section for Old Script Directions */}
          {invalidOrArchivedDirections.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowArchived(!showArchived)}
                className="w-full py-2.5 px-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-left flex items-center justify-between text-xs text-slate-400 hover:text-slate-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Directions d’un ancien texte ({invalidOrArchivedDirections.length} archivée{invalidOrArchivedDirections.length > 1 ? 's' : ''})
                  </span>
                  <span className="text-[10px] text-slate-500 hidden sm:inline">
                    — Non actives et exclues de la synthèse du texte actuel
                  </span>
                </div>
                {showArchived ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showArchived && (
                <div className="mt-3 p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-2.5">
                  <p className="text-[11px] text-slate-400">
                    Ces directions proviennent d’un précédent script. Elles sont préservées ici pour ne pas supprimer vos réglages manuels, mais elles ne polluent pas le résumé et ne sont jamais transmises au TTS.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {invalidOrArchivedDirections.map((dir) => (
                      <div
                        key={dir.id}
                        className="p-2.5 rounded-lg border border-slate-800/80 bg-slate-900/30 text-xs space-y-1 opacity-70"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-semibold text-amber-300/80 flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                            Ancien texte
                          </span>
                          <button
                            type="button"
                            onClick={() => onDeleteDirection(dir.id)}
                            className="text-slate-500 hover:text-rose-400 transition-colors"
                            title="Supprimer cette direction archivée"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <p dir="auto" className="font-arabic text-slate-300 truncate">
                          « {dir.targetText} »
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {dir.role} • {dir.emotion}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Confirmation modal for reset if manual directions exist */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="max-w-md w-full rounded-2xl border border-rose-500/40 bg-slate-900 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h4 className="font-bold text-sm text-white">
                Confirmer la réinitialisation complète ?
              </h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Vous avez <strong className="text-purple-300">{manualCount} direction{manualCount > 1 ? 's' : ''} manuelle{manualCount > 1 ? 's' : ''} verrouillée{manualCount > 1 ? 's' : ''}</strong>. La réinitialisation supprimera définitivement vos ajustements personnalisés.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmReset(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmReset(false);
                  onResetAllDirections();
                }}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
              >
                Tout réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
