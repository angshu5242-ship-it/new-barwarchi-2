export function formatBytes(bytes) {
  if (!bytes || bytes < 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Rough size of a base64 data URL in bytes. */
export function dataUrlBytes(dataUrl = '') {
  const base64 = String(dataUrl).split(',')[1] || '';
  return Math.round((base64.length * 3) / 4);
}

export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read that image.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('That file does not look like a valid image.'));
    image.src = src;
  });
}

/**
 * Resize and compress a photo in the browser before it is stored.
 * Keeps localStorage usage sane even when the owner uploads phone photos.
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1100,
    maxHeight = 1100,
    quality = 0.78,
    mimeType = 'image/jpeg',
  } = options;

  if (!file?.type?.startsWith('image/')) {
    throw new Error('Please choose an image file (JPG, PNG or WebP).');
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new Error('That photo is larger than 20 MB. Please choose a smaller one.');
  }

  const originalDataUrl = await readFileAsDataURL(file);
  const image = await loadImage(originalDataUrl);

  const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Your browser could not process this image.');

  // Food photos almost always look better on a white base than a black one.
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, width, height);

  const compressed = canvas.toDataURL(mimeType, quality);
  const originalIsSmaller = originalDataUrl.length < compressed.length && file.type === mimeType;

  return {
    dataUrl: originalIsSmaller ? originalDataUrl : compressed,
    width,
    height,
    originalBytes: dataUrlBytes(originalDataUrl),
    bytes: dataUrlBytes(originalIsSmaller ? originalDataUrl : compressed),
  };
}

export function extractImageFromClipboard(event) {
  const items = event?.clipboardData?.items;
  if (!items) return null;
  for (const item of items) {
    if (item.type?.startsWith('image/')) {
      return item.getAsFile();
    }
  }
  return null;
}

export function isHttpUrl(value = '') {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
