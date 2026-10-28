// Minimal mock of the Expensely approvals API. Node 18+, no dependencies.
//   node mock-server.js      ->  http://localhost:3000
//
// Seeded users (token -> user):
//   tok-manager   m.torres   roles: [approver]   password: Hunter!2026
//   tok-employee  a.oliva    roles: [employee]   password: Correct!2026
//   tok-expired   (always 401)
//
// Seeded expenses:
//   exp_small     120.00   submitted   submittedBy a.oliva
//   exp_large    1000.00   submitted   submittedBy a.oliva
//   exp_own       80.00    submitted   submittedBy m.torres
//   exp_done      50.00    approved    submittedBy a.oliva
const http = require('http');

const users = {
  'tok-manager':  { username: 'm.torres', roles: ['approver'], password: 'Hunter!2026' },
  'tok-employee': { username: 'a.oliva',  roles: ['employee'], password: 'Correct!2026' },
};
const expenses = {
  exp_small: { amount: '120.00',  status: 'submitted', submittedBy: 'a.oliva' },
  exp_large: { amount: '1000.00', status: 'submitted', submittedBy: 'a.oliva' },
  exp_own:   { amount: '80.00',   status: 'submitted', submittedBy: 'm.torres' },
  exp_done:  { amount: '50.00',   status: 'approved',  submittedBy: 'a.oliva' },
};
const audit = [];
let seq = 0;

const send = (res, code, body) => {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(body === undefined ? '' : JSON.stringify(body));
};
const fail = (res, code, errorCode) => send(res, code, { error: errorCode });

const server = http.createServer((req, res) => {
  const m = req.url.match(/^\/expenses\/([^/]+)\/approvals$/);
  if (req.method === 'GET' && req.url === '/audit') return send(res, 200, audit);
  if (!m || req.method !== 'POST') return send(res, 404, { error: 'notFound' });

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const user = users[token];
  if (!user) return fail(res, 401, 'unauthorized');

  let raw = '';
  req.on('data', c => (raw += c));
  req.on('end', () => {
    let body;
    try { body = JSON.parse(raw || '{}'); } catch { return fail(res, 400, 'invalidDecision'); }

    const expense = expenses[m[1]];
    if (!user.roles.includes('approver')) return fail(res, 403, 'forbidden');
    if (!expense) return fail(res, 404, 'notFound');
    if (expense.submittedBy === user.username) return fail(res, 403, 'forbidden');
    if (expense.status !== 'submitted') return fail(res, 409, 'conflict');

    if (!['approve', 'reject'].includes(body.decision)) return fail(res, 400, 'invalidDecision');
    if (body.decision === 'reject' && !body.comment) return fail(res, 400, 'commentRequired');
    if (body.comment && body.comment.length > 500) return fail(res, 400, 'commentTooLong');

    if (parseFloat(expense.amount) >= 1000) {
      if (!body.signature) return fail(res, 400, 'signatureRequired');
      if (body.signature.username !== user.username) return fail(res, 400, 'signatureUserMismatch');
      if (body.signature.password !== user.password) return fail(res, 400, 'signatureInvalid');
    }

    const previous = expense.status;
    expense.status = body.decision === 'approve' ? 'approved' : 'rejected';
    const decidedAt = new Date().toISOString();
    audit.push({ expenseId: m[1], actor: user.username, at: decidedAt, from: previous, to: expense.status });

    send(res, 201, {
      approvalId: `apr_${(++seq).toString(16).padStart(4, '0')}`,
      expenseId: m[1],
      decision: body.decision,
      decidedBy: user.username,
      decidedAt,
      resultingStatus: expense.status,
    });
  });
});

server.listen(Number(process.env.PORT ?? 3000), () => {
  console.log(`Expensely mock listening on http://localhost:${server.address().port}`);
});
