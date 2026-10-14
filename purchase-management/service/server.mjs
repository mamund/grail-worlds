import { createServer } from 'node:http';
import { getPurchase, updatePurchase } from '../capabilities/store.mjs';
const server = createServer(async (req, res) => {
  const send = (code, obj) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(obj)); };
  try {
    const parts = new URL(req.url, 'http://localhost').pathname.split('/').filter(Boolean);
    if (parts[0] !== 'purchases' || !parts[1]) return send(404, { error: 'Not found' });
    const id = decodeURIComponent(parts[1]);
    const purchase = await getPurchase(id);
    if (!purchase) return send(404, { error: 'Unknown purchase' });
    if (req.method === 'GET' && parts.length === 2) return send(200, purchase);
    if (req.method === 'POST' && parts[2] === 'record' && parts.length === 3) {
      if (!purchase.processingStatus || !purchase.review?.status) return send(409, { error: 'Purchase not processed' });
      const recordId = `REC-${id}`;
      await updatePurchase(id, { recorded: { recordId, status: purchase.review.status, processingStatus: purchase.processingStatus } });
      return send(200, { recordId, status: purchase.review.status });
    }
    return send(404, { error: 'Not found' });
  } catch (err) { console.error(err); return send(500, { error: 'Internal error' }); }
});
server.listen(3002, '127.0.0.1', () => console.log('Purchase service: http://127.0.0.1:3002'));
