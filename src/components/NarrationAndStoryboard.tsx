import { useEffect, useState } from 'react';
import { Check, Copy, RotateCcw, Square, Volume2 } from 'lucide-react';

interface NarrationAndStoryboardProps {
  narration: string;
  onNarrationChange: (value: string) => void;
  onRestoreSceneDefaults: () => void;
}

const SHOT_CUES = [
  {
    label: 'Visual Style',
    value: '2D Indian devotional cartoon style, bold clean outlines, cool twilight tones',
  },
  {
    label: 'Character Action',
    value: 'Peaceful ascetics walking slowly along a quiet forest path, humble and sorrowful, gathering wild roots and leaves',
  },
  {
    label: 'Atmosphere & Motion',
    value: 'Soft wind rustling through the forest canopy, subtle drifting leaves',
  },
  {
    label: 'Camera Direction',
    value: 'Slow lateral tracking shot, unobstructed frame with no embedded text',
  },
];

export function NarrationAndStoryboard({
  narration,
  onNarrationChange,
  onRestoreSceneDefaults,
}: NarrationAndStoryboardProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const speechSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    return () => {
      if (speechSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [speechSupported]);

  const handleToggleSpeech = () => {
    if (!speechSupported || !narration.trim()) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(narration);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find((v) => v.lang.toLowerCase().startsWith('hi')) ||
      voices.find((v) => v.lang.toLowerCase() === 'en-in') ||
      voices[0];
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    utterance.rate = 0.88;
    utterance.pitch = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = async () => {
    if (!narration.trim()) return;
    try {
      await navigator.clipboard.writeText(narration);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access may be blocked in restricted contexts.
    }
  };

  return (
    <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* Narrator Voiceover */}
      <div
        id="narration"
        className="flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-[#121720] p-6 lg:col-span-6"
      >
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-medium text-slate-100">
                Narrator Voiceover Script
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Previewed as optional subtitle scrim in the screening stage
              </p>
            </div>
            <div className="flex items-center gap-2">
              {speechSupported && (
                <button
                  type="button"
                  onClick={handleToggleSpeech}
                  disabled={!narration.trim()}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0B0E14] px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-slate-700 hover:text-white disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isSpeaking ? (
                    <>
                      <Square className="h-3 w-3 text-[#E5A93C]" aria-hidden="true" />
                      Stop Audition
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-3.5 w-3.5 text-[#E5A93C]" aria-hidden="true" />
                      Audition Timing
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={handleCopy}
                disabled={!narration.trim()}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0B0E14] px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-slate-700 hover:text-white disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    Copy Line
                  </>
                )}
              </button>
            </div>
          </div>

          <label htmlFor="narrator-vo" className="sr-only">
            Narrator voiceover text
          </label>
          <textarea
            id="narrator-vo"
            rows={4}
            value={narration}
            onChange={(e) => onNarrationChange(e.target.value)}
            placeholder="Enter narrator voiceover lines to preview as scene subtitles..."
            className="mt-2 w-full resize-y rounded-xl border border-slate-800 bg-[#0B0E14]/90 px-4 py-3.5 text-sm leading-relaxed text-slate-100 placeholder:text-slate-500 focus:border-[#E5A93C] focus:outline-none"
          />
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Note: Narrator lines stay out of the generated video frame so the visual shot remains clean and text-free.
        </p>
      </div>

      {/* Storyboard Cue Sheet */}
      <div
        id="storyboard"
        className="rounded-2xl border border-slate-800/80 bg-[#121720] p-6 lg:col-span-6"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-medium text-slate-100">
              Scene Direction Sheet
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Baseline shot specifications for twilight forest sequence
            </p>
          </div>
          <button
            type="button"
            onClick={onRestoreSceneDefaults}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0B0E14] px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 hover:text-slate-100 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Restore Default Prompt
          </button>
        </div>

        <dl className="divide-y divide-slate-800/75">
          {SHOT_CUES.map((item) => (
            <div
              key={item.label}
              className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4"
            >
              <dt className="text-xs font-medium text-slate-400">{item.label}</dt>
              <dd className="text-sm leading-relaxed text-slate-200 sm:col-span-2">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
