import { test, expect, request, type APIRequestContext } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';

async function startServer(): Promise<{ server: ChildProcess; baseURL: string }> {
  const server = spawn(process.execPath, [path.join(__dirname, 'mock-server.js')], {
    env: { ...process.env, PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';

  try {
    const port = await new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => finish(new Error(`Mock server startup timed out: ${output}`)), 10000);
      const finish = (error?: Error, port?: string) => {
        clearTimeout(timeout);
        server.stdout?.off('data', onData);
        server.off('error', onError);
        server.off('exit', onExit);
        if (error) reject(error);
        else resolve(port!);
      };
      const onData = (chunk: Buffer) => {
        output += chunk.toString();
        const match = output.match(/Expensely mock listening on http:\/\/localhost:(\d+)/);
        if (match) finish(undefined, match[1]);
      };
      const onError = (error: Error) => finish(error);
      const onExit = (code: number | null, signal: NodeJS.Signals | null) =>
        finish(new Error(`Mock server exited before startup (code ${code}, signal ${signal}): ${output}`));
      server.stdout?.on('data', onData);
      server.stderr?.on('data', (chunk: Buffer) => { output += chunk.toString(); });
      server.once('error', onError);
      server.once('exit', onExit);
    });
    return { server, baseURL: `http://localhost:${port}` };
  } catch (error) {
    server.kill();
    throw error;
  }
}

async function stopServer(server: ChildProcess): Promise<void> {
  if (server.exitCode !== null || server.signalCode !== null) return;
  await new Promise<void>((resolve) => {
    const timeout = setTimeout(() => {
      server.kill('SIGKILL');
      resolve();
    }, 2000);
    server.once('exit', () => { clearTimeout(timeout); resolve(); });
    if (!server.kill()) { clearTimeout(timeout); resolve(); }
  });
}

// Each test gets a fresh mock because successful decisions change its in-memory data.
let api: APIRequestContext;
let server: ChildProcess;

test.beforeEach(async () => {
  const started = await startServer();
  server = started.server;
  api = await request.newContext({ baseURL: started.baseURL });
});

test.afterEach(async () => {
  try {
    await api?.dispose();
  } finally {
    if (server) await stopServer(server);
  }
});

const manager = { Authorization: "Bearer tok-manager" };
const signature = { username: "m.torres", password: "Hunter!2026" };

test("approver approves a submitted expense and records an audit entry", async () => {
  const response = await api.post("/expenses/exp_small/approvals", {
    headers: manager,
    data: { decision: "approve" },
  });

  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(body).toMatchObject({
    expenseId: "exp_small",
    decision: "approve",
    decidedBy: "m.torres",
    resultingStatus: "approved",
  });
  expect(body.approvalId).toEqual(expect.any(String));
  expect(body.decidedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/);
  expect(Number.isFinite(Date.parse(body.decidedAt))).toBe(true);

  const auditResponse = await api.get("/audit");
  expect(auditResponse.status()).toBe(200);
  expect(await auditResponse.json()).toEqual([{
    expenseId: "exp_small",
    actor: "m.torres",
    at: body.decidedAt,
    from: "submitted",
    to: "approved",
  }]);

  const secondDecision = await api.post("/expenses/exp_small/approvals", {
    headers: manager,
    data: { decision: "approve" },
  });
  expect(secondDecision.status()).toBe(409);
});

test("a signed rejection at 1000.00 accepts a 500-character comment", async () => {
  const response = await api.post("/expenses/exp_large/approvals", {
    headers: manager,
    data: { decision: "reject", comment: "x".repeat(500), signature },
  });

  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(body).toMatchObject({
    expenseId: "exp_large",
    decision: "reject",
    decidedBy: "m.torres",
    resultingStatus: "rejected",
  });
  const auditResponse = await api.get("/audit");
  expect(auditResponse.status()).toBe(200);
  expect(await auditResponse.json()).toEqual([{
    expenseId: "exp_large",
    actor: "m.torres",
    at: body.decidedAt,
    from: "submitted",
    to: "rejected",
  }]);
});

test("rejects a request without a decision", async () => {
  const response = await api.post("/expenses/exp_small/approvals", {
    headers: manager,
    data: {},
  });

  expect(response.status()).toBe(400);
  expect((await response.json()).error).toBe("invalidDecision");
});

test("requires a comment when rejecting an expense", async () => {
  const response = await api.post("/expenses/exp_small/approvals", {
    headers: manager,
    data: { decision: "reject" },
  });

  expect(response.status()).toBe(400);
  expect((await response.json()).error).toBe("commentRequired");
});

test("rejects a comment longer than 500 characters", async () => {
  const response = await api.post("/expenses/exp_small/approvals", {
    headers: manager,
    data: { decision: "reject", comment: "x".repeat(501) },
  });

  expect(response.status()).toBe(400);
  expect((await response.json()).error).toBe("commentTooLong");
});

test("requires a signature at the 1000.00 threshold", async () => {
  const response = await api.post("/expenses/exp_large/approvals", {
    headers: manager,
    data: { decision: "approve" },
  });

  expect(response.status()).toBe(400);
  expect((await response.json()).error).toBe("signatureRequired");
});

test("rejects an incorrect signature password", async () => {
  const response = await api.post("/expenses/exp_large/approvals", {
    headers: manager,
    data: { decision: "approve", signature: { ...signature, password: "wrong" } },
  });

  expect(response.status()).toBe(400);
  expect((await response.json()).error).toBe("signatureInvalid");
});

test("requires an authentication token", async () => {
  const response = await api.post("/expenses/exp_small/approvals", {
    data: { decision: "approve" },
  });

  expect(response.status()).toBe(401);
});

test("forbids a caller without the approver role", async () => {
  const response = await api.post("/expenses/exp_small/approvals", {
    headers: { Authorization: "Bearer tok-employee" },
    data: { decision: "approve" },
  });

  expect(response.status()).toBe(403);
});

test("forbids an approver from deciding their own expense", async () => {
  const response = await api.post("/expenses/exp_own/approvals", {
    headers: manager,
    data: { decision: "approve" },
  });

  expect(response.status()).toBe(403);
});
