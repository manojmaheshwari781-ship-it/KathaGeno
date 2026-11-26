import { useState, type DragEvent } from 'react';
import { Film, ImagePlus, RotateCcw } from 'lucide-react';
import type { AspectRatio, SourceFrame, VideoDuration, VideoResolution } from '../types/studio';

interface ControlPanelProps {
  sourceFrame: SourceFrame | null;
  prompt: string;
  aspectRatio: AspectRatio;
  duration: VideoDuration;
  resolution: VideoResolution;
  isGenerating: boolean;
  elapsedSeconds: number;
  onPromptChange: (value: string) => void;
  onAspectRatioChange: (value: AspectRatio) => void;
  onDurationChange: (value: VideoDuration) => void;
  onResolutionChange: (value: VideoResolution) => void;
  onTriggerFilePicker: () => void;
  onFileDrop: (file: File) => void;
  onResetDefaultFrame: () => void;
  onGenerate: () => void;
}

const MOTION_CUES = [
  { label: 'Slow Tracking', text: 'slow lateral tracking shot through the trees' },
  { label: 'Twilight Wind', text: 'soft cool twilight breeze rustling foliage and robes' },
  { label: 'Drifting Leaves', text: 'occasional autumn leaves drifting gently downward' },
  { label: 'Subtle Push-In', text: 'gradual cinematic push-in keeping steady eye-level framing' },
];

