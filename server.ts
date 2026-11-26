import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const MODEL_ID = 'gemini-omni-1.2-flash';

interface StoredClip {
  buffer: Buffer;
  mimeType: string;
  createdAt: number;
}

const MAX_STORED_CLIPS = 20;
const clipStore = new Map<string, StoredClip>();

function storeClip(buffer: Buffer, mimeType: string): string {
  if (clipStore.size >= MAX_STORED_CLIPS) {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    for (const [key, value] of clipStore.entries()) {
      if (value.createdAt < oldestTime) {
        oldestTime = value.createdAt;
        oldestKey = key;
      }
    }
    if (oldestKey) {
      clipStore.delete(oldestKey);
    }
  }

  const clipId = crypto.randomUUID();
  clipStore.set(clipId, {
    buffer,
    mimeType,
    createdAt: Date.now(),
  });
  return clipId;
}

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    const err = new Error(
      'GEMINI_API_KEY is not configured. Add a valid key in Settings > Secrets to generate videos.'
    ) as Error & { status?: number };
    err.status = 500;
    throw err;
  }
  return new GoogleGenAI({ apiKey });
}

interface GenerateVideoBody {
  prompt?: string;
  imageBase64?: string;
  mimeType?: string;
  aspectRatio?: '16:9' | '9:16';
  duration?: string;
  resolution?: '360p' | '720p' | '1080p';
  previousInteractionId?: string;
}

const ALLOWED_IMAGE_MIMES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const ALLOWED_ASPECT_RATIOS = new Set(['16:9', '9:16']);
const ALLOWED_RESOLUTIONS = new Set(['360p', '720p', '1080p']);

function normalizeDuration(raw: string | undefined, isFollowUp: boolean): string {
  if (!raw) return '10s';
  const match = /^(\d{1,2})s$/.exec(raw.trim());
  if (!match) return '10s';
  const sec = Number(match[1]);
  if (isFollowUp) {
    const clamped = Math.min(10, Math.max(3, sec));
    return `${clamped}s`;
  }
  const clamped = Math.min(15, Math.max(3, sec));
  return `${clamped}s`;
}

