import {
  menuStylePresetIds,
  sanitizeMenuStyle,
} from '../src/data/menuStyles.js';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'nb2admin2024';

const COLOR_HELP = 'A 6-digit hex colour such as #b06f1f.';

const styleSchema = {
  type: 'OBJECT',
  properties: {
    preset: {
      type: 'STRING',
      enum: menuStylePresetIds,
      description: 'The closest preset to use as the base theme.',
    },
    name: { type: 'STRING', description: 'Short theme name, at most 44 characters.' },
    description: {
      type: 'STRING',
      description: 'One friendly sentence describing the theme, at most 140 characters.',
    },
    accent: { type: 'STRING', description: `Main accent. ${COLOR_HELP}` },
    accentDark: { type: 'STRING', description: `Darker accent for text/hover. ${COLOR_HELP}` },
    accentSoft: { type: 'STRING', description: `Very light accent tint. ${COLOR_HELP}` },
    onAccent: { type: 'STRING', description: `Readable text on the accent. ${COLOR_HELP}` },
    bg: { type: 'STRING', description: `Light page background. ${COLOR_HELP}` },
    surface: { type: 'STRING', description: `Light secondary surface. ${COLOR_HELP}` },
    card: { type: 'STRING', description: `Light card background. ${COLOR_HELP}` },
    ink: { type: 'STRING', description: `Dark main text. ${COLOR_HELP}` },
    muted: { type: 'STRING', description: `Medium muted text. ${COLOR_HELP}` },
    border: { type: 'STRING', description: `Light border colour. ${COLOR_HELP}` },
    heroFrom: { type: 'STRING', description: `Hero gradient start (light). ${COLOR_HELP}` },
    heroVia: { type: 'STRING', description: `Hero gradient middle (light). ${COLOR_HELP}` },
    heroTo: { type: 'STRING', description: `Hero gradient end (light). ${COLOR_HELP}` },
    layout: {
      type: 'STRING',
      enum: ['grid', 'list'],
      description: 'Grid cards or a horizontal list of dishes.',
    },
    radius: {
      type: 'STRING',
      enum: ['soft', 'rounded', 'sharp'],
      description: 'Corner style for the menu cards.',
    },
    headingFont: {
      type: 'STRING',
      enum: ['display', 'sans'],
      description: 'Serif display headings or clean sans headings.',
    },
  },
  required: [
    'preset',
    'name',
    'description',
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
    'layout',
    'radius',
    'headingFont',
  ],
};

function adminAuthorized(headers) {
  return headers['x-admin-password'] === ADMIN_PASSWORD;
}

function cleanPrompt(value) {
  return Array.from(String(value ?? ''))
    .filter((character) => {
      const code = character.codePointAt(0);
      return code >= 32 && code !== 127;
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 600);
}

function parseStyleText(text) {
  const cleaned = String(text || '')
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

export async function generateMenuStyle(body, headers) {
  if (!adminAuthorized(headers)) {
    return { status: 401, body: { ok: false, error: 'Admin password is required.' } };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      status: 503,
      body: {
        ok: false,
        geminiConfigured: false,
        error: 'Gemini is not configured. Add GEMINI_API_KEY to the server environment.',
      },
    };
  }

  const prompt = cleanPrompt(body?.prompt);
  if (prompt.length < 3) {
    return {
      status: 400,
      body: { ok: false, error: 'Describe the menu style you want in a few words.' },
    };
  }

  const model = String(process.env.GEMINI_MODEL || 'gemini-2.5-flash').replace(/^models\//, '');
  const restaurantName = process.env.RESTAURANT_NAME || 'New Bawarchi 2';
  const current = body?.currentStyle
    ? sanitizeMenuStyle(body.currentStyle)
    : null;

  const instruction = [
    'You are a senior restaurant brand designer creating a light, appetising online menu theme.',
    'Return only the JSON object requested by the schema.',
    'The theme must stay light and readable on phones and desktops.',
    'Never use dark page backgrounds, blurred panels, neon colours or low-contrast text.',
    'Choose the preset that best matches the request, then tune the hex colours.',
    'Text on buttons must have strong contrast. Main text on cards must be easy to read.',
  ].join(' ');

  const userText = [
    `Restaurant: ${restaurantName}, a casual Indian restaurant in Belonia, Tripura.`,
    'Menu: biryani, rolls, momos, chowmein, rice, gravies and combo plates.',
    current
      ? `Current theme: ${current.name} (${current.description}), accent ${current.accent}.`
      : 'Current theme: warm cream and gold Bawarchi Classic.',
    `Owner's requested direction: ${prompt}`,
    'Create a theme that feels premium but still friendly and local.',
    'Keep backgrounds light. Use the preset field for the base, and make sure every colour is a valid 6-digit hex.',
  ].join('\n');

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: instruction }] },
          contents: [{ role: 'user', parts: [{ text: userText }] }],
          generationConfig: {
            temperature: 0.75,
            maxOutputTokens: 2200,
            responseMimeType: 'application/json',
            responseSchema: styleSchema,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
        signal: AbortSignal.timeout(30000),
      },
    );

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const detail = String(data?.error?.message || `Gemini request failed (${response.status}).`);
      console.error('[menu-stylist] Gemini error:', response.status, detail.slice(0, 400));
      return {
        status: 502,
        body: {
          ok: false,
          error: `Gemini could not create a theme: ${detail.slice(0, 220)}`,
        },
      };
    }

    const blockReason = data?.promptFeedback?.blockReason;
    if (blockReason) {
      return {
        status: 400,
        body: { ok: false, error: `That request was blocked (${blockReason}). Try a different description.` },
      };
    }

    const text = (data?.candidates?.[0]?.content?.parts || [])
      .map((part) => part?.text || '')
      .join('')
      .trim();
    if (!text) {
      return {
        status: 502,
        body: { ok: false, error: 'Gemini returned an empty theme. Please try again.' },
      };
    }

    let parsed;
    try {
      parsed = parseStyleText(text);
    } catch {
      console.error('[menu-stylist] Unparsed response:', text.slice(0, 1600));
      return {
        status: 502,
        body: { ok: false, error: 'Gemini returned a theme that could not be read. Please try again.' },
      };
    }

    return {
      status: 200,
      body: {
        ok: true,
        style: sanitizeMenuStyle(parsed),
        model,
      },
    };
  } catch (error) {
    console.error('[menu-stylist]', error);
    return {
      status: 502,
      body: {
        ok: false,
        error: 'Gemini is unavailable right now. You can still choose a preset theme.',
      },
    };
  }
}

export async function handleMenuStylistRequest({ method = 'POST', headers = {}, body = null }) {
  if (method !== 'POST') {
    return { status: 405, body: { ok: false, error: 'Method not allowed.' } };
  }
  return generateMenuStyle(body, headers);
}
