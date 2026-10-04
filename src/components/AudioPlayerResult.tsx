import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Download,
  RotateCcw,
  Copy,
  Check,
  Volume2,
  VolumeX,
  FileAudio,
  Sparkles,
  Clock,
  HardDrive,
  Coins,
} from 'lucide-react';
import { AudioGenerationResult } from '../types.ts';
import { READING_MODES } from '../config/pricing.ts';

interface AudioPlayerResultProps {
  result: AudioGenerationResult;
  onModifyAndRegenerate?: () => void;
  onDuplicateText?: () => void;
}

export const AudioPlayerResult: React.FC<AudioPlayerResultProps> = ({
  result,
  onModifyAndRegenerate,
  onDuplicateText,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [actualDuration, setActualDuration] = useState(result.durationSeconds);
  const [isMuted, setIsMuted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Reset player state on new generation result
    setIsPlaying(false);
    setCurrentTime(0);
    setActualDuration(result.durationSeconds);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  }, [result.audioBlobUrl, result.durationSeconds]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setActualDuration(audioRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current?.duration && !isNaN(audioRef.current.duration)) {
      setActualDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m > 0 ? `${m}:` : ''}${s < 10 && m > 0 ? '0' : ''}${s}.${ms}s`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
  };

  const modeObj = READING_MODES.find((m) => m.id === result.mode);

  const handleCopy = () => {
    if (onDuplicateText) {
      onDuplicateText();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-purple-500/40 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 p-5 sm:p-7 shadow-2xl shadow-purple-950/30 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 ring-1 ring-purple-500/20">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={result.audioBlobUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        preload="metadata"
      />

      {/* Result Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center">
            <FileAudio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base sm:text-lg text-white">
                Votre voix off est prête
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                MP3 Mono 192k
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Voix algérienne naturelle • Normalisée à -16 LUFS pour Meta Ads
            </p>
          </div>
        </div>

        {/* Action: Download MP3 & Raw WAV Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {result.wavBlobUrl && (
            <a
              href={result.wavBlobUrl}
              download={result.fileName.replace(/\.mp3$/i, '_raw.wav')}
              className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-700 hover:border-purple-500/50 transition-all flex items-center justify-center gap-1.5"
              title="Télécharger le fichier WAV brut de synthèse (non compressé)"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span>WAV brut (calibration)</span>
            </a>
          )}
          <a
            href={result.audioBlobUrl}
            download={result.fileName}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-purple-950/60 transition-all flex items-center justify-center gap-2 ring-1 ring-white/20"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger le MP3</span>
          </a>
        </div>
      </div>

      {/* Custom HTML5 Audio Player */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
        <div className="flex items-center gap-4">
          {/* Play/Pause Button */}
          <button
            type="button"
            aria-label={isPlaying ? 'Mettre en pause' : 'Écouter'}
            onClick={togglePlay}
            className="w-12 h-12 rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-900/40 transition-all shrink-0 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* Scrubber progress */}
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="text-white font-medium">{formatTime(currentTime)}</span>
              <span>{formatTime(actualDuration)}</span>
            </div>
            <input
              type="range"
              aria-label="Progression de l'audio"
              min={0}
              max={actualDuration || 1}
              step={0.05}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500 focus:outline-none"
            />
          </div>

          {/* Mute button */}
          <button
            type="button"
            aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
            onClick={toggleMute}
            className="p-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors shrink-0"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Metadata Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        {/* Real duration */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <span className="text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            Durée réelle
          </span>
          <div className="font-bold text-sm text-white">
            {actualDuration.toFixed(1)}s
            <span className="text-[10px] text-slate-500 font-normal ml-1">
              (cible: {result.targetDuration}s)
            </span>
          </div>
        </div>

        {/* Mode used */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <span className="text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Mode utilisé
          </span>
          <div className="font-bold text-sm text-white truncate">
            {modeObj?.name || result.mode}
          </div>
        </div>

        {/* File size */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <span className="text-slate-400 flex items-center gap-1">
            <HardDrive className="w-3.5 h-3.5 text-purple-400" />
            Taille du fichier
          </span>
          <div className="font-bold text-sm text-white">
            {formatFileSize(result.fileSizeBytes)}
          </div>
        </div>

        {/* Cost estimate */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <span className="text-slate-400 flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-purple-400" />
            Coût estimé
          </span>
          <div className="font-bold text-sm text-purple-300">
            ~{result.costEstimateEur < 0.001 ? '< 0,001' : result.costEstimateEur.toFixed(4)} €
          </div>
        </div>
      </div>

      {/* Secondary Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          {/* Modify and regenerate */}
          <button
            type="button"
            onClick={onModifyAndRegenerate}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Modifier et régénérer</span>
          </button>

          {/* Duplicate this text */}
          <button
            type="button"
            onClick={handleCopy}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-800"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Texte copié !</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Dupliquer ce texte</span>
              </>
            )}
          </button>
        </div>

        <span className="text-[11px] text-slate-500 font-mono">
          Fichier : {result.fileName}
        </span>
      </div>
    </div>
  );
};
