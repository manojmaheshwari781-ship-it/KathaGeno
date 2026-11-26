export type AspectRatio = '16:9' | '9:16';
export type VideoResolution = '360p' | '720p' | '1080p';
export type VideoDuration = '5s' | '10s' | '15s';

export interface SourceFrame {
  id: string;
  name: string;
  previewUrl: string;
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  width: number;
  height: number;
  isDefaultAsset: boolean;
}

export interface GeneratedClip {
  clipId: string;
  interactionId: string;
  videoUrl: string;
  mimeType: string;
  aspectRatio: AspectRatio;
  duration: string;
  resolution: VideoResolution;
  prompt: string;
  narration: string;
  sourceName: string;
  sourcePreviewUrl: string;
  createdAt: string;
  parentInteractionId?: string;
}
