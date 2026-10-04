import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Volume2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Shield,
  X,
  Loader2,
  Lock,
} from 'lucide-react';
import {
  AudioGenerationResult,
  ComparisonResult,
  EmotionalDirection,
  ReadingModeId,
  ScriptOptimizationResult,
  TargetDuration,
  VoiceStatus,
} from './types.ts';
import {
  countWords,
  estimateCost,
  estimateSpeechDurationSeconds,
  recordObservedSessionRate,
} from './config/pricing.ts';
import {
  buildMacroGroups,
  computeScriptHash,
  realignAndValidateDirections,
  resolveEffectiveDirections,
} from './utils/segmentation.ts';
import { Header } from './components/Header.tsx';
import { ModeSelector } from './components/ModeSelector.tsx';
import { DurationSelector } from './components/DurationSelector.tsx';
import { ScriptEditor } from './components/ScriptEditor.tsx';
import { EmotionalDirectionSection } from './components/EmotionalDirectionSection.tsx';
import { DirectionModal } from './components/DirectionModal.tsx';
import { InterpretationComparison } from './components/InterpretationComparison.tsx';
import { CostAndBudget } from './components/CostAndBudget.tsx';
import { AudioPlayerResult } from './components/AudioPlayerResult.tsx';
import { OptimizationModal } from './components/OptimizationModal.tsx';
import { GenerationSummaryCard } from './components/GenerationSummaryCard.tsx';

const DEFAULT_SAMPLE_SCRIPT =
  'لبنات، هادي هي la robe اللي ما لازمش تفوتكم هاد la saison! Une robe Dolce tendance بزاف وشابة، les manches والـ coupe تاعها يجو روعة كي تلبسيها. وهذا كامل غير بتلاتمية وستين ألف! يبقالك غير تختاري la couleur اللي تناسبك، وتكليكي على le lien باش تديري la commande.';

const STORAGE_KEY_BUDGET = 'voiceoff_budget_eur';
const STORAGE_KEY_SPENT = 'voiceoff_spent_eur';
const STORAGE_KEY_MONTH = 'voiceoff_current_month';
const STORAGE_KEY_PREF_MODE = 'voiceoff_pref_mode';
const STORAGE_KEY_PREF_DURATION = 'voiceoff_pref_duration';
const SESSION_KEY_LAST_SCRIPT = 'voiceoff_session_last_script';
const SESSION_KEY_DIRECTIONS = 'voiceoff_session_directions';

