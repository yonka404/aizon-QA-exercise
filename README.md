# Technical exercise — Advanced QC Automation Engineer

Thanks for taking the time. This is designed to take **about 2.5 hours**. Please don't spend
materially more — if you run out of time, stop and tell us what you would have done next. We would
rather see three parts done thoughtfully than four done in a rush.

We'll then book **45 minutes** to walk through your submission together.

## The scenario

You've joined the QC team at a company that sells **Expensely**, a SaaS expense-approval product.
Employees submit expenses, managers approve or reject them, and finance exports the results.

Expensely is sold to customers in regulated industries, so every approval has to be attributable,
traceable and reconstructable after the fact. Those customers audit us. "The test passed" is not
enough — we have to be able to show *what* was tested, *when*, *against which version*, and
*what the system actually did*.

You've been handed an existing automated suite that the team is unhappy with, and a specification
for an endpoint that isn't covered yet.

## What's in this pack

```
candidate-pack/
├── README.md                  this file
├── part-a/expenses.spec.ts    an existing Playwright suite — your input for Part A
├── part-b/api-spec.md         the specification for Part B
├── part-b/mock-server.js      a local mock of the API, so your tests can actually run
└── part-b/package.json        minimal setup
```

## Part A — Review an existing suite (~45 min)

`part-a/expenses.spec.ts` is real-ish code that currently passes in CI, most days.

1. **List the problems you find.** For each: what it is, why it matters, and how serious it is.
   Rank them — we care more about your ordering than your count. A one-line note per issue is fine;
   prose is not required.
2. **Rewrite one test properly.** Pick whichever one you think best demonstrates the difference,
   and say why you picked it.

You don't need to run anything for this part.

## Part B — Write tests from a specification (~45 min)

`part-b/api-spec.md` specifies `POST /expenses/{id}/approvals`. It is not covered by any test.

1. **Write Playwright API tests** for it. Cover what you think matters.
2. In a comment or a short note, say **which cases you deliberately did not automate, and why.**
   We're interested in where you draw the line.

To run against something real:

```bash
cd part-b && npm install && npm start      # mock API on http://localhost:3000
npx playwright test                         # in another terminal
```

The mock is deliberately simple. If you find a case where the mock disagrees with the spec, say so —
that's a useful finding, not a problem with your work.

## Part C — Evidence and traceability (~30 min)

Short written answers. Bullet points are fine; we're not looking for an essay.

1. How can you ensure the report generated follow the GxP rules during an audit?
2. How would you link a requirement to the test that covers it and to the evidence that it ran —
   so that a year later, someone can follow that chain in either direction?
3. One test in the suite can't sensibly be automated. How do you handle it so that it still counts
   as covered?

## Ground rules

- **AI assistants are allowed.** We use them too. If you use one, just tell us where and how —
  it won't count against you. We'll discuss your submission in detail, so work you can't explain
  will show up anyway.
- **Ask questions.** If the spec is ambiguous, either email us or state your assumption and move on.
  Noticing the ambiguity is part of what we're assessing.
- **Partial is fine.** An honest "I ran out of time here, and here's my plan" scores better than
  padding.

## Submitting

A git repo, a zip, or a folder — whatever's easy. Include your Part A and Part C answers as
markdown or a document alongside the code.
