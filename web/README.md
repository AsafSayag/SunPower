# SunPower — sun-power.co.il

The company site, moved from WordPress (uPress) to Next.js on Vercel with every address,
text and SEO tag of the old site preserved.

## Layout of the repository

| Path | What it holds |
| --- | --- |
| `web/` | The site (Next.js App Router) |
| `web/content/site.json` | All converted pages, generated — do not edit by hand |
| `web/content/knowledge.ts` | Knowledge center: articles, questions, glossary, map data |
| `web/proxy.ts` | Redirects for old addresses (slugs, `/?p=` ids) |
| `web/app/api/lead/route.ts` | Form endpoint (email through the business mailbox) |
| `migration/raw/` | Copy of the old site: page HTML, REST data, archived pages |
| `migration/tools/` | Conversion, overrides, launch check and site comparison |
| `LAUNCH_PLAN.md` | DNS changes and launch-day steps |

## Changing content

Text of the converted pages comes from the old site. Approved changes (descriptions, alt
texts, internal links, figures, address) live in `migration/tools/overrides.json`. After
editing it, regenerate:

```bash
python3 -I migration/tools/convert.py migration/raw web/content
python3 -I migration/tools/enhance.py migration/raw web
```

## Running

```bash
cd web && npm install && npm run dev
```

## Environment variables

See `web/.env.example`. On test environments leave `SITE_INDEXABLE` unset: the site then
sends `noindex` everywhere. Set it to `true` only on the live domain.

## Checks before and after a deploy

```bash
python3 -I migration/tools/launch_check.py https://sunpower-staging.vercel.app
python3 -I migration/tools/compare_sites.py https://sunpower-staging.vercel.app
```

On launch day add `--live` to the first command, against `https://sun-power.co.il`.

## Deploying

Two Vercel projects: `sunpower-staging` (test, linked in `web/.vercel`) and `sunpower`
(production, attached to the domain).
