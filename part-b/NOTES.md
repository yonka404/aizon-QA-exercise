# Part B

## Cases not automated

1. **Audit immutability and retention:** The mock has no update/delete endpoint or persistent storage. We should verify these controls in a representative environment.
2. **Amounts just below and above 1000.00:** The mock has no 999.99 or 1000.01 expenses. We would need more test data to check these boundaries.
3. **Other error cases:** Expired tokens, missing expenses, invalid signature usernames and unsupported decisions are useful follow-ups. I prioritized the main approval, security and validation checks.
4. **Concurrency and performance:** The local mock cannot show how the real system behaves under load or when decisions happen at the same time.
5. **Invalid types and multiple errors:** The spec does not define the response or validation order for these cases.
