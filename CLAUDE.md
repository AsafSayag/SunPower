# SunPower — sun-power.co.il

The company site for SunPower (solar systems: washing, maintenance, installation), in Hebrew and
right-to-left. It was moved from WordPress to Next.js on Vercel, keeping every address, text and
SEO tag of the old site. The new site is on a preview address and has not launched yet; the launch steps
are in `LAUNCH_PLAN.md`.

Two people work on this repository, each from their own computer with their own Claude.

## Branches and pushing

- **Each person pushes to their own branch.** The person you are working with tells you which
  branch is theirs. This file does not say, on purpose.
- If you do not know the branch yet (nothing in your memory or in `CLAUDE.local.md`), **ask before
  the first commit or push**, then save the answer in your memory or in `CLAUDE.local.md` (not
  committed) so you do not ask again.
- Before committing, check that the checked-out branch is that person's branch. If it is not,
  stop and say so.
- Never push to `main`, and never push to the other person's branch. `main` is the release
  branch; Asaf merges into it himself.
- To pick up the other person's work, fetch and merge their branch (or `main`) into yours. Do not
  rebase or force-push a branch that is already on GitHub.
- When both people changed the same file, show the conflict to the person you work with; do not
  resolve it by dropping the other person's change.

## Deploying

Deploys happen only through GitHub. Never deploy from the computer with the Vercel CLI.

There is one Vercel project, `sunpower`, with `web` as its root directory.

| Environment | Builds from | Address |
| --- | --- | --- |
| Production | branch `main` | `sun-power.co.il`, after the DNS change |
| Preview (the test site) | branch `asaf`, and any other branch | The branch's preview address, shown on its deployment in Vercel |

The separate `sunpower-staging` project was dropped on 25.11.2026.

## Layout

| Path | What it holds |
| --- | --- |
| `web/` | The site: Next.js 16 (App Router), React 19, Tailwind v4, TypeScript |
| `web/app/[[...slug]]/page.tsx` | Renders every converted page from `site.json` |
| `web/components/` | Shared components; `home/` holds the home page sections |
| `web/app/globals.css` | Design tokens and global styles |
| `web/content/site.json` | All converted pages. Generated: do not edit by hand |
| `web/content/knowledge.ts` | Knowledge center: articles, questions, glossary, map data |
| `web/proxy.ts` | Redirects from old addresses |
| `web/app/api/lead/route.ts` | Form endpoint, sends leads by email |
| `web/public/` | Images and the web versions of the videos |
| `migration/raw/` | Copy of the old site, the source for the conversion |
| `migration/tools/` | Conversion, approved overrides, launch check, site comparison |
| `LAUNCH_PLAN.md`, `AUDIT.md` | Launch steps and the pre-launch audit (Hebrew) |

Next.js 16 differs from older versions. Before writing Next.js code, read the relevant guide in
`web/node_modules/next/dist/docs/`, as `web/AGENTS.md` says.

## Running

```bash
npm --prefix web install
npm --prefix web run dev
npm --prefix web run build
npm --prefix web run lint
```

- The site runs and builds with no `.env` file. Without settings, pages are served with
  `noindex`, Analytics is off, and the forms do not send email. That is the right state for
  local work.
- In the Claude desktop app, the dev server is the `sunpower-web` entry in `.claude/launch.json`.
- Run `build` and `lint` before pushing. A failed build fails the Vercel deploy.

## Rules for changes

- **Addresses and SEO are frozen.** Do not change a page's address, title, canonical or
  redirects unless the person you work with asks for exactly that. The old site's search ranking
  depends on them.
- **Text of converted pages** comes from the old site. An approved change goes into
  `migration/tools/overrides.json`, and then the content is regenerated:

  ```bash
  python3 -I migration/tools/convert.py migration/raw web/content
  python3 -I migration/tools/enhance.py migration/raw web
  ```

- Design and layout changes go in the components and `globals.css`, not in `site.json`.
- Everything is Hebrew and right-to-left. Check every visual change at phone width as well as
  desktop.
- `SITE_INDEXABLE` and `NEXT_PUBLIC_GA_ID` are set only for the Production environment of the
  Vercel project, on launch day. Never set them for Preview or local work: the test site would
  then be open to search engines.

## What is not in the repository

These exist only on Asaf's computer and are ignored by git. The site does not need them.

| Path | What it is |
| --- | --- |
| `video-src/` | Source clips and masters of the opening film. Needed only to re-edit the film |
| `migration/raw/media/` | Raw copy of the old media library. The same files are in `web/public/wp-content/uploads` |
| `backup-private/` | Full backups of the old site, with personal data and secrets. Never commit or share |
| `web/.env.local`, `web/.vercel/` | Local settings. Secrets live only in the Vercel dashboard |

Never commit passwords, keys or personal details of site visitors.
