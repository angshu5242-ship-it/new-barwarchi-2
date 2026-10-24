import { handleOrdersRequest } from '../server/orders.js';

export default async function handler(req, res) {
  const result = await handleOrdersRequest({
    method: req.method || 'GET',
    query: { reviewCron: '1', ...(req.query || {}) },
    headers: req.headers || {},
    body: null,
  });
  res.status(result.status).json(result.body);
}
