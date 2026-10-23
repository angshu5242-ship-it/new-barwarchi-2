export const MENU_STYLE_VERSION = 1;

export const menuStylePresets = [
  {
    id: 'classic',
    name: 'Bawarchi Classic',
    description: 'Warm cream, golden accents and the familiar Bawarchi look.',
    accent: '#b06f1f',
    accentDark: '#8e561b',
    accentSoft: '#fdf3df',
    onAccent: '#ffffff',
    bg: '#fbf8f1',
    surface: '#f5efe3',
    card: '#ffffff',
    ink: '#1c1917',
    muted: '#6d5d49',
    border: '#e9dfcf',
    heroFrom: '#fff7e7',
    heroVia: '#fffdf8',
    heroTo: '#f4ead8',
    layout: 'grid',
    radius: 'rounded',
    headingFont: 'display',
  },
  {
    id: 'puja',
    name: 'Puja Marigold',
    description: 'Marigold orange, deep red and a bright festive cream.',
    accent: '#c2410c',
    accentDark: '#9a3412',
    accentSoft: '#ffedd5',
    onAccent: '#ffffff',
    bg: '#fffaf2',
    surface: '#fff1dd',
    card: '#ffffff',
    ink: '#2b1a10',
    muted: '#7c5a44',
    border: '#f6d7b0',
    heroFrom: '#fff1d6',
    heroVia: '#fffaf2',
    heroTo: '#ffe4c4',
    layout: 'grid',
    radius: 'rounded',
    headingFont: 'display',
  },
  {
    id: 'mint',
    name: 'Fresh Mint',
    description: 'Clean green, soft ivory and a calm, modern menu.',
    accent: '#15803d',
    accentDark: '#166534',
    accentSoft: '#dcfce7',
    onAccent: '#ffffff',
    bg: '#f7fdf9',
    surface: '#ecfdf3',
    card: '#ffffff',
    ink: '#14281c',
    muted: '#55705e',
    border: '#ccebd7',
    heroFrom: '#eafaf0',
    heroVia: '#f9fffb',
    heroTo: '#d8f3e2',
    layout: 'grid',
    radius: 'soft',
    headingFont: 'display',
  },
  {
    id: 'rose',
    name: 'Blush Rose',
    description: 'Soft pink, deep berry accents and a gentle celebratory feel.',
    accent: '#be123c',
    accentDark: '#9f1239',
    accentSoft: '#ffe4e6',
    onAccent: '#ffffff',
    bg: '#fff8f9',
    surface: '#fff1f2',
    card: '#ffffff',
    ink: '#2c1218',
    muted: '#7a5560',
    border: '#fecdd3',
    heroFrom: '#fff1f2',
    heroVia: '#fffafb',
    heroTo: '#ffe4e6',
    layout: 'grid',
    radius: 'rounded',
    headingFont: 'display',
  },
  {
    id: 'ocean',
    name: 'Coastal Blue',
    description: 'Airy sky blue, crisp white cards and a fresh seaside mood.',
    accent: '#0369a1',
    accentDark: '#075985',
    accentSoft: '#e0f2fe',
    onAccent: '#ffffff',
    bg: '#f7fbfe',
    surface: '#eef7fc',
    card: '#ffffff',
    ink: '#10212b',
    muted: '#54707e',
    border: '#cbe7f5',
    heroFrom: '#eaf7ff',
    heroVia: '#fbfdff',
    heroTo: '#d8effc',
    layout: 'grid',
    radius: 'soft',
    headingFont: 'display',
  },
];

export const defaultMenuStyle = menuStylePresets[0];
export const menuStylePresetIds = menuStylePresets.map((preset) => preset.id);

const HEX = /^#[0-9a-f]{6}$/i;
const COLOR_KEYS = [
  'accent',
  'accentDark',
  'accentSoft',
  'onAccent',
  'bg',
  'surface',
  'card',
  'ink',
  'muted',
  'border',
  'heroFrom',
  'heroVia',
  'heroTo',
];

function cleanText(value, max = 120) {
  return Array.from(String(value ?? ''))
    .filter((character) => {
      const code = character.codePointAt(0);
      return code >= 32 && code !== 127;
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function rgb(hex) {
  const value = String(hex).replace('#', '');
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

function luminance(hex) {
  try {
    const channels = rgb(hex).map((channel) => {
      const value = channel / 255;
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  } catch {
    return 0;
  }
}

function contrastRatio(a, b) {
  const first = luminance(a);
  const second = luminance(b);
  const light = Math.max(first, second);
  const dark = Math.min(first, second);
  return (light + 0.05) / (dark + 0.05);
}

function bestTextColor(background) {
  return contrastRatio('#ffffff', background) >= contrastRatio('#1c1917', background)
    ? '#ffffff'
    : '#1c1917';
}

function isLight(hex) {
  return HEX.test(hex) && luminance(hex) >= 0.72;
}

export function sanitizeMenuStyle(input = {}) {
  const base =
    menuStylePresets.find((preset) => preset.id === input?.preset) || defaultMenuStyle;
  const style = { ...base };

  COLOR_KEYS.forEach((key) => {
    if (HEX.test(input?.[key] || '')) style[key] = input[key];
  });

  if (!isLight(style.bg) || !isLight(style.card)) {
    style.bg = base.bg;
    style.card = base.card;
    style.surface = base.surface;
    style.heroFrom = base.heroFrom;
    style.heroVia = base.heroVia;
    style.heroTo = base.heroTo;
  }

  if (contrastRatio(style.ink, style.bg) < 4.5) style.ink = base.ink;
  if (contrastRatio(style.muted, style.card) < 3) style.muted = base.muted;
  if (contrastRatio(style.accentDark, style.card) < 4.5) style.accentDark = base.accentDark;
  if (contrastRatio(style.onAccent, style.accent) < 4.5) style.onAccent = bestTextColor(style.accent);
  if (contrastRatio(style.border, style.card) < 1.15) style.border = base.border;

  return {
    ...style,
    preset: base.id,
    name: cleanText(input?.name, 44) || base.name,
    description: cleanText(input?.description, 140) || base.description,
    layout: input?.layout === 'list' ? 'list' : input?.layout === 'grid' ? 'grid' : base.layout,
    radius: ['soft', 'rounded', 'sharp'].includes(input?.radius) ? input.radius : base.radius,
    headingFont: input?.headingFont === 'sans' ? 'sans' : 'display',
    version: MENU_STYLE_VERSION,
  };
}

export function menuStyleVars(style) {
  const radius =
    style.radius === 'sharp' ? '0.5rem' : style.radius === 'soft' ? '1rem' : '1.5rem';
  return {
    '--menu-accent': style.accent,
    '--menu-accent-dark': style.accentDark,
    '--menu-accent-soft': style.accentSoft,
    '--menu-on-accent': style.onAccent,
    '--menu-bg': style.bg,
    '--menu-surface': style.surface,
    '--menu-card': style.card,
    '--menu-ink': style.ink,
    '--menu-muted': style.muted,
    '--menu-border': style.border,
    '--menu-hero-from': style.heroFrom,
    '--menu-hero-via': style.heroVia,
    '--menu-hero-to': style.heroTo,
    '--menu-card-radius': radius,
  };
}
