import { useState } from 'react';
import {
  AlertCircle,
  Captions,
  Download,
  Loader2,
  Maximize2,
  RotateCw,
  Wand2,
} from 'lucide-react';
import type { AspectRatio, GeneratedClip, SourceFrame, VideoDuration, VideoResolution } from '../types/studio';

interface ScreeningStageProps {
  sourceFrame: SourceFrame | null;
  activeClip: GeneratedClip | null;
  aspectRatio: AspectRatio;
  duration: VideoDuration;
  resolution: VideoResolution;
  narration: string;
  showSubtitles: boolean;
  isGenerating: boolean;
  elapsedSeconds: number;
  errorMessage: string | null;
  onToggleSubtitles: () => void;
  onClearError: () => void;
  onRetry: () => void;
  onExtendClip: (followUpPrompt: string, extensionDuration: '5s' | '10s') => void;
  onReturnToSourcePreview: () => void;
}

export function ScreeningStage({
  sourceFrame,
  activeClip,
  aspectRatio,
  duration,
  resolution,
  narration,
  showSubtitles,
  isGenerating,
  elapsedSeconds,
  errorMessage,
  onToggleSubtitles,
  onClearError,
  onRetry,
  onExtendClip,
  onReturnToSourcePreview,
}: ScreeningStageProps) {
  const [followUpText, setFollowUpText] = useState(
    'Continue the slow tracking shot along the twilight forest path as soft wind moves the leaves.'
  );
  const [previewCropMode, setPreviewCropMode] = useState<'cover' | 'contain'>('cover');

  const displayRatio = activeClip ? activeClip.aspectRatio : aspectRatio;
  const isPortrait = displayRatio === '9:16';

  return (
    <section className="flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-[#121720] p-6">
      {/* Stage Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-medium text-slate-100">
            {activeClip ? 'Generated Motion Shot' : 'Reference Frame Framing'}
          </h2>
          <p className="mt-0.5 font-mono text-xs text-slate-400 tabular-nums">
            {activeClip
              ? `${activeClip.aspectRatio} · ${activeClip.duration} · ${activeClip.resolution}`
              : `${aspectRatio} · ${duration} · ${resolution}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!activeClip && sourceFrame && (
            <button
              type="button"
              onClick={() =>
                setPreviewCropMode((prev) => (prev === 'cover' ? 'contain' : 'cover'))
              }
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0B0E14] px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 hover:text-slate-100 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
              {previewCropMode === 'cover' ? 'Fill Frame' : 'Fit Whole Image'}
            </button>
          )}

          <button
            type="button"
            onClick={onToggleSubtitles}
            aria-pressed={showSubtitles}
            className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              showSubtitles
                ? 'border-[#E5A93C]/50 bg-[#1D2534] text-[#FDE68A]'
                : 'border-slate-800 bg-[#0B0E14] text-slate-300 hover:border-slate-700'
            }`}
          >
            <Captions className="h-3.5 w-3.5" aria-hidden="true" />
            {showSubtitles ? 'Subtitles On' : 'Subtitles Off'}
          </button>

          {activeClip && (
            <>
              <button
                type="button"
                onClick={onReturnToSourcePreview}
                className="inline-flex min-h-[36px] items-center rounded-lg border border-slate-800 bg-[#0B0E14] px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 hover:text-slate-100 whitespace-nowrap shrink-0 cursor-pointer"
              >
                View Source Frame
              </button>
              <a
                href={activeClip.videoUrl}
                download={`kathamotion-${activeClip.clipId.slice(0, 8)}.mp4`}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-white whitespace-nowrap shrink-0"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Download MP4
              </a>
            </>
          )}
        </div>
      </div>

      {/* Main Screening Canvas */}
      <div className="flex flex-1 items-center justify-center rounded-xl bg-[#07090D] p-4 border border-slate-800/70">
        <div
          className={`relative w-full overflow-hidden rounded-lg bg-black ${
            isPortrait ? 'aspect-[9/16] max-h-[560px] max-w-[315px]' : 'aspect-video max-h-[520px]'
          }`}
        >
          {activeClip ? (
            <video
              key={activeClip.clipId}
              src={activeClip.videoUrl}
              controls
              loop
              playsInline
              autoPlay
              className="h-full w-full bg-black object-contain"
            />
          ) : sourceFrame ? (
            <img
              src={sourceFrame.previewUrl}
              alt={sourceFrame.name}
              referrerPolicy="no-referrer"
              className={`h-full w-full transition-opacity duration-200 ${
                previewCropMode === 'cover' ? 'object-cover' : 'object-contain'
              }`}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
              Upload a photo to preview your shot framing
            </div>
          )}

          {/* Subtitle Scrim Preview */}
          {showSubtitles && narration.trim() && !isGenerating && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-6 pt-10 pb-5 text-center">
              <p className="mx-auto max-w-2xl text-sm font-medium leading-relaxed text-slate-100 drop-shadow-sm sm:text-[15px]">
                {narration}
              </p>
            </div>
          )}

          {/* Generating Overlay */}
          {isGenerating && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#07090D]/80 px-6 text-center backdrop-blur-xs">
              <Loader2
                className="h-8 w-8 animate-spin text-[#E5A93C]"
                aria-hidden="true"
              />
              <p className="mt-4 text-sm font-semibold text-slate-100">
                Animating reference frame
              </p>
              <p className="mt-1 font-mono text-xs text-slate-400 tabular-nums">
                Elapsed {elapsedSeconds}s · {aspectRatio} · {duration} · {resolution}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div
          role="alert"
          className="mt-4 flex flex-col gap-3 rounded-xl border border-rose-500/40 bg-rose-950/35 p-4 text-sm text-rose-100 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0 text-rose-400"
              aria-hidden="true"
            />
            <div>
              <p className="font-semibold text-rose-100">Video generation failed</p>
              <p className="mt-0.5 text-xs leading-relaxed text-rose-200/90">
                {errorMessage}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClearError}
              className="min-h-[34px] rounded-lg border border-rose-400/30 px-3 py-1.5 text-xs font-medium text-rose-100 transition-colors hover:bg-rose-900/40 cursor-pointer"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={onRetry}
              disabled={isGenerating}
              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-950 transition-colors hover:bg-white cursor-pointer"
            >
              <RotateCw className="h-3 w-3" aria-hidden="true" />
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Multi-turn Extend / Refine Bar (when a generated clip is active) */}
      {activeClip && !isGenerating && (
        <div className="mt-4 border-t border-slate-800/80 pt-4">
          <label
            htmlFor="extend-prompt"
            className="mb-2 block text-xs font-semibold text-slate-300"
          >
            Continue or Refine This Shot
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="extend-prompt"
              type="text"
              value={followUpText}
              onChange={(e) => setFollowUpText(e.target.value)}
              placeholder="Describe how the scene continues or what motion to adjust..."
              className="min-h-[40px] flex-1 rounded-lg border border-slate-800 bg-[#0B0E14] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-[#E5A93C] focus:outline-none"
            />
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onExtendClip(followUpText, '5s')}
                disabled={!followUpText.trim()}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-700 bg-[#181F2C] px-3.5 py-2 text-xs font-semibold text-slate-100 transition-colors hover:border-slate-600 hover:bg-slate-800 disabled:opacity-50 whitespace-nowrap cursor-pointer"
              >
                <Wand2 className="h-3.5 w-3.5 text-[#E5A93C]" aria-hidden="true" />
                Extend +5s
              </button>
              <button
                type="button"
                onClick={() => onExtendClip(followUpText, '10s')}
                disabled={!followUpText.trim()}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#E5A93C] px-3.5 py-2 text-xs font-semibold text-[#0B0E14] transition-colors hover:bg-[#F0B850] disabled:opacity-50 whitespace-nowrap cursor-pointer"
              >
                Extend +10s
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
