import { useState } from 'react';
import {
  defaultMenuStyle,
  menuStylePresets,
  menuStyleVars,
  sanitizeMenuStyle,
} from '../data/menuStyles';
import { generateMenuStyle } from '../utils/siteApi';

const PROMPT_IDEAS = [
  'Festive Puja marigold and deep red',
  'Clean modern cafe look',
  'Soft blush and gold for celebrations',
  'Fresh coastal blue and white',
];

const RADIUS_LABELS = {
  soft: 'Soft',
  rounded: 'Rounded',
  sharp: 'Sharp',
};

function Swatches({ style }) {
  return (
    <span className="flex items-center gap-1" aria-hidden="true">
      {[style.accent, style.accentSoft, style.bg, style.border].map((color, index) => (
        <span
          key={`${style.id}-${index}`}
          className="h-4 w-4 rounded-full border border-black/10"
          style={{ backgroundColor: color }}
        />
      ))}
    </span>
  );
}

function PreviewCard({ style, dish }) {
  const isList = style.layout === 'list';
  const radius =
    style.radius === 'sharp' ? '0.5rem' : style.radius === 'soft' ? '1rem' : '1.5rem';

  return (
    <article
      className={`overflow-hidden border shadow-sm ${isList ? 'flex flex-row' : 'flex flex-col'}`}
      style={{ backgroundColor: style.card, borderColor: style.border, borderRadius: radius }}
    >
      <div
        className={`flex items-center justify-center text-2xl ${isList ? 'w-2/5' : 'aspect-[4/3]'}`}
        style={{ backgroundColor: style.accentSoft }}
        aria-hidden="true"
      >
        {dish.emoji}
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-3">
        <p className="truncate text-sm font-semibold" style={{ color: style.ink }}>
          {dish.name}
        </p>
        <p className="mt-0.5 text-[11px]" style={{ color: style.muted }}>
          {dish.note}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="text-sm font-bold" style={{ color: style.accentDark }}>
            {dish.price}
          </span>
          <span
            className="rounded-lg px-2.5 py-1 text-[10px] font-bold"
            style={{ backgroundColor: style.accent, color: style.onAccent }}
          >
            Add
          </span>
        </div>
      </div>
    </article>
  );
}

