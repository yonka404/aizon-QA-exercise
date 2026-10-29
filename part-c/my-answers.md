# Part C - Evidence and traceability

1. **Reports for a GxP audit:** We should validate the reporting process and agree the applicable controls with QA. The report should show who ran the tests, when, the environment and the application/test versions. Keep the original evidence, including failures and retries, in protected storage for the required retention period. Corrections and approvals should be recorded, and we should check that archived evidence can still be restored and read. These controls follow the [MHRA data integrity guidance](https://assets.publishing.service.gov.uk/media/5aa2b9ede5274a3e391e37f3/MHRA_GxP_data_integrity_guide_March_edited_Final.pdf).

2. **Linking requirements, tests and evidence:** We should give each requirement and test an ID and keep a traceability matrix: requirement ID ↔ test ID ↔ run ID ↔ evidence. Include these IDs in the report too, so we can follow the links in either direction. Archive the exact requirement revision, test commit and application build with the evidence. A link to an expired CI report is not enough.

3. **Tests that cannot be automated:** We should document the reason and create an approved manual test with steps, expected results, an owner and when to repeat it. Record the tester, date, build, actual results and evidence, then have the result reviewed. Link it to the same requirement and report its manual pass/fail status. A skipped test does not count as verified coverage.