function extractApiError(error: unknown): { status: number; message: string } {
  const errObj = error as {
    status?: number;
    statusCode?: number;
    code?: string | number;
    message?: string;
    error?: { code?: number; message?: string; status?: string };
  };

  const rawMessage =
    errObj?.error?.message ||
    errObj?.message ||
    'Video generation failed due to an unexpected server error.';

  const statusFromErr =
    typeof errObj?.status === 'number'
      ? errObj.status
      : typeof errObj?.statusCode === 'number'
        ? errObj.statusCode
        : typeof errObj?.error?.code === 'number'
          ? errObj.error.code
          : 500;

  if (
    statusFromErr === 429 ||
    rawMessage.includes('RESOURCE_EXHAUSTED') ||
    rawMessage.includes('quota')
  ) {
    return {
      status: 429,
      message:
        'Quota exhausted or paid-tier access required for gemini-omni-1.2-flash. Select a billing-enabled API key in Settings > Secrets and try again.',
    };
  }

  if (
    statusFromErr === 403 ||
    rawMessage.includes('PERMISSION_DENIED') ||
    rawMessage.includes('API_KEY_INVALID')
  ) {
    return {
      status: statusFromErr === 403 ? 403 : 400,
      message:
        'The configured GEMINI_API_KEY was rejected or lacks permission for gemini-omni-1.2-flash. Check your key in Settings > Secrets.',
    };
  }

  if (statusFromErr >= 400 && statusFromErr < 600) {
    return { status: statusFromErr, message: rawMessage };
  }

  return { status: 500, message: rawMessage };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  app.post('/api/videos/generate', async (req: Request, res: Response) => {
    try {
      const body = (req.body || {}) as GenerateVideoBody;
      const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
      const previousInteractionId =
        typeof body.previousInteractionId === 'string' && body.previousInteractionId.trim()
          ? body.previousInteractionId.trim()
          : undefined;

      if (!prompt) {
        res.status(400).json({ error: 'A motion direction prompt is required.' });
        return;
      }

      const aspectRatio = ALLOWED_ASPECT_RATIOS.has(body.aspectRatio || '')
        ? (body.aspectRatio as '16:9' | '9:16')
        : '16:9';
      const resolution = ALLOWED_RESOLUTIONS.has(body.resolution || '')
        ? (body.resolution as '360p' | '720p' | '1080p')
        : '720p';
      const duration = normalizeDuration(body.duration, Boolean(previousInteractionId));

      const hasImage = Boolean(body.imageBase64 && body.mimeType);
      if (!hasImage && !previousInteractionId) {
        res.status(400).json({
          error: 'Upload or select a reference photo before generating a video.',
        });
        return;
      }

      if (hasImage && !ALLOWED_IMAGE_MIMES.has(body.mimeType || '')) {
        res.status(400).json({
          error: 'Unsupported image format. Please upload a PNG, JPEG, or WebP photo.',
        });
        return;
      }

      const ai = getAiClient();

      type InputContent =
        | { type: 'image'; mime_type: string; data: string }
        | { type: 'text'; text: string };

      const inputParts: InputContent[] = [];
      if (hasImage && body.imageBase64 && body.mimeType) {
        const cleanBase64 = body.imageBase64.replace(/^data:[^;]+;base64,/, '');
        inputParts.push({
          type: 'image',
          mime_type: body.mimeType,
          data: cleanBase64,
        });
      }
      inputParts.push({
        type: 'text',
        text: prompt,
      });

      const interaction = await ai.interactions.create(
        {
          model: MODEL_ID,
          ...(previousInteractionId ? { previous_interaction_id: previousInteractionId } : {}),
          input: inputParts,
          background: false,
          store: true,
          stream: false,
          response_format: {
            type: 'video',
            aspect_ratio: aspectRatio,
            duration,
            resolution,
          },
        },
        { timeout: 300000 }
      );

      let videoData: string | undefined = interaction.output_video?.data;
      let videoUri: string | undefined = interaction.output_video?.uri;
      let videoMime = interaction.output_video?.mime_type || 'video/mp4';

      if (!videoData && !videoUri && Array.isArray(interaction.steps)) {
        for (const step of interaction.steps) {
          if (step.type === 'model_output' && Array.isArray(step.content)) {
            const found = step.content.find((c) => c.type === 'video');
            if (found && found.type === 'video') {
              videoData = found.data;
              videoUri = found.uri;
              videoMime = found.mime_type || videoMime;
            }
          }
        }
      }

      let videoBuffer: Buffer | null = null;
      if (videoData) {
        videoBuffer = Buffer.from(videoData, 'base64');
      } else if (videoUri) {
        const apiKey = process.env.GEMINI_API_KEY?.trim() || '';
        const upstream = await fetch(videoUri, {
          headers: apiKey ? { 'x-goog-api-key': apiKey } : undefined,
        });
        if (!upstream.ok) {
          throw new Error(`Failed to fetch generated video stream (${upstream.status}).`);
        }
        const arrayBuf = await upstream.arrayBuffer();
        videoBuffer = Buffer.from(arrayBuf);
      }

      if (!videoBuffer || videoBuffer.length === 0) {
        res.status(502).json({
          error: 'The model completed the interaction without returning video frames.',
        });
        return;
      }

      const clipId = storeClip(videoBuffer, videoMime);

      res.json({
        clipId,
        interactionId: interaction.id,
        videoUrl: `/api/videos/clip/${clipId}`,
        mimeType: videoMime,
        aspectRatio,
        duration,
        resolution,
      });
    } catch (error) {
      const { status, message } = extractApiError(error);
      res.status(status).json({ error: message });
    }
  });

  app.get('/api/videos/clip/:clipId', (req: Request, res: Response) => {
    const clipIdParam = req.params.clipId;
    const clipId = Array.isArray(clipIdParam) ? clipIdParam[0] : clipIdParam;
    const clip = clipId ? clipStore.get(clipId) : undefined;
    if (!clip) {
      res.status(404).json({ error: 'Generated video clip not found or expired.' });
      return;
    }

    const total = clip.buffer.length;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = Number.parseInt(parts[0] || '0', 10);
      const end = parts[1] ? Number.parseInt(parts[1], 10) : total - 1;
      if (Number.isNaN(start) || Number.isNaN(end) || start >= total || end >= total || start > end) {
        res.status(416).set('Content-Range', `bytes */${total}`).end();
        return;
      }
      const chunkSize = end - start + 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${total}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': clip.mimeType,
      });
      res.end(clip.buffer.subarray(start, end + 1));
      return;
    }

    res.writeHead(200, {
      'Content-Length': total,
      'Content-Type': clip.mimeType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, max-age=3600',
    });
    res.end(clip.buffer);
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      const indexPath = path.join(distDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KathaMotion server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
