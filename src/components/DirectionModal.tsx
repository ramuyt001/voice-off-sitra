import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Sliders,
  Clock,
  Volume2,
  X,
  Check,
  Zap,
  Info,
  Lock,
  Activity,
  Link2,
} from 'lucide-react';
import {
  DirectionPace,
  DirectionPause,
  EmotionalDirection,
  PitchContour,
  SegmentCommercialRole,
  SegmentContinuity,
  VoiceEnergy,
} from '../types.ts';

interface DirectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetText: string;
  startIndex: number;
  endIndex: number;
  existingDirection?: EmotionalDirection | null;
  onSaveDirection: (direction: EmotionalDirection) => void;
}

const QUICK_EMOTIONS = [
  'Complice',
  'Curieuse',
  'Heureuse',
  'Enthousiaste',
  'Admirative',
  'Rassurante',
  'Élégante',
  'Chaleureuse',
  'Convaincue',
  'Persuasive',
  'Urgente mais naturelle',
  'Calme et premium',
];

const ROLES_LIST: Array<{ value: SegmentCommercialRole; label: string }> = [
  { value: 'hook', label: 'Accroche (Hook)' },
  { value: 'présentation_produit', label: 'Présentation produit' },
  { value: 'découverte', label: 'Découverte visuelle' },
  { value: 'caractéristique', label: 'Caractéristique (tissu/coupe)' },
  { value: 'bénéfice', label: 'Bénéfice' },
  { value: 'qualité', label: 'Qualité premium' },
  { value: 'prix', label: 'Prix & offre' },
  { value: 'personnalisation', label: 'Choix couleur / taille' },
  { value: 'livraison', label: 'Livraison' },
  { value: 'CTA', label: 'Appel à l’action (CTA)' },
  { value: 'information', label: 'Information' },
];

const INTENSITY_LABELS: Record<number, string> = {
  1: '1 : très subtile',
  2: '2 : légère',
  3: '3 : naturelle (défaut)',
  4: '4 : marquée',
  5: '5 : très expressive',
};

const PACE_OPTIONS: Array<{ value: DirectionPace; label: string }> = [
  { value: 'slow', label: 'Légèrement ralenti' },
  { value: 'measured', label: 'Posé' },
  { value: 'natural', label: 'Naturel (défaut)' },
  { value: 'lively', label: 'Vivant' },
  { value: 'fast', label: 'Légèrement accéléré' },
];

const PITCH_OPTIONS: Array<{ value: PitchContour; label: string }> = [
  { value: 'rise_then_fall', label: 'Montée puis retombée (naturel)' },
  { value: 'gentle_rise', label: 'Légère montée (curiosité/découverte)' },
  { value: 'gentle_fall', label: 'Légère descente (affirmation/posé)' },
  { value: 'reset_then_fall', label: 'Suspension puis révélation (prix)' },
  { value: 'level', label: 'Posé et stable (explication)' },
  { value: 'question_rise', label: 'Montée interrogative' },
];

const ENERGY_OPTIONS: Array<{ value: VoiceEnergy; label: string }> = [
  { value: 'soft', label: 'Douce (confort, matière)' },
  { value: 'medium', label: 'Médium (conversationnel naturel)' },
  { value: 'bright', label: 'Lumineuse (admiration, sourire)' },
  { value: 'strong', label: 'Ferme & décidée (offre, CTA)' },
];

const CONTINUITY_OPTIONS: Array<{ value: SegmentContinuity; label: string }> = [
  { value: 'connected', label: 'Lié sans rupture (enchaîné)' },
  { value: 'soft_boundary', label: 'Respiration naturelle' },
  { value: 'clear_boundary', label: 'Pause marquée (prix / grande idée)' },
];

const PAUSE_OPTIONS: Array<{ value: DirectionPause; label: string }> = [
  { value: 'none', label: 'Aucune' },
  { value: 'before', label: 'Pause courte avant' },
  { value: 'after', label: 'Pause courte après' },
  { value: 'both', label: 'Pause courte avant et après' },
];

