# API Contract

## Endpoint
- Method:
- Path:
- Purpose:
- Authentication:
- Authorization:
- Idempotency:

## Request
### Headers
| Name | Required | Description |
|---|---|---|
| | | |

### Path/query/body
```json
{}
```

## Success response
- Status:
```json
{}
```

## Error responses
| Status | Code | Meaning |
|---|---|---|
| 400 | VALIDATION_ERROR | Invalid request |
| 401 | UNAUTHENTICATED | Authentication required |
| 403 | FORBIDDEN | Insufficient permission |
| 404 | NOT_FOUND | Resource unavailable |
| 409 | CONFLICT | State conflict |
| 429 | RATE_LIMITED | Too many requests |
| 500 | INTERNAL_ERROR | Unexpected server failure |

## Validation and business rules
-

## Data access rules
-

## Tests
-
