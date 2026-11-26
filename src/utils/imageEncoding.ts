export interface EncodedImageResult {
  base64: string;
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  width: number;
  height: number;
  previewUrl: string;
}

const MAX_DIMENSION = 1920;

function normalizeMime(mime: string): 'image/png' | 'image/jpeg' | 'image/webp' {
  if (mime === 'image/png') return 'image/png';
  if (mime === 'image/webp') return 'image/webp';
  return 'image/jpeg';
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode image dimensions.'));
    img.src = src;
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Could not read image data.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(blob);
  });
}

export async function encodeImageFromFile(file: File): Promise<EncodedImageResult> {
  const mimeType = normalizeMime(file.type);
  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await loadImageElement(objectUrl);
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;

    const needsResize = width > MAX_DIMENSION || height > MAX_DIMENSION || file.size > 6 * 1024 * 1024;
    if (!needsResize) {
      const dataUrl = await blobToDataUrl(file);
      const base64 = dataUrl.split(',')[1] || '';
      return {
        base64,
        mimeType,
        width,
        height,
        previewUrl: dataUrl,
      };
    }

    const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context unavailable.');
    }
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const outMime = mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
    const dataUrl = canvas.toDataURL(outMime, 0.92);
    const base64 = dataUrl.split(',')[1] || '';

    return {
      base64,
      mimeType: outMime,
      width: targetW,
      height: targetH,
      previewUrl: dataUrl,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function encodeImageFromUrl(url: string): Promise<EncodedImageResult> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to load reference image (${response.status}).`);
  }
  const blob = await response.blob();
  const mimeType = normalizeMime(blob.type);
  const dataUrl = await blobToDataUrl(blob);
  const img = await loadImageElement(dataUrl);
  const base64 = dataUrl.split(',')[1] || '';

  return {
    base64,
    mimeType,
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height,
    previewUrl: dataUrl,
  };
}
