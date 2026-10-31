# API Contract — Catalog

Public, anonymous-accessible endpoints over the iptv-org dataset.

## Common error format
```json
{ "error": "string", "code": "VALIDATION_ERROR | NOT_FOUND | INTERNAL_ERROR" }
```

## GET /api/catalog/channels
List channels with optional filters + pagination.
- Query: `page`, `pageSize` (max 100), `search`, `country`, `category`, `language`, `includeNsfw` (default false)
- Response 200:
```json
{
  "items": [{ "id": "BBCNews.uk", "name": "BBC News", "country": "GB", "categories": ["news"], "streamCount": 3, "is_nsfw": false, ... }],
  "total": 8421, "page": 1, "pageSize": 50, "totalPages": 169
}
```
- Cache-Control: `public, s-maxage=86400, stale-while-revalidate=604800`

## GET /api/catalog/channels/:id
Single channel + its streams + country detail.
- Response 200:
```json
{ "channel": { ... }, "streams": [{ "url": "...", "title": "...", "quality": "720p", "labels": [] }], "country": { "name": "United Kingdom", "code": "GB", "flag": "🇬🇧" } }
```
- 404 `NOT_FOUND` if channel id unknown.

## GET /api/catalog/countries
Array of `{ name, code, languages, flag }`.

## GET /api/catalog/categories
Array of `{ id, name, description }`.

## GET /api/catalog/languages
Array of `{ name, code }`.

## GET /api/catalog/search?q=&limit=
Server-side prefix/substring search; max 20 results.
- Response 200: array of `{ id, name, country, streamCount }`
