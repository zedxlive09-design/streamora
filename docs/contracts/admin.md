# API Contract — Admin (admin/superadmin only)

All `/api/admin/*` endpoints require a NextAuth session with `role` ∈ `{ ADMIN, SUPERADMIN }`.
401 `UNAUTHENTICATED` if no session; 403 `FORBIDDEN` if not admin.

Every mutation writes a row to `AuditLog`.

## Ads

### GET /api/admin/ads
- Query: `page`, `pageSize`, `isActive?`
- Response 200: `{ "items": [AdSlot], "total", "page", "pageSize", "totalPages" }`

### POST /api/admin/ads
- Body:
```json
{
  "name": "Home top banner",
  "position": "home-top",
  "type": "image",
  "content": "https://cdn.example.com/banner.png",
  "frequency": "every-load",
  "intervalMinutes": null,
  "isActive": true,
  "metadata": { "alt": "Buy now", "linkUrl": "https://example.com", "dismissible": true },
  "placements": [{ "page": "home" }]
}
```
- Validation:
  - `position` ∈ `{ home-top, home-sidebar, browse-top, watch-pre, watch-mid, footer }`
  - `type` ∈ `{ text, image, html }`
  - `frequency` ∈ `{ every-load, once-per-session, every-n-minutes }`
  - if `frequency === every-n-minutes` then `intervalMinutes` required (≥1)
  - if `type === image` then `content` must be `http(s)://...`
  - if `type === html` then `content` length ≤ 50_000 chars
- Response 201: created AdSlot.

### GET /api/admin/ads/:id
- 200 OK or 404.

### PATCH /api/admin/ads/:id
- Partial body with any subset of POST fields.
- 200 OK returns updated.

### DELETE /api/admin/ads/:id
- 204 No Content.

## Users

### GET /api/admin/users
- Query: `page`, `pageSize`, `search?` (email substring)
- Response 200: paginated users (without `passwordHash`).

### PATCH /api/admin/users/:id
- Body: `{ "role": "USER" | "ADMIN" }`
- Authorization: superadmin-only may promote to ADMIN or demote from ADMIN.
- Cannot self-demote; cannot demote a superadmin (only superadmin may promote to superadmin).
- 200 OK returns updated user.

## Settings

### GET /api/admin/settings
- Response 200: array of `{ key, value }`.

### PUT /api/admin/settings/:key
- Body: `{ "value": "..." }`
- Upserts by key.
- 200 OK returns updated entry.

### DELETE /api/admin/settings/:key
- 204 No Content.

## Audit

### GET /api/admin/audit
- Query: `page`, `pageSize`, `userId?`, `action?`
- Response 200: paginated audit log entries joined with user email.
