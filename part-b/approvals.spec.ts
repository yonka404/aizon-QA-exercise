import { test, expect } from "@playwright/test";

test("approver approves a submitted expense", async ({ request }) => {
  const response = await request.post(
    "http://localhost:3000/expenses/exp_small/approvals",
    {
      headers: {
        Authorization: "Bearer tok-manager",
      },
      data: {
        decision: "approve",
      },
    },
  );

  expect(response.status()).toBe(201);

  const body = await response.json();

  expect(body).toMatchObject({
    expenseId: "exp_small",
    decision: "approve",
    decidedBy: "m.torres",
    resultingStatus: "approved",
  });
});
test("rejects a request without a decision", async ({ request }) => {
  const response = await request.post(
    "http://localhost:3000/expenses/exp_small/approvals",
    {
      headers: {
        Authorization: "Bearer tok-manager",
      },
      data: {},
    },
  );

  expect(response.status()).toBe(400);

  const body = await response.json();
  expect(body.error).toBe("invalidDecision");
});
