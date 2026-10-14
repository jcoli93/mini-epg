# mini-epg architecture (2023)

> Last updated: March 2023 by Marcus.

## Components

- **API**: Express app in `src/index.js` with routes in `src/routes/`.
- **Storage**: favorites and schedules are stored in **Redis** (`REDIS_URL`).
- **Importer**: `src/legacy/importer.js`, runs every hour from the API process itself
  (setInterval) and pulls the provider feed over FTP.
- **Search**: Elasticsearch index `epg-programmes`, accent-insensitive via the
  `asciifolding` filter.

## Time handling

All times are stored in UTC and converted to São Paulo time in the frontend with
moment-timezone.

## Ratings

Ratings follow the US TV Parental Guidelines (TV-Y, TV-PG, TV-14, TV-MA).

## Open questions

- Move favorites to Postgres?
- Kids profile with rating filter (legal request).