export const DirectionModal: React.FC<DirectionModalProps> = ({
  isOpen,
  onClose,
  targetText,
  startIndex,
  endIndex,
  existingDirection,
  onSaveDirection,
}) => {
  const [role, setRole] = useState<SegmentCommercialRole>(
    existingDirection?.role || 'bénéfice'
  );
  const [emotion, setEmotion] = useState(
    existingDirection?.emotion ||
      'Complice, souriante et sincèrement impressionnée par la robe'
  );
  const [intensity, setIntensity] = useState<number>(existingDirection?.intensity || 3);
  const [pace, setPace] = useState<DirectionPace>(existingDirection?.pace || 'natural');
  const [pitchContour, setPitchContour] = useState<PitchContour>(
    existingDirection?.pitchContour || 'rise_then_fall'
  );
  const [energy, setEnergy] = useState<VoiceEnergy>(
    existingDirection?.energy || 'medium'
  );
  const [continuity, setContinuity] = useState<SegmentContinuity>(
    existingDirection?.continuity || 'connected'
  );
  const [selectedTokens, setSelectedTokens] = useState<string[]>(() => {
    if (existingDirection?.emphasisTokens && Array.isArray(existingDirection.emphasisTokens)) {
      return existingDirection.emphasisTokens;
    }
    if (existingDirection?.emphasisWords) {
      return existingDirection.emphasisWords.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  });
  const [pauseChoice, setPauseChoice] = useState<DirectionPause>(() => {
    if (existingDirection?.pauseBefore && existingDirection?.pauseAfter) return 'both';
    if (existingDirection?.pauseBefore) return 'before';
    if (existingDirection?.pauseAfter) return 'after';
    return 'none';
  });
  const [customNote, setCustomNote] = useState<string>(
    existingDirection?.customNote || ''
  );

  useEffect(() => {
    if (isOpen) {
      if (existingDirection) {
        setRole(existingDirection.role || 'bénéfice');
        setEmotion(existingDirection.emotion);
        setIntensity(existingDirection.intensity);
        setPace(existingDirection.pace);
        setPitchContour(existingDirection.pitchContour || 'rise_then_fall');
        setEnergy(existingDirection.energy || 'medium');
        setContinuity(existingDirection.continuity || 'connected');
        if (existingDirection.emphasisTokens && Array.isArray(existingDirection.emphasisTokens)) {
          setSelectedTokens(existingDirection.emphasisTokens);
        } else if (existingDirection.emphasisWords) {
          setSelectedTokens(existingDirection.emphasisWords.split(',').map((s) => s.trim()).filter(Boolean));
        } else {
          setSelectedTokens([]);
        }
        if (existingDirection.pauseBefore && existingDirection.pauseAfter) {
          setPauseChoice('both');
        } else if (existingDirection.pauseBefore) {
          setPauseChoice('before');
        } else if (existingDirection.pauseAfter) {
          setPauseChoice('after');
        } else {
          setPauseChoice('none');
        }
        setCustomNote(existingDirection.customNote || '');
      } else {
        // Auto-detect role hint
        const textLower = targetText.toLowerCase();
        let defaultRole: SegmentCommercialRole = 'bénéfice';
        if (startIndex === 0 || textLower.includes('شوفو') || textLower.includes('لبنات')) {
          defaultRole = 'hook';
        } else if (textLower.includes('3900') || textLower.includes('تلاتمية') || textLower.includes('prix')) {
          defaultRole = 'prix';
        } else if (textLower.includes('commande') || textLower.includes('lien') || textLower.includes('تكليكي')) {
          defaultRole = 'CTA';
        } else if (textLower.includes('couleur') || textLower.includes('تختاري')) {
          defaultRole = 'personnalisation';
        } else if (textLower.includes('dolce') || textLower.includes('robe')) {
          defaultRole = 'présentation_produit';
        }

        setRole(defaultRole);
        setEmotion(
          defaultRole === 'hook'
            ? 'Complice, souriante, comme si elle montrait une belle découverte à une amie'
            : defaultRole === 'prix'
            ? 'Révélation avantageuse et claire'
            : defaultRole === 'CTA'
            ? 'Décidée et souriante'
            : 'Admirative et chaleureuse'
        );
        setIntensity(defaultRole === 'hook' || defaultRole === 'prix' || defaultRole === 'CTA' ? 4 : 3);
        setPace(defaultRole === 'prix' ? 'measured' : defaultRole === 'hook' ? 'lively' : 'natural');
        setPitchContour(defaultRole === 'prix' ? 'reset_then_fall' : 'rise_then_fall');
        setEnergy(defaultRole === 'prix' || defaultRole === 'hook' ? 'bright' : 'medium');
        setContinuity(defaultRole === 'prix' ? 'clear_boundary' : 'connected');
        setSelectedTokens([]);
        setPauseChoice('none');
        setCustomNote('');
      }
    }
  }, [isOpen, existingDirection, targetText, startIndex]);

  if (!isOpen) return null;

  // Extract clickable individual words/tokens from passage
  const wordsInPassage = targetText
    .replace(/[«»"،.?!;:\-_/\\()[\]{}'"]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 1);
  const uniqueWords = Array.from(new Set(wordsInPassage));

  const handleToggleToken = (word: string) => {
    if (selectedTokens.includes(word)) {
      setSelectedTokens(selectedTokens.filter((w) => w !== word));
    } else {
      if (selectedTokens.length < 3) {
        setSelectedTokens([...selectedTokens, word]);
      }
    }
  };

  const handleSave = () => {
    const pauseBefore = pauseChoice === 'before' || pauseChoice === 'both';
    const pauseAfter = pauseChoice === 'after' || pauseChoice === 'both';

    const paceDesc =
      pace === 'slow'
        ? 'slightly slower and articulate'
        : pace === 'measured'
        ? 'calm and measured pace'
        : pace === 'lively'
        ? 'lively and spirited cadence'
        : pace === 'fast'
        ? 'brisk dynamic flow'
        : 'natural conversational rhythm';

    const intensityDesc =
      intensity === 5
        ? 'vivid and highly expressive'
        : intensity === 4
        ? 'distinctly marked feeling'
        : intensity === 2
        ? 'subtle nuanced delivery'
        : intensity === 1
        ? 'delicate understated delivery'
        : 'naturally engaged';

    let ttsStyle = `${emotion.trim()} (${intensityDesc}, ${paceDesc})`;
    if (selectedTokens.length > 0) {
      ttsStyle += `; gently emphasize "${selectedTokens.join('" and "')}"`;
    }

    const direction: EmotionalDirection = {
      id: existingDirection?.id || `manual_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      source: 'manual',
      locked: true,
      startIndex,
      endIndex,
      targetText,
      role,
      emotion: emotion.trim(),
      intention: emotion.trim(),
      intensity,
      pace,
      pitchContour,
      energy,
      continuity,
      emphasisTokens: selectedTokens,
      emphasisWords: selectedTokens.join(', '),
      pauseBeforeTargetMs: pauseBefore ? 180 : 0,
      pauseAfterTargetMs: pauseAfter ? 180 : 0,
      pauseBefore,
      pauseAfter,
      shortTtsStyle: ttsStyle,
      customNote: customNote.trim() || undefined,
      isValid: true,
    };

    onSaveDirection(direction);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl border border-purple-500/30 bg-slate-900 shadow-2xl p-5 sm:p-6 space-y-5 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Comment prononcer ce passage ?
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Verrouillé manuel
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Direction prioritaire qui ne sera jamais remplacée par l’analyse automatique.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Read-only selected passage with dir="auto" */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Passage sélectionné (lecture seule)
          </label>
          <div
            dir="auto"
            className="p-3 rounded-xl bg-slate-950/80 border border-purple-500/40 text-purple-200 text-sm font-medium leading-relaxed font-arabic"
          >
            « {targetText} »
          </div>
        </div>

        {/* Commercial Role */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <span>Rôle publicitaire du passage</span>
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as SegmentCommercialRole)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-purple-500 focus:outline-none"
          >
            {ROLES_LIST.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Emotion / Intention */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Émotion ou intention</span>
            <span className="text-[10px] text-slate-500">Champ libre</span>
          </label>
          <input
            type="text"
            value={emotion}
            onChange={(e) => setEmotion(e.target.value)}
            placeholder="Ex : Complice, souriante et sincèrement impressionnée par la robe"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:border-purple-500 focus:outline-none"
          />

          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {QUICK_EMOTIONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setEmotion(item)}
                className={`px-2 py-1 rounded-lg text-[11px] transition-all ${
                  emotion.toLowerCase().includes(item.toLowerCase())
                    ? 'bg-purple-600 text-white font-medium'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* 2-Column Grid: Intensity & Rhythm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Intensity Slider (1-5) */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/50 border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                <span>Intensité émotionnelle</span>
              </label>
              <span className="text-xs font-bold text-purple-300">
                {intensity} / 5
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">
              {INTENSITY_LABELS[intensity]} (engagement sans crier)
            </p>
          </div>

          {/* Rhythm selection */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/50 border border-slate-800">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>Rythme & cadence</span>
            </label>
            <select
              value={pace}
              onChange={(e) => setPace(e.target.value as DirectionPace)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:border-purple-500 focus:outline-none"
            >
              {PACE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400">
              Cadence naturelle propre à la vendeuse de mode
            </p>
          </div>
        </div>

        {/* 2-Column Grid: Intonation contour & Energy */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Pitch contour */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/50 border border-slate-800">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>Courbe d’intonation</span>
            </label>
            <select
              value={pitchContour}
              onChange={(e) => setPitchContour(e.target.value as PitchContour)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:border-purple-500 focus:outline-none"
            >
              {PITCH_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Energy & Continuity */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/50 border border-slate-800">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Liaison avec la suite</span>
            </label>
            <select
              value={continuity}
              onChange={(e) => setContinuity(e.target.value as SegmentContinuity)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:border-purple-500 focus:outline-none"
            >
              {CONTINUITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Words to Emphasize (Tokens selection) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Mots à accentuer (1 à 3 max)</span>
            </label>
            <span className="text-[10px] text-slate-400">
              {selectedTokens.length}/3 sélectionnés
            </span>
          </div>

          {uniqueWords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-950/50 border border-slate-800">
              {uniqueWords.map((word) => {
                const isSelected = selectedTokens.includes(word);
                return (
                  <button
                    key={word}
                    type="button"
                    onClick={() => handleToggleToken(word)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium font-arabic transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {word}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Pause selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Pause autour du passage
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PAUSE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPauseChoice(opt.value)}
                className={`px-2.5 py-2 rounded-xl text-xs font-medium text-center transition-all ${
                  pauseChoice === opt.value
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Freeform Note */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Note libre de direction (facultatif)</span>
          </label>
          <textarea
            rows={2}
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="Ex : Comme si elle venait réellement d’essayer la robe et voulait partager une bonne découverte avec une amie."
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:border-purple-500 focus:outline-none resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!emotion.trim()}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-purple-900/40 transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Enregistrer la direction</span>
          </button>
        </div>
      </div>
    </div>
  );
};
