import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { TopBar } from './components/TopBar';
import { ControlPanel } from './components/ControlPanel';
import { ScreeningStage } from './components/ScreeningStage';
import { NarrationAndStoryboard } from './components/NarrationAndStoryboard';
import { ReelStrip } from './components/ReelStrip';
import { encodeImageFromFile, encodeImageFromUrl } from './utils/imageEncoding';
import type {
  AspectRatio,
  GeneratedClip,
  SourceFrame,
  VideoDuration,
  VideoResolution,
} from './types/studio';

const DEFAULT_ASSET_PATH =
  '/assets/aistudio/Ascetics_walking_along_forest_path_86b8182c_77219834.jpg';

const DEFAULT_PROMPT =
  '2D Indian devotional cartoon style, bold clean outlines, cool twilight tones. Peaceful ascetics walking slowly along a quiet forest path, looking humble and sorrowful, gathering wild roots and leaves, soft wind in trees, slow tracking shot, no text.';

const DEFAULT_NARRATION =
  'Sharap aur ghalat prachar ke baad bahishkar hua; math aur shastron se door reh kar log kand-mool aur patton par guzara karne lage.';

export default function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const encodedBase64Ref = useRef<string>('');

  const [sourceFrame, setSourceFrame] = useState<SourceFrame | null>(null);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [narration, setNarration] = useState(DEFAULT_NARRATION);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [duration, setDuration] = useState<VideoDuration>('10s');
  const [resolution, setResolution] = useState<VideoResolution>('720p');
  const [showSubtitles, setShowSubtitles] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [clips, setClips] = useState<GeneratedClip[]>([]);
  const [activeClip, setActiveClip] = useState<GeneratedClip | null>(null);

  const loadDefaultFrame = useCallback(async () => {
    try {
      const encoded = await encodeImageFromUrl(DEFAULT_ASSET_PATH);
      encodedBase64Ref.current = encoded.base64;
      setSourceFrame({
        id: 'default-ascetics-frame',
        name: 'Ascetics_walking_along_forest_path.jpg',
        previewUrl: DEFAULT_ASSET_PATH,
        mimeType: encoded.mimeType,
        width: encoded.width,
        height: encoded.height,
        isDefaultAsset: true,
      });
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Could not load the sample reference frame.'
      );
    }
  }, []);

  useEffect(() => {
    void loadDefaultFrame();
  }, [loadDefaultFrame]);

  useEffect(() => {
    if (!isGenerating) {
      setElapsedSeconds(0);
      return;
    }
    const timer = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isGenerating]);

  const handleProcessFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid PNG, JPEG, or WebP image file.');
      return;
    }
    try {
      const encoded = await encodeImageFromFile(file);
      encodedBase64Ref.current = encoded.base64;
      setSourceFrame({
        id: `${file.name}-${Date.now()}`,
        name: file.name,
        previewUrl: encoded.previewUrl,
        mimeType: encoded.mimeType,
        width: encoded.width,
        height: encoded.height,
        isDefaultAsset: false,
      });
      setActiveClip(null);
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to read the uploaded photo.'
      );
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleProcessFile(file);
    }
    e.target.value = '';
  };

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  const runVideoGeneration = async (options?: {
    overridePrompt?: string;
    overrideDuration?: string;
    previousInteractionId?: string;
  }) => {
    const targetPrompt = (options?.overridePrompt ?? prompt).trim();
    if (!targetPrompt) {
      setErrorMessage('Enter a motion direction prompt before generating.');
      return;
    }

    if (!options?.previousInteractionId && (!sourceFrame || !encodedBase64Ref.current)) {
      setErrorMessage('Upload or select a reference photo before generating.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/videos/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: targetPrompt,
          aspectRatio: activeClip && options?.previousInteractionId ? activeClip.aspectRatio : aspectRatio,
          duration: options?.overrideDuration ?? duration,
          resolution: activeClip && options?.previousInteractionId ? activeClip.resolution : resolution,
          ...(options?.previousInteractionId
            ? { previousInteractionId: options.previousInteractionId }
            : {
                imageBase64: encodedBase64Ref.current,
                mimeType: sourceFrame?.mimeType,
              }),
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        clipId?: string;
        interactionId?: string;
        videoUrl?: string;
        mimeType?: string;
        aspectRatio?: AspectRatio;
        duration?: string;
        resolution?: VideoResolution;
      };

      if (!response.ok || !payload.videoUrl || !payload.clipId || !payload.interactionId) {
        throw new Error(
          payload.error || `Video generation request failed (${response.status}).`
        );
      }

      const newClip: GeneratedClip = {
        clipId: payload.clipId,
        interactionId: payload.interactionId,
        videoUrl: payload.videoUrl,
        mimeType: payload.mimeType || 'video/mp4',
        aspectRatio: payload.aspectRatio || aspectRatio,
        duration: payload.duration || options?.overrideDuration || duration,
        resolution: payload.resolution || resolution,
        prompt: targetPrompt,
        narration,
        sourceName: sourceFrame?.name || 'Reference Frame',
        sourcePreviewUrl: sourceFrame?.previewUrl || DEFAULT_ASSET_PATH,
        createdAt: new Date().toISOString(),
        parentInteractionId: options?.previousInteractionId,
      };

      setClips((prev) => [newClip, ...prev]);
      setActiveClip(newClip);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while generating the video.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileInputChange}
        className="sr-only"
        aria-label="Upload photo to animate"
      />

      <TopBar onUploadClick={triggerFilePicker} />

      <main className="mx-auto flex max-w-[1360px] flex-col gap-10 px-6 py-8 pb-16">
        {/* Editorial Intro */}
        <section id="studio" className="flex flex-col gap-2">
          <p className="text-xs font-medium tracking-wide text-[#E5A93C]">
            Image-to-Motion Direction
          </p>
          <h1
            className="max-w-3xl font-display text-3xl font-medium tracking-tight text-slate-100 sm:text-4xl"
            style={{ textWrap: 'balance' }}
          >
            Animate devotional storyboards into slow twilight cinema
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-400">
            Upload any reference illustration or photograph, choose 16:9 landscape or 9:16 portrait framing, and direct subtle motion, atmosphere, and camera tracking.
          </p>
        </section>

        {/* Primary 2-Column Studio Stage */}
        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5 xl:col-span-4">
            <ControlPanel
              sourceFrame={sourceFrame}
              prompt={prompt}
              aspectRatio={aspectRatio}
              duration={duration}
              resolution={resolution}
              isGenerating={isGenerating}
              elapsedSeconds={elapsedSeconds}
              onPromptChange={setPrompt}
              onAspectRatioChange={setAspectRatio}
              onDurationChange={setDuration}
              onResolutionChange={setResolution}
              onTriggerFilePicker={triggerFilePicker}
              onFileDrop={(file) => void handleProcessFile(file)}
              onResetDefaultFrame={() => {
                void loadDefaultFrame();
                setActiveClip(null);
              }}
              onGenerate={() => void runVideoGeneration()}
            />
          </div>

          <div className="lg:col-span-7 xl:col-span-8 flex">
            <div className="flex-1 flex flex-col">
              <ScreeningStage
                sourceFrame={sourceFrame}
                activeClip={activeClip}
                aspectRatio={aspectRatio}
                duration={duration}
                resolution={resolution}
                narration={narration}
                showSubtitles={showSubtitles}
                isGenerating={isGenerating}
                elapsedSeconds={elapsedSeconds}
                errorMessage={errorMessage}
                onToggleSubtitles={() => setShowSubtitles((prev) => !prev)}
                onClearError={() => setErrorMessage(null)}
                onRetry={() => void runVideoGeneration()}
                onExtendClip={(followUpPrompt, extDuration) =>
                  void runVideoGeneration({
                    overridePrompt: followUpPrompt,
                    overrideDuration: extDuration,
                    previousInteractionId: activeClip?.interactionId,
                  })
                }
                onReturnToSourcePreview={() => setActiveClip(null)}
              />
            </div>
          </div>
        </div>

        {/* Lower Editorial Sections */}
        <NarrationAndStoryboard
          narration={narration}
          onNarrationChange={setNarration}
          onRestoreSceneDefaults={() => {
            setPrompt(DEFAULT_PROMPT);
            setNarration(DEFAULT_NARRATION);
          }}
        />

        <ReelStrip
          clips={clips}
          activeClipId={activeClip?.clipId ?? null}
          onSelectClip={(clip) => {
            setActiveClip(clip);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </main>
    </div>
  );
}
