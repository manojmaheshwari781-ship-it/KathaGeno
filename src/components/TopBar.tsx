import { Upload } from 'lucide-react';

interface TopBarProps {
  onUploadClick: () => void;
}

export function TopBar({ onUploadClick }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/75 bg-[#0B0E14]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-8 px-6 py-4">
        <a
          href="#studio"
          className="font-display text-xl font-semibold tracking-tight text-slate-100 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E5A93C]"
        >
          KathaMotion
        </a>

        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400"
        >
          <a
            href="#studio"
            className="whitespace-nowrap shrink-0 transition-colors hover:text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E5A93C]"
          >
            Studio
          </a>
          <a
            href="#narration"
            className="whitespace-nowrap shrink-0 transition-colors hover:text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E5A93C]"
          >
            Narration
          </a>
          <a
            href="#storyboard"
            className="whitespace-nowrap shrink-0 transition-colors hover:text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E5A93C]"
          >
            Storyboard
          </a>
          <a
            href="#reel"
            className="whitespace-nowrap shrink-0 transition-colors hover:text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E5A93C]"
          >
            Reel
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onUploadClick}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-[#E5A93C] px-4 py-2 text-xs font-semibold text-[#0B0E14] transition-colors hover:bg-[#F0B850] active:scale-[0.99] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E5A93C]"
          >
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            Upload Photo
          </button>
        </div>
      </div>
    </header>
  );
}
