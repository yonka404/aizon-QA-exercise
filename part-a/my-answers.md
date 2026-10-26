# Part A - Problems ranked by priority

Lines refer to `expenses.spec.ts`.

## High

1. **Hardcoded account password** (6): We should store credentials in CI secrets.
2. **False positive test** (51–62): expect(approvalCount).toBeGreaterThanOrEqual(0) will always pass.
3. **Tests depend on a shared expenseId** (8, 36, 49, 72)
4. **Missing await and incomplete audit checks** (74–79): Having a 'audit checked' text as evidence is not enough. Also, evidence.txt can be overwritten.
5. **We should identify the new expense and verify its amount and description.** (35–37)
6. **Fixed sleeps and positional selectors** (18, 27, 33, 47, 70, 92; 32, 35): We should use auto-waiting and data-testids to avoid flakiness.

## Medium

7. **No failure evidence captured in these blocks** (35–39, 95–96): We should use try-catch when attaching custom failure evidence.
8. **The expected total depends on existing data; `parseFloat('250,50')` returns `250`, allowing false passes.** (95–96).
9. **Reject flow is skipped without a reason** (82–85): We should document and track this coverage gap.


## Low

10. **Duplicated login setup** (14–18, 23–27, 43–47, 66–70, 88–92): We should reuse a login helper, keeping the login test separate.


