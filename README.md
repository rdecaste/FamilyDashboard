# FamilyDashboard

The family pages, served by GitHub Pages from `main` at https://rdecaste.github.io/FamilyDashboard/:

- `index.html`: the family dashboard (with the Family Boss and the Sluiskil bridge button)
- `michelle.html`, `rassell.html`: the children's task pages
- `parent.html`: the parent page (manage tasks, rewards and proposals)

Since 28 Sep 2026 the backend is the Quest Engine (Cloudflare Worker, `rdecaste/quest-engine`), replacing the Family Dashboard and Family Boss Make scenarios. The pages read `GET /family/latest`, `/family/boss` and `/family/catalog`, and send actions to `POST /family/complete`, `/reward`, `/reset`, `/screen`, `/manage` and `/boss`. The bridge button asks `GET /bridge`, only when tapped. `latest.json`, `boss.json` and `catalog.json` here are the last files Make published and are no longer updated.

The morning jobs (chores, rollover, metrics, boss, portrait, family image) and the Sunday posters run in the Worker. How it works: Notion page "⚙️ Quest Engine (Cloudflare Worker)" under Quest log; routes at the top of the Worker's `src/index.js`. `docs/previews/` holds layout screenshots.