export default function MenuStyleStudio({
  currentStyle,
  adminPassword,
  onApply,
  onNotice,
}) {
  const [preview, setPreview] = useState(currentStyle);
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [generatedBy, setGeneratedBy] = useState('');

  const choosePreset = (preset) => {
    setPreview(sanitizeMenuStyle(preset));
    setGeneratedBy('');
    setError('');
  };

  const changeOption = (key, value) => {
    setPreview((current) => sanitizeMenuStyle({ ...current, [key]: value }));
  };

  const handleGenerate = async (event) => {
    event.preventDefault();
    if (prompt.trim().length < 3 || generating) return;
    setGenerating(true);
    setError('');
    const result = await generateMenuStyle(prompt.trim(), preview, adminPassword);
    setGenerating(false);
    if (!result.ok) {
      setError(result.error || 'Could not create a theme with Gemini.');
      return;
    }
    setPreview(sanitizeMenuStyle(result.data?.style));
    setGeneratedBy(result.data?.model || 'Gemini');
    onNotice?.('success', 'Gemini created a new theme. Check the preview, then apply it.');
  };

  const handleApply = async () => {
    if (applying) return;
    setApplying(true);
    setError('');
    const result = await onApply(preview);
    setApplying(false);
    if (!result?.ok) {
      setError(result?.error || 'Could not save the theme.');
      return;
    }
    onNotice?.(
      'success',
      result.persisted
        ? 'Menu theme applied and saved for every visitor.'
        : 'Menu theme applied on this device. Add DATABASE_URL on the server to publish it for everyone.',
    );
  };

  const activePreset = menuStylePresets.find(
    (preset) => preview.preset === preset.id && preview.name === preset.name,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Appearance</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-gray-900">Menu style studio</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Pick a ready-made look or describe a mood and let Gemini design the colours. The style
            applies to the online menu, and is saved to Neon so every visitor sees it.
          </p>
        </div>
        <a href="/menu" target="_blank" rel="noopener noreferrer" className="btn-outline self-start py-2 text-sm sm:self-auto">
          Open live menu ↗
        </a>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-surface-200 bg-white p-4 shadow-soft sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-gray-900">Ready-made styles</h2>
                <p className="text-xs text-gray-500">Start with one of these, then tweak it or ask Gemini.</p>
              </div>
              <span className="rounded-full bg-surface-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Light themes only
              </span>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {menuStylePresets.map((preset) => {
                const selected = activePreset?.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => choosePreset(preset)}
                    className={`rounded-xl border-2 p-3 text-left transition-all ${
                      selected
                        ? 'border-brand-500 bg-brand-50 shadow-sm'
                        : 'border-surface-200 bg-white hover:border-brand-300'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-gray-900">{preset.name}</span>
                      {selected && <span className="text-xs font-bold text-brand-700">✓</span>}
                    </span>
                    <span className="mt-2 block">
                      <Swatches style={{ ...preset, id: preset.id }} />
                    </span>
                    <span className="mt-2 block text-[11px] leading-snug text-gray-500">{preset.description}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-accent-50 p-4 shadow-soft sm:p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm" aria-hidden="true">
                ✨
              </span>
              <div>
                <h2 className="font-semibold text-gray-900">Design it with Gemini</h2>
                <p className="mt-0.5 text-xs leading-relaxed text-gray-600">
                  Describe the colours or feeling you want. Gemini turns it into a safe, light menu
                  theme with readable text.
                </p>
              </div>
            </div>

            <form onSubmit={handleGenerate} className="mt-4">
              <label htmlFor="gemini-style-prompt" className="sr-only">
                Describe your menu style
              </label>
              <textarea
                id="gemini-style-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={3}
                maxLength={600}
                placeholder="e.g. Make it feel like a festive Puja pandal — marigold, deep red, warm cream, but keep it bright and easy to read."
                className="input-field resize-none text-sm"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {PROMPT_IDEAS.map((idea) => (
                  <button
                    key={idea}
                    type="button"
                    onClick={() => setPrompt(idea)}
                    className="rounded-full border border-brand-200 bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-brand-800 hover:bg-white"
                  >
                    {idea}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] text-gray-500">
                  {generatedBy ? `Last theme generated by ${generatedBy}.` : 'The Gemini key stays on the server.'}
                </p>
                <button
                  type="submit"
                  disabled={generating || prompt.trim().length < 3}
                  className="btn-primary px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {generating ? 'Designing…' : '✨ Generate theme'}
                </button>
              </div>
            </form>

            {error && (
              <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700" role="alert">
                {error}
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-surface-200 bg-white p-4 shadow-soft sm:p-5">
            <h2 className="font-semibold text-gray-900">Layout details</h2>
            <p className="text-xs text-gray-500">Fine-tune the dish list without changing the colours.</p>

            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-700">Dish layout</p>
                <div className="mt-2 flex gap-2">
                  {[
                    { id: 'grid', label: 'Card grid' },
                    { id: 'list', label: 'List rows' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => changeOption('layout', option.id)}
                      aria-pressed={preview.layout === option.id}
                      className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                        preview.layout === option.id
                          ? 'border-brand-500 bg-brand-50 text-brand-800'
                          : 'border-surface-200 text-gray-600 hover:border-brand-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-700">Card corners</p>
                <div className="mt-2 flex gap-2">
                  {Object.entries(RADIUS_LABELS).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => changeOption('radius', value)}
                      aria-pressed={preview.radius === value}
                      className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                        preview.radius === value
                          ? 'border-brand-500 bg-brand-50 text-brand-800'
                          : 'border-surface-200 text-gray-600 hover:border-brand-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-700">Headings</p>
                <div className="mt-2 flex gap-2">
                  {[
                    { id: 'display', label: 'Serif' },
                    { id: 'sans', label: 'Clean sans' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => changeOption('headingFont', option.id)}
                      aria-pressed={preview.headingFont === option.id}
                      className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                        preview.headingFont === option.id
                          ? 'border-brand-500 bg-brand-50 text-brand-800'
                          : 'border-surface-200 text-gray-600 hover:border-brand-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-4 xl:sticky xl:top-[5.4rem] xl:self-start">
          <section className="rounded-2xl border border-surface-200 bg-white p-4 shadow-soft sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">Live preview</p>
                <h2 className="mt-1 font-display text-xl font-semibold text-gray-900">{preview.name}</h2>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">{preview.description}</p>
              </div>
              {activePreset ? (
                <span className="rounded-full bg-surface-100 px-2.5 py-1 text-[10px] font-semibold text-gray-600">
                  {activePreset.name}
                </span>
              ) : (
                <span className="rounded-full bg-brand-100 px-2.5 py-1 text-[10px] font-semibold text-brand-800">
                  Custom
                </span>
              )}
            </div>

            <div
              className="mt-4 rounded-2xl border p-3"
              style={{
                ...menuStyleVars(preview),
                backgroundColor: preview.bg,
                borderColor: preview.border,
              }}
              data-heading={preview.headingFont}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p
                    className="text-[9px] font-bold uppercase tracking-[0.18em]"
                    style={{ color: preview.accentDark }}
                  >
                    Bawarchi Puja Special
                  </p>
                  <p
                    className={`mt-0.5 text-lg font-semibold leading-tight ${
                      preview.headingFont === 'sans' ? 'font-sans' : 'font-display'
                    }`}
                    style={{ color: preview.ink }}
                  >
                    What’s cooking
                  </p>
                </div>
                <span
                  className="rounded-full px-2 py-1 text-[10px] font-bold"
                  style={{ backgroundColor: preview.accentSoft, color: preview.accentDark }}
                >
                  ★ 4.3
                </span>
              </div>

              <div className="mt-3 flex gap-1.5 overflow-hidden">
                <span
                  className="rounded-full px-3 py-1 text-[10px] font-semibold"
                  style={{ backgroundColor: preview.accent, color: preview.onAccent }}
                >
                  All dishes
                </span>
                <span
                  className="rounded-full px-3 py-1 text-[10px] font-semibold"
                  style={{ backgroundColor: preview.surface, color: preview.muted }}
                >
                  Biryani
                </span>
                <span
                  className="rounded-full px-3 py-1 text-[10px] font-semibold"
                  style={{ backgroundColor: preview.surface, color: preview.muted }}
                >
                  Rolls
                </span>
              </div>

              <div className={`mt-3 ${preview.layout === 'list' ? 'space-y-2' : 'grid grid-cols-2 gap-2'}`}>
                <PreviewCard
                  style={preview}
                  dish={{ emoji: '🍛', name: 'Chicken Dum Biryani', note: 'House favourite', price: '₹160' }}
                />
                <PreviewCard
                  style={preview}
                  dish={{ emoji: '🌯', name: 'Chicken Roll', note: 'Fresh off the tawa', price: '₹80' }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between rounded-lg px-3 py-2" style={{ backgroundColor: preview.surface }}>
                <span className="text-[10px] font-medium" style={{ color: preview.muted }}>
                  Pickup or delivery
                </span>
                <span
                  className="rounded-md px-2 py-1 text-[10px] font-bold"
                  style={{ backgroundColor: preview.accent, color: preview.onAccent }}
                >
                  Order
                </span>
              </div>
            </div>

            {activePreset && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {[
                  ['Accent', preview.accent],
                  ['Accent dark', preview.accentDark],
                  ['Background', preview.bg],
                  ['Card', preview.card],
                ].map(([label, color]) => (
                  <span key={label} className="inline-flex items-center gap-1.5 rounded-full border border-surface-200 px-2 py-1 text-[10px] text-gray-500">
                    <span className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: color }} />
                    {label}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleApply}
                disabled={applying}
                className="btn-primary flex-1 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {applying ? 'Applying…' : 'Apply this theme'}
              </button>
              <button
                type="button"
                onClick={() => choosePreset(defaultMenuStyle)}
                className="btn-outline py-2.5 text-sm"
              >
                Reset
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] leading-relaxed text-gray-400">
              Applied styles are stored in Neon and loaded by every visitor. If the database is not
              connected, the theme is saved in this browser only.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
