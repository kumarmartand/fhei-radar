# IBC in India

Dashboard of international branch campuses (foreign higher-education institutions) entering India. The home page is a world globe that zooms into India. Next.js frontend on Vercel (free tier), data pipeline on GitHub Actions (free), no database, no API keys.

## How it runs with no human involved
1. `.github/workflows/refresh.yml` runs every 6 hours: offline tests, then `pipeline/refresh.py`, then commits `data/*.json`.
2. The commit triggers Vercel's Git integration, which rebuilds and redeploys the site. The site is static, so it is fast and cheap.
3. If a run fails, the previous data stays; the site shows a warning banner when no refresh has succeeded for 18 hours, and every page shows when the data was last refreshed and how many sources answered. UGC additions and removals are still recorded in data/changes.json and source health in data/source_health.json.

## Deploy (about 10 minutes, once)
1. Push this folder to a GitHub repository (private is fine).
2. GitHub > Actions > enable workflows > run `refresh-data` once by hand to verify the sources work from GitHub's servers.
3. vercel.com > Add New Project > import the repository. Framework: Next.js. No environment variables.
4. Check with your IT / risk team that hosting an internal tool on Vercel and GitHub is permitted, and put access control in front of it (Vercel password protection or SSO) if the data is not public.

## Globe atlas: what to know
- `lib/atlas.ts` holds the home-campus coordinates and flag per university (city-level, from general knowledge: verify before external use) and builds the globe scene. India positions come from `lat`/`lon` in `data/institutions.json`; extra campuses (University of Western Australia in Chennai) are listed in `EXTRA_CAMPUSES`.
- **Logos:** none are bundled. To add a verified official logo, put the file in `public/logos/` and add one line to `lib/logos.ts`. Until then the app shows initials.
- **Map outline:** `lib/land.json` is coastlines only (Natural Earth, public domain). No international or state boundaries are drawn. It is not a Survey of India map; do not add borders without an approved source.
- **Adding a university:** add it to `data/institutions.json` (via the seed script) and to the `GEO` table in `lib/atlas.ts`. Without a `GEO` entry it still appears in the directory but not on the globe.
- Globe logic test (needs Node): `npx tsx tests/atlas.test.ts`.

## What updates automatically
- News and events per university (Google News RSS, GDELT, PIB, PIE News, University World News, THE, optional Google Alerts RSS).
- UGC foreign-campus list, with added/removed campuses and "now lists / no longer lists <university>" in the change log.
- Possible new entrants named in news but not on the watch list.

## What does not change automatically (by design)
- Statuses and facts in `data/institutions.json` come from the audited workbook. A headline can be wrong or premature, so the pipeline records signals next to a status and never overwrites it. To update a status, edit the workbook and run `python seed_from_workbook.py <workbook>`.

## Accuracy controls
- Whole-word matching (no "ied" inside "studied"), ambiguous names require "University of ...".
- Each article is marked `high` (university in the headline), `medium` (summary only) or `sector` (no university). The News page hides `sector` unless asked.
- Duplicate headlines across outlets are dropped. Every item links to its original source.
- Tests: `python tests/test_pipeline.py && python tests/test_end_to_end.py` (offline).

## Add LinkedIn-style signals
LinkedIn is not scraped (terms of service). Create Google Alerts (deliver to RSS) such as `site:linkedin.com "Deakin" India campus`, and paste the feed URLs into `google_alerts_rss` in `pipeline/config.json`.

## Local run
    npm install && npm run dev        # frontend
    pip install -r requirements.txt && python pipeline/refresh.py   # pipeline
`app.py` is the earlier Streamlit version, kept as an alternative.
