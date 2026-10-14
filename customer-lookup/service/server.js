import { createServer } from 'node:http';

const customers = {
  C100: { id: 'C100', name: 'Ada Lovelace', accountId: 'A200' },
  C101: { id: 'C101', name: 'Grace Hopper', accountId: 'A201' }
};
const accounts = {
  A200: { id: 'A200', status: 'active', balance: 125.50 },
  A201: { id: 'A201', status: 'pending', balance: 0 }
};

const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const parts = url.pathname.split('/').filter(Boolean);
  const collection = parts[0] === 'customers' ? customers : parts[0] === 'accounts' ? accounts : null;
  const record = req.method === 'GET' && parts.length === 2 && collection ? collection[parts[1]] : null;
  const status = record ? 200 : 404;
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(record ?? { error: 'Not found' }));
});

server.listen(3001, '127.0.0.1', () => {
  console.log('Customer lookup service listening on http://localhost:3001');
});
