import { Download, Film, Play } from 'lucide-react';
import type { GeneratedClip } from '../types/studio';

interface ReelStripProps {
  clips: GeneratedClip[];
  activeClipId: string | null;
  onSelectClip: (clip: GeneratedClip) => void;
}

export function ReelStrip({ clips, activeClipId, onSelectClip }: ReelStripProps) {
  return (
    <section
      id="reel"
      className="rounded-2xl border border-slate-800/80 bg-[#121720] p-6"
    >
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-4 border-b border-slate-800/75 pb-4">
        <div>
          <h2 className="font-display text-lg font-medium text-slate-100">
            Session Motion Reel
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Rendered 16:9 and 9:16 takes from this studio session
          </p>
        </div>
        <span className="font-mono text-xs text-slate-400 tabular-nums">
          {clips.length} {clips.length === 1 ? 'clip' : 'clips'}
        </span>
      </div>

      {clips.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-[#0B0E14]/50 px-6 py-12 text-center">
          <Film className="h-7 w-7 text-slate-500" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-slate-200">
            No generated takes yet
          </p>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-400">
            Select 16:9 Landscape or 9:16 Portrait in the director console above and click Generate Video to render your first animated shot.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {clips.map((clip) => {
            const isActive = clip.clipId === activeClipId;
            return (
              <article
                key={clip.clipId}
                className={`flex flex-col overflow-hidden rounded-xl border transition-colors ${
                  isActive
                    ? 'border-[#E5A93C]/70 bg-[#161D2A]'
                    : 'border-slate-800 bg-[#0B0E14]/70 hover:border-slate-700'
                }`}
              >
                <div className="relative aspect-video w-full overflow-hidden bg-black">
                  <video
                    src={clip.videoUrl}
                    muted
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => onSelectClip(clip)}
                    aria-label={`Play clip ${clip.sourceName}`}
                    className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100 cursor-pointer"
                  >
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#E5A93C] text-[#0B0E14] shadow-md">
                      <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                    </span>
                  </button>
                </div>

                <div className="flex flex-1 flex-col justify-between gap-3 p-4">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate text-sm font-medium text-slate-100">
                        {clip.sourceName}
                      </h3>
                      <span className="font-mono text-xs text-slate-400 tabular-nums shrink-0">
                        {clip.aspectRatio}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400">
                      {clip.prompt}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-800/75 pt-3">
                    <span className="font-mono text-xs text-slate-500 tabular-nums">
                      {clip.duration} · {clip.resolution}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => onSelectClip(clip)}
                        className="text-xs font-semibold text-[#E5A93C] transition-colors hover:text-[#F0B850] cursor-pointer"
                      >
                        {isActive ? 'Screening' : 'Load'}
                      </button>
                      <a
                        href={clip.videoUrl}
                        download={`kathamotion-${clip.clipId.slice(0, 8)}.mp4`}
                        aria-label={`Download ${clip.sourceName} MP4`}
                        className="text-slate-400 transition-colors hover:text-slate-100"
                      >
                        <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
