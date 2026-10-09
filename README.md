# FHEI Radar

Internal dashboard for foreign higher-education institutions (FHEI) entering India. Next.js frontend on Vercel (free tier), data pipeline on GitHub Actions (free), no database, no API keys.

## How it runs with no human involved
1. `.github/workflows/refresh.yml` runs every 6 hours: offline tests, then `pipeline/refresh.py`, then commits `data/*.json`.
2. The commit triggers Vercel's Git integration, which rebuilds and redeploys the site. The site is static, so it is fast and cheap.
3. If a run fails, the previous data stays; the site shows a warning banner when no refresh has succeeded for 18 hours, and the Changes page shows per-source health with the last success time.

## Deploy (about 10 minutes, once)
1. Push this folder to a GitHub repository (private is fine).
2. GitHub > Actions > enable workflows > run `refresh-data` once by hand to verify the sources work from GitHub's servers.
3. vercel.com > Add New Project > import the repository. Framework: Next.js. No environment variables.
4. Check with your IT / risk team that hosting an internal tool on Vercel and GitHub is permitted, and put access control in front of it (Vercel password protection or SSO) if the data is not public.

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