export default function App() {
  // Mode & Duration
  const [mode, setMode] = useState<ReadingModeId>(() => {
    return (localStorage.getItem(STORAGE_KEY_PREF_MODE) as ReadingModeId) || 'elegant';
  });

  const [duration, setDuration] = useState<TargetDuration>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREF_DURATION);
    return saved ? (Number(saved) as TargetDuration) : 20;
  });

  // Script text
  const [script, setScript] = useState<string>(() => {
    return sessionStorage.getItem(SESSION_KEY_LAST_SCRIPT) || DEFAULT_SAMPLE_SCRIPT;
  });

  // Emotional Directions state
  const [directions, setDirections] = useState<EmotionalDirection[]>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY_DIRECTIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [useAutoSuggestions, setUseAutoSuggestions] = useState<boolean>(true);
  const [isAnalyzingScript, setIsAnalyzingScript] = useState<boolean>(false);
  const [usedLocalFallback, setUsedLocalFallback] = useState<boolean>(false);

  // Selection tracking
  const [selectedSnippet, setSelectedSnippet] = useState<string>('');
  const [selectedRange, setSelectedRange] = useState<{
    startIndex: number;
    endIndex: number;
  } | null>(null);

  // Direction Modal state
  const [directionModalOpen, setDirectionModalOpen] = useState<boolean>(false);
  const [editingDirection, setEditingDirection] = useState<EmotionalDirection | null>(null);

  // Voice status
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus | null>(null);
  const [isLoadingVoice, setIsLoadingVoice] = useState<boolean>(true);

  // Audio generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [audioResult, setAudioResult] = useState<AudioGenerationResult | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // A/B Comparison state
  const [comparisonData, setComparisonData] = useState<ComparisonResult | null>(null);
  const [isGeneratingStandard, setIsGeneratingStandard] = useState<boolean>(false);
  const [isGeneratingDirected, setIsGeneratingDirected] = useState<boolean>(false);
  const [isGeneratingBoth, setIsGeneratingBoth] = useState<boolean>(false);

  // Script optimization state
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [optimizationResult, setOptimizationResult] =
    useState<ScriptOptimizationResult | null>(null);
  const [optimizationModalOpen, setOptimizationModalOpen] = useState<boolean>(false);

  // Budget tracking
  const [monthlyBudgetEur, setMonthlyBudgetEur] = useState<number>(() => {
    const b = localStorage.getItem(STORAGE_KEY_BUDGET);
    return b ? Number(b) : 15;
  });

  const [monthlySpentEur, setMonthlySpentEur] = useState<number>(() => {
    const currentMonthKey = new Date().toISOString().substring(0, 7);
    const savedMonth = localStorage.getItem(STORAGE_KEY_MONTH);
    if (savedMonth !== currentMonthKey) {
      localStorage.setItem(STORAGE_KEY_MONTH, currentMonthKey);
      localStorage.setItem(STORAGE_KEY_SPENT, '0');
      return 0;
    }
    const spent = localStorage.getItem(STORAGE_KEY_SPENT);
    return spent ? Number(spent) : 0;
  });

  // Notifications
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync script to sessionStorage
  useEffect(() => {
    if (script) {
      sessionStorage.setItem(SESSION_KEY_LAST_SCRIPT, script);
    }
  }, [script]);

  // Sync directions to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY_DIRECTIONS, JSON.stringify(directions));
  }, [directions]);

  // Sync preferences to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREF_MODE, mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREF_DURATION, String(duration));
  }, [duration]);

  // Load voice status on mount
  useEffect(() => {
    let isMounted = true;
    const checkVoice = async () => {
      try {
        setIsLoadingVoice(true);
        const res = await fetch('/api/voice/status');
        const data = await res.json();
        if (isMounted) {
          setVoiceStatus(data);
          if (!data.ready && data.error) {
            setErrorMessage(data.error);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage('Connexion au serveur vocale interrompue.');
        }
      } finally {
        if (isMounted) setIsLoadingVoice(false);
      }
    };
    checkVoice();
    return () => {
      isMounted = false;
    };
  }, []);

  // Budget change handler
  const handleBudgetChange = (newBudget: number) => {
    setMonthlyBudgetEur(newBudget);
    localStorage.setItem(STORAGE_KEY_BUDGET, String(newBudget));
  };

  const recordSpent = (costEur: number) => {
    const currentMonthKey = new Date().toISOString().substring(0, 7);
    const updated = monthlySpentEur + costEur;
    setMonthlySpentEur(updated);
    localStorage.setItem(STORAGE_KEY_MONTH, currentMonthKey);
    localStorage.setItem(STORAGE_KEY_SPENT, String(updated));
  };

  // Determine active directions
  const activeDirs = resolveEffectiveDirections(
    directions.filter((d) => d.source === 'manual'),
    directions.filter((d) => d.source === 'automatic'),
    useAutoSuggestions
  );

  // Archived manual directions (from previous or modified script)
  const archivedDirs = directions.filter(
    (d) => d.source === 'manual' && (!d.isValid || d.status === 'invalid' || d.status === 'archived')
  );

  // Compute prosodic macro-groups
  const macroGroups = buildMacroGroups(script, activeDirs, mode, duration);

  // Calibrated speech duration
  const wordCount = countWords(script);
  const estimatedDuration = estimateSpeechDurationSeconds({
    text: script,
    wordCount,
    mode,
    macroGroupsCount: macroGroups.length,
    pauseCount: activeDirs.filter((d) => d.pauseBefore || d.pauseAfter).length,
  });

  // Script text change with validation/realignment of directions
  const handleScriptChange = (newText: string) => {
    setScript(newText);
    setSelectedSnippet('');
    setSelectedRange(null);
    setDirections((prevDirs) => realignAndValidateDirections(prevDirs, newText));
  };

  // Text selection handler
  const handleTextSelection = (
    snippet: string,
    range: { startIndex: number; endIndex: number } | null
  ) => {
    setSelectedSnippet(snippet);
    setSelectedRange(range);
  };

  // Modal open for adding a new direction
  const handleOpenAddModal = () => {
    if (!selectedSnippet.trim() || !selectedRange) {
      setErrorMessage('Sélectionnez d’abord un passage dans le script.');
      return;
    }
    setEditingDirection(null);
    setDirectionModalOpen(true);
  };

  // Modal open for editing an existing direction
  const handleEditDirection = (dir: EmotionalDirection) => {
    setEditingDirection(dir);
    setSelectedSnippet(dir.targetText);
    setSelectedRange({ startIndex: dir.startIndex, endIndex: dir.endIndex });
    setDirectionModalOpen(true);
  };

  // Save direction (manual priority over auto)
  const handleSaveDirection = (newDir: EmotionalDirection) => {
    setDirections((prev) => {
      const filtered = prev.filter((d) => d.id !== newDir.id);
      const cleaned = filtered.filter((d) => {
        if (d.source === 'automatic') {
          const overlaps = !(
            newDir.endIndex <= d.startIndex || newDir.startIndex >= d.endIndex
          );
          return !overlaps;
        }
        return true;
      });

      return [...cleaned, newDir].sort((a, b) => a.startIndex - b.startIndex);
    });

    setSelectedSnippet('');
    setSelectedRange(null);
    setSuccessMessage('Direction manuelle enregistrée et verrouillée.');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Convert an auto suggestion into locked manual direction
  const handleConvertToManual = (autoDir: EmotionalDirection) => {
    setDirections((prev) =>
      prev.map((d) => {
        if (d.id === autoDir.id) {
          return {
            ...d,
            source: 'manual',
            locked: true,
          };
        }
        return d;
      })
    );
    setSuccessMessage('Suggestion convertie en direction manuelle verrouillée.');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Delete direction
  const handleDeleteDirection = (id: string) => {
    setDirections((prev) => prev.filter((d) => d.id !== id));
  };

  // Clear auto suggestions
  const handleClearAutoSuggestions = () => {
    setDirections((prev) => prev.filter((d) => d.source === 'manual'));
    setSuccessMessage('Suggestions automatiques effacées.');
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  // Reset all directions
  const handleResetAllDirections = () => {
    setDirections([]);
    setSelectedSnippet('');
    setSelectedRange(null);
    setSuccessMessage('Toutes les directions ont été réinitialisées.');
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  // Automatic script analysis
  const handleAnalyzeScript = async (): Promise<EmotionalDirection[]> => {
    if (!script.trim()) {
      setErrorMessage('Le script ne peut pas être vide.');
      return [];
    }

    try {
      setIsAnalyzingScript(true);
      setErrorMessage(null);

      const res = await fetch('/api/analyze-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script, mode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l’analyse du script.');
      }

      setUsedLocalFallback(Boolean(data.usedLocalFallback));

      const newAutoDirections: EmotionalDirection[] = Array.isArray(data.directions)
        ? data.directions
        : [];

      let mergedResult: EmotionalDirection[] = [];

      setDirections((prev) => {
        // Keep active valid manual directions for the current script
        const validManual = prev.filter(
          (d) => d.source === 'manual' && d.isValid && d.status !== 'invalid' && d.status !== 'archived'
        );
        // Retain any old manual directions in archived state so they are not deleted
        const archivedManual = prev.filter(
          (d) => d.source === 'manual' && (!d.isValid || d.status === 'invalid' || d.status === 'archived')
        );

        const filteredNewAuto = newAutoDirections.filter((autoDir) => {
          const overlaps = validManual.some(
            (m) => !(autoDir.endIndex <= m.startIndex || autoDir.startIndex >= m.endIndex)
          );
          return !overlaps;
        });

        mergedResult = [...validManual, ...filteredNewAuto].sort(
          (a, b) => a.startIndex - b.startIndex
        );
        return [...mergedResult, ...archivedManual];
      });

      if (data.usedLocalFallback) {
        setSuccessMessage('Analyse locale de secours appliquée (variations émotionnelles garanties).');
      } else {
        setSuccessMessage('Analyse terminée ! Vos directions pour ce script sont prêtes.');
      }
      setTimeout(() => setSuccessMessage(null), 3500);
      return mergedResult;
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Impossible d’analyser le script pour le moment.'
      );
      return [];
    } finally {
      setIsAnalyzingScript(false);
    }
  };

  // Script optimization call with gemini-3.8-flash
  const handleOptimizeScript = async (shortenOnly: boolean = false) => {
    if (!script.trim()) {
      setErrorMessage('Veuillez d’abord saisir ou coller un script.');
      return;
    }

    try {
      setIsOptimizing(true);
      setErrorMessage(null);

      const res = await fetch('/api/optimize-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: script,
          targetDuration: duration,
          mode: mode,
          shortenOnly,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l’optimisation du script.');
      }

      setOptimizationResult(data);
      setOptimizationModalOpen(true);
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          'Une erreur est survenue lors de l’optimisation. Veuillez réessayer.'
      );
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApplyOptimizedScript = (newText: string) => {
    setScript(newText);
    setDirections((prev) =>
      prev
        .filter((d) => d.source === 'manual')
        .map((d) => ({ ...d, isValid: false, status: 'archived' as const }))
    );
    setOptimizationModalOpen(false);
    setSuccessMessage('Texte optimisé appliqué avec succès !');
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  // Single Audio Generation with Compiled Emotional Directions
  const handleGenerateAudio = async (overrideDirections?: EmotionalDirection[]) => {
    if (!script.trim()) {
      setErrorMessage('Le texte du script ne peut pas être vide.');
      return;
    }
    if (script.length > 1500) {
      setErrorMessage('Le script dépasse la limite de 1 500 caractères.');
      return;
    }
    if (isGenerating) return;

    try {
      setIsGenerating(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      setGenerationProgress(10);

      // Section 5 & 6: Validate directions against the CURRENT script identity
      const currentHash = computeScriptHash(script);
      const candidates = overrideDirections !== undefined ? overrideDirections : directions;
      const validForCurrentScript = candidates.filter(
        (d) =>
          d &&
          d.isValid !== false &&
          d.status !== 'invalid' &&
          d.status !== 'archived' &&
          (!d.scriptFingerprint || d.scriptFingerprint === currentHash)
      );

      let currentActiveDirs = validForCurrentScript;

      // Section 6: If no valid directions exist for this current text, automatically analyze it before synthesis!
      if (
        overrideDirections === undefined &&
        validForCurrentScript.length === 0 &&
        script.trim().length > 10
      ) {
        setGenerationProgress(20);
        console.log('[Audio Generation] Script changed or unanalyzed. Running automatic semantic analysis...');
        const autoResult = await handleAnalyzeScript();
        currentActiveDirs = autoResult.filter(
          (d) => d && d.isValid !== false && d.status !== 'invalid' && d.status !== 'archived'
        );
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const progressTimer = setInterval(() => {
        setGenerationProgress((p) => {
          if (p >= 85) return p;
          return p + Math.floor(Math.random() * 10) + 5;
        });
      }, 700);

      const response = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: script,
          mode: mode,
          targetDuration: duration,
          directions: currentActiveDirs,
          strategy: 'unified_flow',
          returnJson: true,
        }),
        signal: controller.signal,
      });

      clearInterval(progressTimer);

      if (!response.ok) {
        const errorJson = await response.json().catch(() => null);
        throw new Error(errorJson?.error || `Erreur serveur (${response.status})`);
      }

      setGenerationProgress(95);

      const data = await response.json();
      if (!data.mp3Base64) {
        throw new Error('Le fichier audio généré est vide.');
      }

      const audioUrl = base64ToBlobUrl(data.mp3Base64, 'audio/mpeg');
      const wavUrl = data.wavBase64 ? base64ToBlobUrl(data.wavBase64, 'audio/wav') : undefined;
      const realDuration = data.actualDuration || duration;
      const fileSizeBytes = data.fileSizeBytes;

      const cost = estimateCost(script, realDuration);
      recordSpent(cost.totalEur);

      // Continuously calibrate voice delivery rate for Voice Off DZ Original
      recordObservedSessionRate(wordCount, realDuration, mode);

      const todayStr = new Date().toISOString().split('T')[0];
      const cleanMode = mode.toUpperCase();
      const fileName = `VoiceOff_${todayStr}_${cleanMode}_${duration}S.mp3`;

      setAudioResult({
        audioBlobUrl: audioUrl,
        wavBlobUrl: wavUrl,
        durationSeconds: realDuration,
        wavDurationSeconds: data.wavDuration,
        fileSizeBytes: fileSizeBytes,
        costEstimateUsd: cost.totalUsd,
        costEstimateEur: cost.totalEur,
        mode: mode,
        targetDuration: duration,
        generatedAt: new Date().toLocaleTimeString(),
        fileName: fileName,
        hasEmotionalDirection: currentActiveDirs.length > 0,
        strategyUsed: data.strategyUsed || 'unified_flow',
        macroGroupsCount: data.macroGroups?.length || macroGroups.length,
        microSegmentsCount: currentActiveDirs.length,
        usedLocalFallback: usedLocalFallback,
        detectedSilences: data.detectedSilences,
        measurements: data.measurements,
        wavMeasurements: data.wavMeasurements,
      });

      setGenerationProgress(100);
      setSuccessMessage('Voix off générée et normalisée avec flux continu !');

      setTimeout(() => {
        const playerEl = document.getElementById('audio-result-section');
        if (playerEl) {
          playerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setErrorMessage('Génération annulée.');
      } else {
        console.error('Audio generation error:', err);
        setErrorMessage(
          err.message ||
            'Une erreur est survenue lors de la création vocale. Veuillez réessayer.'
        );
      }
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
      abortControllerRef.current = null;
    }
  };

  // Helper to convert base64 to Blob URL
  const base64ToBlobUrl = (base64: string, mime: string) => {
    const bytes = atob(base64);
    const buf = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      buf[i] = bytes.charCodeAt(i);
    }
    return URL.createObjectURL(new Blob([buf], { type: mime }));
  };

  // A/B Comparison Generator (Section 14)
  const handleGenerateComparison = async (compareMode: 'standard' | 'compilers' = 'compilers') => {
    if (!script.trim()) {
      setErrorMessage('Le script ne peut pas être vide pour le comparatif.');
      return;
    }

    try {
      setIsGeneratingBoth(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      let currentDirs = activeDirs;
      if (currentDirs.length === 0) {
        currentDirs = await handleAnalyzeScript();
      }

      const response = await fetch('/api/generate-comparison', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: script,
          mode: mode,
          directions: currentDirs,
          targetDuration: duration,
          compareMode: compareMode,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du comparatif audio.');
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const cleanMode = mode.toUpperCase();

      const standardMp3Url = base64ToBlobUrl(data.standard.mp3Base64, 'audio/mpeg');
      const standardWavUrl = data.standard.wavBase64
        ? base64ToBlobUrl(data.standard.wavBase64, 'audio/wav')
        : undefined;

      const directedMp3Url = base64ToBlobUrl(data.directed.mp3Base64, 'audio/mpeg');
      const directedWavUrl = data.directed.wavBase64
        ? base64ToBlobUrl(data.directed.wavBase64, 'audio/wav')
        : undefined;

      // Record spent for 2 generations
      const costStandard = estimateCost(script, data.standard.durationSeconds);
      const costDirected = estimateCost(script, data.directed.durationSeconds);
      recordSpent(costStandard.totalEur + costDirected.totalEur);

      setComparisonData({
        standard: {
          audioBlobUrl: standardMp3Url,
          wavBlobUrl: standardWavUrl,
          durationSeconds: data.standard.durationSeconds,
          wavDurationSeconds: data.standard.wavDurationSeconds,
          fileSizeBytes: data.standard.fileSizeBytes,
          costEstimateUsd: costStandard.totalUsd,
          costEstimateEur: costStandard.totalEur,
          mode: mode,
          targetDuration: duration,
          generatedAt: new Date().toLocaleTimeString(),
          fileName: `VoiceOff_${todayStr}_${cleanMode}_VersionA.mp3`,
          hasEmotionalDirection: false,
          strategyUsed: data.standard.strategyUsed,
          macroGroupsCount: data.standard.macroGroupsCount,
          microSegmentsCount: data.standard.microSegmentsCount,
          detectedSilences: data.standard.detectedSilences,
          measurements: data.standard.measurements,
          wavMeasurements: data.standard.wavMeasurements,
        },
        directed: {
          audioBlobUrl: directedMp3Url,
          wavBlobUrl: directedWavUrl,
          durationSeconds: data.directed.durationSeconds,
          wavDurationSeconds: data.directed.wavDurationSeconds,
          fileSizeBytes: data.directed.fileSizeBytes,
          costEstimateUsd: costDirected.totalUsd,
          costEstimateEur: costDirected.totalEur,
          mode: mode,
          targetDuration: duration,
          generatedAt: new Date().toLocaleTimeString(),
          fileName: `VoiceOff_${todayStr}_${cleanMode}_VersionB.mp3`,
          hasEmotionalDirection: true,
          strategyUsed: data.directed.strategyUsed,
          macroGroupsCount: data.directed.macroGroupsCount,
          microSegmentsCount: data.directed.microSegmentsCount,
          detectedSilences: data.directed.detectedSilences,
          measurements: data.directed.measurements,
          wavMeasurements: data.directed.wavMeasurements,
        },
        generatedAt: new Date().toLocaleTimeString(),
      });

      setSuccessMessage('Comparatif A/B généré avec succès !');
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Une erreur est survenue lors de la génération comparative.'
      );
    } finally {
      setIsGeneratingBoth(false);
    }
  };

  const handleGenerateStandardOnly = async () => {
    await handleGenerateAudio([]);
  };

  const handleGenerateDirectedOnly = async () => {
    await handleGenerateAudio();
  };

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleClearScript = () => {
    setScript('');
    setDirections([]);
    setSelectedSnippet('');
    setSelectedRange(null);
  };

  const handleDuplicateLast = () => {
    const saved = sessionStorage.getItem(SESSION_KEY_LAST_SCRIPT);
    if (saved) {
      setScript(saved);
      setSuccessMessage('Dernier script de session restauré !');
      setTimeout(() => setSuccessMessage(null), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 font-sans selection:bg-purple-500/30 selection:text-purple-200 flex flex-col justify-between">
      {/* Top Header */}
      <Header
        voiceStatus={voiceStatus}
        isLoadingVoice={isLoadingVoice}
        monthlySpentEur={monthlySpentEur}
        monthlyBudgetEur={monthlyBudgetEur}
        onBudgetChange={handleBudgetChange}
      />

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8 flex-1 w-full">
        {/* Alerts / Notifications */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs sm:text-sm flex items-start justify-between gap-3 shadow-lg animate-in fade-in duration-200">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              aria-label="Fermer l'alerte"
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-lg animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              type="button"
              aria-label="Fermer la notification"
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 1: Mode Selection */}
        <section aria-labelledby="step-mode">
          <ModeSelector selectedMode={mode} onSelectMode={setMode} />
        </section>

        {/* Step 2: Duration Selection */}
        <section aria-labelledby="step-duration">
          <DurationSelector
            selectedDuration={duration}
            onSelectDuration={setDuration}
            wordCount={wordCount}
            estimatedDuration={estimatedDuration}
          />
        </section>

        {/* Step 3: Script Editor with Bidi support */}
        <section aria-labelledby="step-script">
          <ScriptEditor
            script={script}
            onChange={handleScriptChange}
            onOptimize={handleOptimizeScript}
            onClear={handleClearScript}
            onDuplicateLast={handleDuplicateLast}
            onTextSelection={handleTextSelection}
            isOptimizing={isOptimizing}
            hasStoredSessionText={!!sessionStorage.getItem(SESSION_KEY_LAST_SCRIPT)}
          />
        </section>

        {/* Step 4: Summary Card Before & After Generation (Section 12 & 14) */}
        {script.trim().length > 10 && (
          <section aria-labelledby="step-summary">
            <GenerationSummaryCard
              mode={mode}
              targetDuration={duration}
              estimatedDuration={estimatedDuration}
              macroGroups={macroGroups}
              microSegments={activeDirs}
              usedLocalFallback={usedLocalFallback}
              measurements={audioResult?.measurements}
              wavMeasurements={audioResult?.wavMeasurements}
              strategyUsed={audioResult?.strategyUsed}
              archivedDirectionsCount={archivedDirs.length}
            />
          </section>
        )}

        {/* Step 5: Advanced Emotional Direction Section (Collapsible) */}
        <section aria-labelledby="step-emotional-direction">
          <EmotionalDirectionSection
            script={script}
            directions={directions}
            macroGroups={macroGroups}
            selectedSnippet={selectedSnippet}
            selectedRange={selectedRange}
            onOpenAddModal={handleOpenAddModal}
            onEditDirection={handleEditDirection}
            onDeleteDirection={handleDeleteDirection}
            onConvertToManual={handleConvertToManual}
            onAnalyzeScript={handleAnalyzeScript}
            isAnalyzing={isAnalyzingScript}
            useAutoSuggestions={useAutoSuggestions}
            onToggleUseAuto={setUseAutoSuggestions}
            onClearAutoSuggestions={handleClearAutoSuggestions}
            onResetAllDirections={handleResetAllDirections}
          />
        </section>

        {/* Step 6: Approximate Cost & Budget */}
        <section aria-labelledby="step-cost">
          <CostAndBudget
            script={script}
            durationSeconds={duration}
            monthlySpentEur={monthlySpentEur}
            monthlyBudgetEur={monthlyBudgetEur}
            onBudgetChange={handleBudgetChange}
          />
        </section>

        {/* Step 7: Generate CTA Section */}
        <section className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => handleGenerateAudio()}
              disabled={isGenerating || !script.trim() || !voiceStatus?.ready}
              className={`w-full sm:flex-1 py-4 px-6 rounded-2xl font-bold text-base shadow-xl transition-all flex items-center justify-center gap-3 focus:outline-none focus:ring-4 focus:ring-purple-500/30 ${
                isGenerating
                  ? 'bg-purple-900/60 text-purple-200 cursor-wait border border-purple-500/40'
                  : !script.trim() || !voiceStatus?.ready
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 hover:from-purple-500 hover:via-fuchsia-500 hover:to-purple-500 text-white shadow-purple-950/70 border border-purple-400/40 active:scale-[0.99]'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-purple-300" />
                  <span>Création de la voix off continue…</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 text-purple-200" />
                  <span>
                    Générer la voix off ({duration}s)
                    {activeDirs.length > 0 && (
                      <span className="text-xs font-normal opacity-90 ml-1">
                        avec continuité prosodique
                      </span>
                    )}
                  </span>
                </>
              )}
            </button>

            {isGenerating && (
              <button
                type="button"
                onClick={handleCancelGeneration}
                className="w-full sm:w-auto px-5 py-4 rounded-2xl border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white font-medium text-xs transition-colors"
              >
                Annuler
              </button>
            )}
          </div>

          {/* Discreet Visual Progress during generation */}
          {isGenerating && (
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-purple-500/20 animate-in fade-in">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-2 text-purple-300">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                  </span>
                  <span>Synthèse audio continue Gemini 3.8 Flash TTS en cours…</span>
                </span>
                <span className="font-semibold text-purple-300">
                  {generationProgress}%
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-fuchsia-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
            </div>
          )}
        </section>

        {/* Step 8: Audio Player Result */}
        {audioResult && (
          <section id="audio-result-section" aria-labelledby="audio-result">
            <AudioPlayerResult
              result={audioResult}
              onModifyAndRegenerate={() => {
                const editor = document.getElementById('step-script');
                if (editor) editor.scrollIntoView({ behavior: 'smooth' });
              }}
              onDuplicateText={() => {
                navigator.clipboard.writeText(script);
              }}
            />
          </section>
        )}

        {/* Step 9: A/B Interpretation & Continuity Comparison Section */}
        <section aria-labelledby="step-comparison">
          <InterpretationComparison
            comparisonData={comparisonData}
            onGenerateStandard={handleGenerateStandardOnly}
            onGenerateDirected={handleGenerateDirectedOnly}
            onGenerateBoth={handleGenerateComparison}
            isGeneratingStandard={isGeneratingStandard}
            isGeneratingDirected={isGeneratingDirected}
            isGeneratingBoth={isGeneratingBoth}
            hasScript={!!script.trim()}
          />
        </section>
      </main>

      {/* Direction Modal */}
      <DirectionModal
        isOpen={directionModalOpen}
        onClose={() => setDirectionModalOpen(false)}
        targetText={selectedSnippet}
        startIndex={selectedRange?.startIndex || 0}
        endIndex={selectedRange?.endIndex || 0}
        existingDirection={editingDirection}
        onSaveDirection={handleSaveDirection}
      />

      {/* Script Optimization Modal */}
      {optimizationResult && (
        <OptimizationModal
          isOpen={optimizationModalOpen}
          onClose={() => setOptimizationModalOpen(false)}
          originalText={script}
          result={optimizationResult}
          onApply={handleApplyOptimizedScript}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 px-4 text-center text-xs text-slate-400 space-y-1">
        <p>
          Voice Off — Synthèse vocale algérienne naturelle pour publicités Meta Ads
        </p>
        <p className="text-[11px] text-slate-400">
          Modèle : <code>gemini-3.8-flash-tts</code> • Voix : <code>Voice Off DZ Original</code>
        </p>
      </footer>
    </div>
  );
}
