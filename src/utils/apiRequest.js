export default async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
      },
    });
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { ok: false, error: text || 'Unexpected response from the service.' };
    }
    return {
      ok: response.ok && data?.ok !== false,
      status: response.status,
      data,
      error: data?.error || (!response.ok ? `Request failed (${response.status}).` : ''),
    };
  } catch {
    return {
      ok: false,
      status: 0,
      data: null,
      error: 'Could not reach the service. Please check your connection or order on WhatsApp.',
    };
  }
}
