# Specification — Approve or reject an expense

## Operation

| | |
|---|---|
| **Operation ID** | `CreateExpenseApproval` |
| **Method** | `POST` |
| **Path** | `/expenses/{id}/approvals` |
| **Auth** | `Authorization: Bearer <token>` — required |
| **Permission** | The caller must hold the `approver` role |
| **Audit trail** | YES — every successful call writes one immutable audit entry |

## Path parameters

- `id` — identifier of the expense.

## Request body

| Attribute | Type | Cardinality | Description |
|---|---|---|---|
| `decision` | Enum | 1 | `approve` or `reject`. |
| `comment` | String | 0..1 | Free text, maximum 500 characters. **Mandatory when `decision` is `reject`.** |
| `signature` | Object | 0..1 | **Mandatory when the expense amount is 1000.00 or above.** |

### Signature

| Attribute | Type | Cardinality | Description |
|---|---|---|---|
| `username` | String | 1 | Must be the username of the authenticated caller. |
| `password` | String | 1 | The caller's own password, re-entered to confirm the decision. |

## Preconditions

1. The expense exists.
2. The expense is in `submitted` status. An expense already `approved` or `rejected` cannot be decided again.
3. The caller is **not** the employee who submitted the expense.

## Responses

### `201 Created`

```json
{
  "approvalId": "apr_8f21",
  "expenseId": "exp_1049",
  "decision": "approve",
  "decidedBy": "m.torres",
  "decidedAt": "2026-10-20T14:03:11.482Z",
  "resultingStatus": "approved"
}
```

The expense status becomes `approved` or `rejected` to match the decision. One audit entry is
written, carrying the actor, the timestamp, the previous status and the new status. Audit entries
are append-only: nothing in the system may alter or remove one.

### `400 Bad Request`

| Rationale | Error code |
|---|---|
| `decision` missing, or not one of the two accepted values. | `invalidDecision` |
| `decision` is `reject` and no `comment` was provided. | `commentRequired` |
| `comment` is longer than 500 characters. | `commentTooLong` |
| The expense amount is 1000.00 or above and no `signature` was provided. | `signatureRequired` |
| `signature.username` does not match the authenticated caller. | `signatureUserMismatch` |
| `signature.password` is not correct. | `signatureInvalid` |

### `401 Unauthorized`
No token, or an expired one.

### `403 Forbidden`
The caller does not hold the `approver` role, **or** the caller is the employee who submitted the expense.

### `404 Not Found`
No expense with that `id`.

### `409 Conflict`
The expense is not in `submitted` status.

## Notes

- Amounts are decimal with exactly two places. The signature threshold is inclusive.
- `decidedAt` is set by the server, in UTC. Clients cannot supply it.
