import { useEffect, useRef, useState } from 'react';
import {
  compressImage,
  dataUrlBytes,
  extractImageFromClipboard,
  formatBytes,
  isHttpUrl,
} from '../utils/image';

export default function ImagePicker({
  open,
  value = '',
  title = 'Choose a photo',
  hint = 'JPG, PNG or WebP · resized automatically for the web',
  aspect = '4 / 3',
  maxWidth = 1100,
  maxHeight = 1100,
  quality = 0.78,
  onClose,
  onSave,
}) {
  const [preview, setPreview] = useState(value || '');
  const [urlInput, setUrlInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [size, setSize] = useState(value ? dataUrlBytes(value) : 0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setPreview(value || '');
    setUrlInput('');
    setError('');
    setBusy(false);
    setDragOver(false);
    setSize(value ? dataUrlBytes(value) : 0);
  }, [open, value]);

  const processFile = async (file) => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const result = await compressImage(file, { maxWidth, maxHeight, quality });
      setPreview(result.dataUrl);
      setSize(result.bytes);
    } catch (err) {
      setError(err.message || 'Could not process that image.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!open) return undefined;

    const handlePaste = (event) => {
      const file = extractImageFromClipboard(event);
      if (file) {
        event.preventDefault();
        processFile(file);
      }
    };
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('paste', handlePaste);
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('paste', handlePaste);
      window.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const applyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!isHttpUrl(trimmed) && !trimmed.startsWith('data:image/')) {
      setError('Paste a full image URL starting with http:// or https://');
      return;
    }
    setPreview(trimmed);
    setSize(dataUrlBytes(trimmed));
    setError('');
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-stone-950/60 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-picker-title"
      onClick={onClose}
    >
      <div
        className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-strong sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-surface-200 p-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-700">Photo studio</p>
            <h2 id="image-picker-title" className="mt-1 font-display text-xl font-semibold text-gray-900">
              {title}
            </h2>
            <p className="mt-1 text-xs text-gray-500">{hint}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 hover:bg-surface-100 hover:text-gray-800"
            aria-label="Close photo picker"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div
            className={`relative overflow-hidden rounded-2xl border-2 border-dashed bg-surface-50 transition-colors ${
              dragOver ? 'border-brand-500 bg-brand-50' : 'border-surface-300'
            }`}
            style={{ aspectRatio: aspect }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragOver(false);
              processFile(event.dataTransfer.files?.[0]);
            }}
          >
            {preview ? (
              <img src={preview} alt="Selected food" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                <span className="text-5xl" aria-hidden="true">📷</span>
                <p className="mt-3 font-semibold text-gray-800">Drop a photo here</p>
                <p className="mt-1 text-xs text-gray-500">or click below to choose a file</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-stone-950/55 via-transparent to-transparent p-4 opacity-0 transition-opacity hover:opacity-100 focus:opacity-100"
              aria-label="Choose a photo file"
            >
              <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-gray-900 shadow-sm">
                Click to browse · or paste Ctrl+V
              </span>
            </button>

            {busy && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                <p className="mt-2 text-xs font-semibold text-gray-700">Optimising photo…</p>
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="btn-primary py-3 text-sm"
              disabled={busy}
            >
              Choose photo
            </button>
            <p className="text-xs text-gray-500">
              The image is resized to {maxWidth}px and compressed before saving, so the site stays fast.
              {size > 0 && <span className="ml-1 font-semibold text-gray-700">Approx. {formatBytes(size)}</span>}
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                processFile(event.target.files?.[0]);
                event.target.value = '';
              }}
            />
          </div>

          <div>
            <label htmlFor="image-url" className="label">Or paste an image URL</label>
            <div className="flex gap-2">
              <input
                id="image-url"
                type="url"
                value={urlInput}
                onChange={(event) => setUrlInput(event.target.value)}
                placeholder="https://example.com/biryani.jpg"
                className="input-field py-2.5 text-sm"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    applyUrl();
                  }
                }}
              />
              <button type="button" onClick={applyUrl} className="btn-secondary px-4 py-2 text-sm">
                Use URL
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>
          )}

          <p className="rounded-xl bg-brand-50 px-4 py-3 text-xs leading-relaxed text-brand-900">
            <strong>Tip:</strong> Use a landscape photo for menu cards and gallery tiles. You can
            copy a photo from WhatsApp Web or Google Images and press <kbd className="rounded border border-brand-200 bg-white px-1">Ctrl</kbd> + <kbd className="rounded border border-brand-200 bg-white px-1">V</kbd> here.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-surface-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => {
              setPreview('');
              setSize(0);
            }}
            className="text-sm font-semibold text-rose-600 hover:text-rose-700"
          >
            Remove photo
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1 py-2.5 text-sm sm:flex-none">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onSave(preview);
                onClose();
              }}
              className="btn-primary flex-1 py-2.5 text-sm sm:flex-none"
              disabled={busy}
            >
              Use this photo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
