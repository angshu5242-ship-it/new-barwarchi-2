import { handleStaffRequest } from '../server/staff.js';

async function readJsonBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch {
        return {};
      }
    }
    if (Buffer.isBuffer(req.body)) {
      try {
        return JSON.parse(req.body.toString('utf8'));
      } catch {
        return {};
      }
    }
    return req.body;
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  const body =
    req.method === 'POST' || req.method === 'PATCH' || req.method === 'DELETE'
      ? await readJsonBody(req)
      : null;
  const url = new URL(req.url || '/', 'http://localhost');
  const result = await handleStaffRequest({
    method: req.method,
    query: Object.fromEntries(url.searchParams.entries()),
    headers: req.headers,
    body,
  });

  res.statusCode = result.status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(result.body));
}
