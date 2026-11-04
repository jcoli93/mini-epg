# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm start                               # http://localhost:3000 (override with PORT)
npm test                                # jest + supertest, files matching tests/**/*.test.js
npx jest tests/channels.test.js         # single test file
npx jest -t "returns the channel list"  # single test by name
npm run test:coverage
npm run test:e2e                        # Playwright; run `npx playwright install chromium` once first
npm run import                          # runs the importer on data/sample-feed.xmltv.txt -> /tmp/schedule.out.json
```

There is no linter and no build step (the web guide in `public/` is plain JS served as static files by Express).

## Architecture

Express API ([src/app.js](src/app.js) defines all routes and is exported without listening, so tests use it through supertest; [src/server.js](src/server.js) only calls `listen`). Route handlers delegate to small modules in `src/epg/` and `src/users/`.

Data flow:

1. **Importer** ([src/legacy/importer.js](src/legacy/importer.js)) runs nightly in production (cron on epg-batch-01), parses the provider's XMLTV-like feed (one `<programme>` per line), resolves overlaps, scores programmes and writes `data/schedule.json`. Run directly, it writes to `data/schedule.json` by default; `npm run import` writes to `/tmp` instead.
2. **Store** ([src/epg/store.js](src/epg/store.js)) `require`s `data/channels.json` and `data/schedule.json` once at startup. There is no database; changing the JSON requires a restart. All read modules (`schedule`, `nowPlaying`, `search`) filter the full in-memory programme array.
3. **Favorites** ([src/users/favorites.js](src/users/favorites.js)) live in an in-memory `Map` (lost on restart, max 50 per user). `_reset()` exists for tests.

The web guide ([public/app.js](public/app.js)) hardcodes `USER_ID = 'demo-user'` and `TODAY = '2026-10-20'`, because the demo data only covers 2026-10-20 and 2026-10-21. Use those dates (or `/now-playing?at=<ISO>`) when testing.

## Domain rules

- **All times are São Paulo local (`-03:00`)**, stored as ISO strings with the offset (e.g. `2026-10-20T20:00:00-03:00`). Brazil has had no DST since 2019; product decided not to add timezone libraries. A "day" in `/channels/:id/schedule` is the São Paulo calendar day (03:00 UTC to 03:00 UTC). Beware of mixing UTC dates (`toISOString().slice(0, 10)`) with the local date embedded in the stored strings.
- **Ratings are ClassInd**: `L` (all ages), `10`, `12`, `14`, `16`, `18` ([src/epg/ratings.js](src/epg/ratings.js)). Legal requires that `18` programmes never appear in a kids profile (not built yet).
- **Do not modify `src/legacy/importer.js`.** It encodes undocumented business rules from its former owner (who has left):
  - the prime-time boost (20h to 23h São Paulo) is multiplicative per channel genre, and live programmes are doubled in prime time;
  - on overlapping programmes in the same channel, the one starting later wins, unless the earlier one is live (live always wins);
  - titles are whitespace-normalised, the `(R)` rerun suffix is stripped except for "Vale a Pena Ver de Novo" (part of the brand), and ALL-CAPS titles longer than 4 characters are title-cased (shorter ones are treated as acronyms).

  The importer exports its functions (`importFeed`, `parseLine`, `cleanTitle`, `score`, `resolveOverlaps`), so these rules can be covered by tests without changing it.

- [docs/architecture-old.md](docs/architecture-old.md) is from 2023 and is **outdated**: it describes Redis, Elasticsearch, moment-timezone, UTC storage and US TV ratings, none of which exist in the code. Trust the code and the README over it.

## Contributing

Branch from `main` and open a PR (one approval needed). Test coverage is minimal (one API test file; `e2e/` is empty), so add tests along with changes.
