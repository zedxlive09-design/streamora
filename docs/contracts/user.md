# API Contract — User (auth-required)

All `/api/user/*` endpoints require a valid NextAuth session cookie.
401 `UNAUTHENTICATED` if absent; 403 `FORBIDDEN` if acting on another user's resources.

## GET /api/user/favorites
List current user's favorited channels (with snapshot of channel metadata).
- Response 200:
```json
[{ "channelId": "BBCNews.uk", "name": "BBC News", "country": "GB", "addedAt": "2026-10-31T..." }]
```

## POST /api/user/favorites
- Body: `{ "channelId": "BBCNews.uk" }`
- 201 Created on success; 409 `CONFLICT` if already favorited.

## DELETE /api/user/favorites/:channelId
- 204 No Content.

## GET /api/user/history
- Response 200: array of last 100 watch history entries (newest first).
```json
[{ "channelId": "BBCNews.uk", "channelName": "BBC News", "streamUrl": "https://...", "watchedAt": "..." }]
```

## POST /api/user/history
- Body: `{ "channelId", "channelName", "streamUrl" }`
- Inserts a new history entry. If 101st entry, deletes the oldest.

## GET /api/user/metadata/:channelId
- Response 200: `{ "fields": [{ "key": "Rating", "value": "5/5" }] }`
- 404 if no metadata stored.

## PUT /api/user/metadata/:channelId
- Body: `{ "fields": [{ "key": "Rating", "value": "5/5" }, ...] }`
- Validation: max 20 fields, key ≤50 chars, value ≤500 chars.
- 200 OK returns updated fields.

## DELETE /api/user/metadata/:channelId
- 204 No Content.

## GET /api/user/profile
- Response 200: `{ "displayName", "defaultCountry", "theme" }`

## PATCH /api/user/profile
- Body: any subset of `{ "displayName", "defaultCountry", "theme" }`
- Validation: theme ∈ `light|dark|system`; defaultCountry ∈ ISO 3166-1 alpha-2 (if set).
- 200 OK returns updated profile.
