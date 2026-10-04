import React, { useRef } from 'react';
import {
  Sparkles,
  Scissors,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface ScriptEditorProps {
  script: string;
  onChange: (value: string) => void;
  onOptimize: (shortenOnly?: boolean) => void;
  onClear: () => void;
  onDuplicateLast: () => void;
  onTextSelection: (
    selectedSnippet: string,
    range: { startIndex: number; endIndex: number } | null
  ) => void;
  isOptimizing: boolean;
  hasStoredSessionText: boolean;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  script,
  onChange,
  onOptimize,
  onClear,
  onDuplicateLast,
  onTextSelection,
  isOptimizing,
  hasStoredSessionText,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const maxLength = 1500;
  const charsRemaining = maxLength - script.length;
  const isOverLimit = script.length > maxLength;

  const handleSelect = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      if (start !== end && start >= 0 && end <= script.length) {
        const rawSnippet = script.substring(start, end);
        const trimmed = rawSnippet.trim();
        if (trimmed.length > 0) {
          const leadingOffset = rawSnippet.indexOf(trimmed);
          const realStart = start + leadingOffset;
          const realEnd = realStart + trimmed.length;
          onTextSelection(trimmed, { startIndex: realStart, endIndex: realEnd });
          return;
        }
      }
      onTextSelection('', null);
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor="script-input"
          className="text-sm font-semibold text-slate-200 flex items-center gap-2"
        >
          <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 text-xs flex items-center justify-center font-bold">
            3
          </span>
          Saisir le script (Darija & Français)
        </label>
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`font-mono text-xs ${
              isOverLimit
                ? 'text-rose-400 font-bold'
                : charsRemaining < 150
                ? 'text-amber-400'
                : 'text-slate-400'
            }`}
          >
            {script.length} / {maxLength} car.
          </span>
        </div>
      </div>

      {/* Main Textarea with proper Bidi support */}
      <div className="relative rounded-2xl border border-slate-800 bg-slate-950/60 focus-within:border-purple-500/80 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all shadow-inner">
        <textarea
          id="script-input"
          ref={textareaRef}
          dir="auto"
          value={script}
          onChange={(e) => onChange(e.target.value)}
          onSelect={handleSelect}
          onMouseUp={handleSelect}
          onKeyUp={handleSelect}
          rows={6}
          placeholder="Collez ici votre script en darija et en français…"
          className="w-full p-4 sm:p-5 bg-transparent text-slate-100 text-sm sm:text-base leading-relaxed placeholder:text-slate-500 focus:outline-none resize-y min-h-[140px] max-h-[360px]"
          style={{
            unicodeBidi: 'plaintext',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Noto Sans Arabic", "Segoe UI", Roboto, sans-serif',
          }}
        />
      </div>

      {/* Editor Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          {/* Optimize button */}
          <button
            type="button"
            onClick={() => onOptimize(false)}
            disabled={!script.trim() || isOptimizing}
            className="px-3.5 py-2 rounded-xl bg-purple-600/90 hover:bg-purple-600 disabled:opacity-40 text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-sm shadow-purple-950/40"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-200" />
            <span>{isOptimizing ? 'Optimisation en cours…' : 'Optimiser pour la voix off'}</span>
          </button>

          {/* Shorten to duration button */}
          <button
            type="button"
            onClick={() => onOptimize(true)}
            disabled={!script.trim() || isOptimizing}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-medium text-xs flex items-center gap-1.5 transition-colors border border-slate-700/80"
          >
            <Scissors className="w-3.5 h-3.5 text-slate-300" />
            <span>Raccourcir à la durée choisie</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Duplicate last text from current session */}
          {hasStoredSessionText && (
            <button
              type="button"
              onClick={onDuplicateLast}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 text-xs flex items-center gap-1.5 transition-colors"
              title="Restaurer le dernier texte de cette session"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Dupliquer le dernier texte</span>
            </button>
          )}

          {/* Clear button */}
          {script.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 text-xs flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Effacer</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
