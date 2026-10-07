# FamilyDashboard

The family pages, at https://family.quest-engine.workers.dev (Cloudflare):

- `index.html` (`/`): the family dashboard on the TV (with the Family Boss and the Sluiskil bridge button); public
- `michelle.html`, `rassell.html` (`/michelle`, `/rassell`): the children's task pages; public
- `steph.html` (`/steph`): Steph's reminders for Roy (`steph.js`, `steph.css`): a text, an optional date and the list of open ones with a "klaar" button. Public page; its actions need the family passcode (`parent-auth.js`). Sends `POST /family/remind`; each reminder is an open To-Do tagged Steph in D1, which Roy OS shows as "From Steph". Linked from the parent page header
- `parent.html` (`/parent`): the parent page (manage tasks, rewards and proposals), behind Roy's Cloudflare Access login; its actions also need the family passcode (`parent-auth.js`, the Quest Engine's `FAMILY_PASSCODE`)

Since 28 Sep 2026 the backend is the Quest Engine (Cloudflare Worker, `rdecaste/quest-engine`), replacing the Family Dashboard and Family Boss Make scenarios. The pages read `GET /family/latest`, `/family/boss` and `/family/catalog`, and send actions to `POST /family/complete`, `/reward`, `/reset`, `/screen`, `/manage` and `/boss` (and `/steph` sends `/remind`). The bridge button asks `GET /bridge`, only when tapped.

The morning jobs (chores, rollover, metrics, boss, portrait, family image) and the Sunday posters run in the Worker. How it works: `docs/quest-engine.md` in rdecaste/quest-engine; routes at the top of the Worker's `src/index.js`. The data (days, tasks, rewards, chores, treasures, bosses) is in the Quest Engine's D1 database since 1 Oct 2026; rewards, fixed chores and boss settings are edited in D1 Data Studio. `docs/previews/` holds layout screenshots.

A push to `main` deploys it to Cloudflare (Workers Builds); by hand: `npx wrangler deploy`. Only the pages are published (`.assetsignore`). The old `rdecaste.github.io` address forwards here until GitHub Pages is switched off.
