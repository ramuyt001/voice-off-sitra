import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Sliders,
  Smile,
  Volume2,
  Clock,
  Sparkles,
  Shield,
  Zap,
} from 'lucide-react';
import { ReadingInstruction } from '../types.ts';

interface ReadingInstructionsProps {
  instructions: ReadingInstruction[];
  onAddInstruction: (instruction: ReadingInstruction) => void;
  onRemoveInstruction: (id: string) => void;
  selectedTextSnippet: string;
  scriptText: string;
}

const INSTRUCTION_PRESETS = [
  { id: 'insist', label: 'Insister sur ce passage', icon: Zap },
  { id: 'slow', label: 'Ralentir légèrement', icon: Clock },
  { id: 'fast', label: 'Accélérer légèrement', icon: Zap },
  { id: 'smile', label: 'Sourire dans la voix', icon: Smile },
  { id: 'reassuring', label: 'Ton plus rassurant', icon: Shield },
  { id: 'energetic', label: 'Ton plus énergique', icon: Sparkles },
  { id: 'pause_after', label: 'Pause courte après ce passage', icon: Clock },
  { id: 'custom', label: 'Instruction personnalisée', icon: Sliders },
];

export const ReadingInstructions: React.FC<ReadingInstructionsProps> = ({
  instructions,
  onAddInstruction,
  onRemoveInstruction,
  selectedTextSnippet,
  scriptText,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('smile');
  const [customSnippet, setCustomSnippet] = useState('');
  const [customNote, setCustomNote] = useState('');

  const effectiveSnippet = selectedTextSnippet.trim() || customSnippet.trim();

  const handleAdd = () => {
    if (!effectiveSnippet) return;
    const preset = INSTRUCTION_PRESETS.find((p) => p.id === selectedType);
    const newInst: ReadingInstruction = {
      id: 'inst_' + Math.random().toString(36).substring(2, 9),
      targetText: effectiveSnippet,
      instructionType: selectedType,
      label: preset ? preset.label : 'Instruction personnalisée',
      customNote: selectedType === 'custom' ? customNote : undefined,
    };
    onAddInstruction(newInst);
    setCustomSnippet('');
    setCustomNote('');
  };

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 overflow-hidden">
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-2.5">
          <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 text-xs flex items-center justify-center font-bold">
            4
          </span>
          <span className="font-semibold text-sm text-slate-200">
            Instructions de lecture (optionnel)
          </span>
          {instructions.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-medium">
              {instructions.length} {instructions.length === 1 ? 'active' : 'actives'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <span>{isOpen ? 'Masquer' : 'Afficher'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="p-4 pt-1 border-t border-slate-800/60 space-y-4">
          <p className="text-xs text-slate-400">
            Sélectionnez un mot ou une phrase dans votre script ci-dessus, puis choisissez l’inflexion vocale désirée. L’instruction sera transmise en métadonnée vocale sans jamais être prononcée.
          </p>

          {/* Add form */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">
                Passage ciblé du script :
              </label>
              {selectedTextSnippet ? (
                <div className="p-2 rounded bg-purple-950/30 border border-purple-500/30 text-purple-200 text-xs font-medium dir-auto flex items-center justify-between">
                  <span className="truncate">« {selectedTextSnippet} »</span>
                  <span className="text-[10px] text-purple-400 bg-purple-900/50 px-1.5 py-0.5 rounded">
                    Sélectionné
                  </span>
                </div>
              ) : (
                <input
                  type="text"
                  dir="auto"
                  value={customSnippet}
                  onChange={(e) => setCustomSnippet(e.target.value)}
                  placeholder="Ex: la robe, 3900 DA, commande-la..."
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
                />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Type d’instruction :
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
                >
                  {INSTRUCTION_PRESETS.map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-900">
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {selectedType === 'custom' && (
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Précision :
                  </label>
                  <input
                    type="text"
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="Ex: ton complice, chuchoté..."
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleAdd}
              disabled={!effectiveSnippet}
              className="w-full py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter cette instruction</span>
            </button>
          </div>

          {/* List of active instructions */}
          {instructions.length > 0 ? (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">
                Instructions configurées ({instructions.length}) :
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {instructions.map((inst) => {
                  const isInScript = scriptText.includes(inst.targetText);
                  return (
                    <div
                      key={inst.id}
                      className={`p-2.5 rounded-lg border text-xs flex items-start justify-between gap-2 transition-all ${
                        isInScript
                          ? 'bg-slate-950/60 border-slate-800'
                          : 'bg-rose-950/20 border-rose-900/40 opacity-75'
                      }`}
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-purple-300">
                            {inst.label}
                          </span>
                          {!isInScript && (
                            <span className="text-[10px] text-rose-400 bg-rose-950/50 px-1 py-0.2 rounded">
                              Passage modifié
                            </span>
                          )}
                        </div>
                        <p className="text-slate-300 truncate font-mono text-[11px] dir-auto">
                          « {inst.targetText} »
                        </p>
                        {inst.customNote && (
                          <p className="text-[10px] text-slate-400 italic">
                            {inst.customNote}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        aria-label="Supprimer l'instruction"
                        onClick={() => onRemoveInstruction(inst.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic text-center py-1">
              Aucune instruction spécifique configurée. La diction suivra le style global du mode sélectionné.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