export function ControlPanel({
  sourceFrame,
  prompt,
  aspectRatio,
  duration,
  resolution,
  isGenerating,
  elapsedSeconds,
  onPromptChange,
  onAspectRatioChange,
  onDurationChange,
  onResolutionChange,
  onTriggerFilePicker,
  onFileDrop,
  onResetDefaultFrame,
  onGenerate,
}: ControlPanelProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onFileDrop(file);
    }
  };

  const appendMotionCue = (cueText: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      onPromptChange(cueText);
      return;
    }
    if (trimmed.toLowerCase().includes(cueText.toLowerCase())) {
      return;
    }
    const separator = trimmed.endsWith('.') ? ' ' : ', ';
    onPromptChange(`${trimmed}${separator}${cueText}.`);
  };

  const formatLabel = sourceFrame
    ? sourceFrame.mimeType.replace('image/', '').toUpperCase()
    : 'NONE';

  return (
    <aside className="flex flex-col gap-6 rounded-2xl border border-slate-800/80 bg-[#121720] p-6">
      {/* Photo Upload Slot */}
      <div>
        <div className="mb-2.5 flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-slate-100">Reference Photo</h2>
          {sourceFrame && !sourceFrame.isDefaultAsset && (
            <button
              type="button"
              onClick={onResetDefaultFrame}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-[#E5A93C] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              Use Sample Frame
            </button>
          )}
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`group relative overflow-hidden rounded-xl border transition-colors ${
            isDragging
              ? 'border-[#E5A93C] bg-[#E5A93C]/10'
              : 'border-slate-800 bg-[#0B0E14]/70 hover:border-slate-700'
          }`}
        >
          {sourceFrame ? (
            <div className="flex items-center gap-4 p-3">
              <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-900">
                <img
                  src={sourceFrame.previewUrl}
                  alt={sourceFrame.name}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-100">
                  {sourceFrame.name}
                </p>
                <p className="mt-1 font-mono text-xs text-slate-400 tabular-nums">
                  {sourceFrame.width} × {sourceFrame.height}
                  <span className="mx-1.5" aria-hidden="true">
                    ·
                  </span>
                  {formatLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={onTriggerFilePicker}
                disabled={isGenerating}
                className="min-h-[36px] shrink-0 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800 disabled:opacity-50 whitespace-nowrap cursor-pointer"
              >
                Replace
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onTriggerFilePicker}
              className="flex w-full flex-col items-center justify-center gap-2 px-4 py-8 text-center cursor-pointer"
            >
              <ImagePlus className="h-6 w-6 text-slate-400" aria-hidden="true" />
              <span className="text-sm font-medium text-slate-200">
                Drop a photo here or click to upload
              </span>
              <span className="text-xs text-slate-500">PNG, JPEG, or WebP</span>
            </button>
          )}
        </div>
      </div>

      {/* Motion Prompt */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="motion-prompt" className="text-sm font-semibold text-slate-100">
            Motion & Scene Direction
          </label>
          <span className="font-mono text-xs text-slate-500 tabular-nums">
            {prompt.length} chars
          </span>
        </div>
        <textarea
          id="motion-prompt"
          rows={5}
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          disabled={isGenerating}
          placeholder="Describe character movement, wind, camera tracking, and atmosphere..."
          className="w-full resize-y rounded-xl border border-slate-800 bg-[#0B0E14]/90 px-3.5 py-3 text-sm leading-relaxed text-slate-100 placeholder:text-slate-500 focus:border-[#E5A93C] focus:outline-none disabled:opacity-60"
        />
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {MOTION_CUES.map((cue) => (
            <button
              key={cue.label}
              type="button"
              disabled={isGenerating}
              onClick={() => appendMotionCue(cue.text)}
              className="rounded-md border border-slate-800 bg-[#181F2C] px-2.5 py-1 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 hover:text-slate-100 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              + {cue.label}
            </button>
          ))}
        </div>
      </div>

      {/* Aspect Ratio */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-100">Aspect Ratio</span>
          <span className="text-xs text-slate-400">Landscape or Portrait</span>
        </div>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#0B0E14] p-1.5 border border-slate-800/80">
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => onAspectRatioChange('16:9')}
            className={`flex min-h-[42px] items-center justify-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              aspectRatio === '16:9'
                ? 'bg-[#1D2534] text-[#FDE68A] ring-1 ring-[#E5A93C]/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span
              className={`inline-block h-3 w-5 rounded-[2px] border ${
                aspectRatio === '16:9' ? 'border-[#E5A93C]' : 'border-slate-500'
              }`}
              aria-hidden="true"
            />
            16:9 Landscape
          </button>
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => onAspectRatioChange('9:16')}
            className={`flex min-h-[42px] items-center justify-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              aspectRatio === '9:16'
                ? 'bg-[#1D2534] text-[#FDE68A] ring-1 ring-[#E5A93C]/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-2.5 rounded-[2px] border ${
                aspectRatio === '9:16' ? 'border-[#E5A93C]' : 'border-slate-500'
              }`}
              aria-hidden="true"
            />
            9:16 Portrait
          </button>
        </div>
      </div>

      {/* Duration & Resolution */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="mb-2 block text-xs font-medium text-slate-400">Duration</span>
          <div className="grid grid-cols-3 gap-1 rounded-lg border border-slate-800/80 bg-[#0B0E14] p-1">
            {(['5s', '10s', '15s'] as VideoDuration[]).map((val) => (
              <button
                key={val}
                type="button"
                disabled={isGenerating}
                onClick={() => onDurationChange(val)}
                className={`min-h-[34px] rounded-md px-2 py-1 font-mono text-xs font-medium tabular-nums transition-colors cursor-pointer ${
                  duration === val
                    ? 'bg-[#1D2534] text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-2 block text-xs font-medium text-slate-400">Resolution</span>
          <div className="grid grid-cols-3 gap-1 rounded-lg border border-slate-800/80 bg-[#0B0E14] p-1">
            {(['360p', '720p', '1080p'] as VideoResolution[]).map((val) => (
              <button
                key={val}
                type="button"
                disabled={isGenerating}
                onClick={() => onResolutionChange(val)}
                className={`min-h-[34px] rounded-md px-2 py-1 font-mono text-xs font-medium tabular-nums transition-colors cursor-pointer ${
                  resolution === val
                    ? 'bg-[#1D2534] text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generate Action */}
      <button
        type="button"
        onClick={onGenerate}
        disabled={isGenerating || !sourceFrame || !prompt.trim()}
        className="mt-1 inline-flex min-h-[46px] w-full items-center justify-center gap-2.5 rounded-xl bg-[#E5A93C] px-5 py-3 text-sm font-semibold text-[#0B0E14] transition-colors hover:bg-[#F0B850] disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E5A93C]"
      >
        <Film className="h-4 w-4" aria-hidden="true" />
        {isGenerating
          ? `Generating Video (${elapsedSeconds}s)`
          : 'Generate Video'}
      </button>
    </aside>
  );
}
