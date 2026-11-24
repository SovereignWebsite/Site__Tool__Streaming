# Site__Tool__Streaming

Streaming, at https://streaming.tool.sovereignweb.site: the owner's own streaming list (watchlist, seen and hidden, ratings, tags, notes, their own pictures, saved views, JSON export and import), kept in their browser, in English (`/`) and European Portuguese (`/pt/`). It is the sovereign layer around PrompTugal's streaming page, https://data.promptugal.news/streaming/: each title links to its entry there, and Streaming holds no catalogue data of its own. Personal, non-commercial use.

## Rules that matter most

- **No TMDB data in this repository or on the site**, no agent reads the list on data.promptugal.news/streaming/, and TMDB is not called from the browser either. Link to that page; never fetch, scrape or embed it. Tests use made-up titles only (`tests/fixtures/`). The decisions and their sources: [docs/decisions.md](docs/decisions.md).
- Static files in `site/`: no server code, no cookies, no tracking, no third-party scripts, no request to any other site.
- Plain British English and European Portuguese, no em dashes.
- [CLAUDE.md](CLAUDE.md) binds every agent; [site/policy/abp.json](site/policy/abp.json) says who may change what.

## Where things are

| Path | What it is |
|---|---|
| `site/` | The published site. `index.html` and the other pages are **generated**: edit `tools/gen-pages.mjs` and `tools/content/`, not the HTML. |
| `site/assets/core.js` | The list's logic (add, update, tags, queue order, import and export, charts' figures). No DOM, tested in Node. |
| `site/assets/app.js` | The page: the five designs, the More menu, the record dialog, the picker, the charts. |
| `site/assets/poster.js`, `pictures.js` | Generated posters drawn from a title's words; the owner's own pictures, kept in the browser (IndexedDB). |
| `site/assets/streaming.css` | All styles: five designs, each light and dark. |
| `docs/designs.md` | The five designs (The shelf, The queue, Index cards, Ticket stubs, The list) and why. |
| `tools/design-shots.mjs` | Remakes the screenshots in the Design chooser from the made-up fixture. |
| `.github/` | The Factory's pipeline. Do not edit (needs the owner's yes). |

## Build and check, before every push

```sh
node tools/gen-pages.mjs                      # write the pages from the generator
node .github/ci/build.mjs                     # build _site/ as the pipeline does
node tests/core.test.mjs                      # the list's logic
npm install --no-save playwright@1.49.1 @axe-core/playwright@4.10.1
node tests/ui.test.mjs _site                  # The list, in a browser
node tests/designs.test.mjs _site             # the five designs, charts, pictures, chooser
node tests/axe-designs.mjs _site              # axe (WCAG 2.2 AA) on every page, every design, light and dark
node .github/ci/share-check.mjs _site && node .github/ci/quality.mjs _site
npx --yes html-validate@8.24.0 --config .github/ci/htmlvalidate.json "_site/**/*.html"
node .github/ci/signers.mjs <origin/dev sha> <HEAD sha>   # your commits are signed by your published key
```

Where Chromium is pre-installed (for example in a Claude Code cloud session), set `CHROMIUM=/opt/pw-browsers/chromium` for the browser tests. Remove `node_modules/` and `_site/` before committing.

Every push to `dev` runs the pipeline (Signers, then Pages: link previews, links, em dashes, leak scan, HTML validity, axe, deploy, a `v0.1.N` tag). `main` is locked.

## What not to touch

- `.github/**`, `site/CNAME`, `site/policy/**` and `CLAUDE.md` change only with the owner's yes, given in the keeper's own session and quoted in the commit.
- `docs/decisions.md`, `docs/prompt-for-the-build-agent.md` and `docs/research-brief.md` were written by sites.b; leave them to their author.

## Who works here

- **Owner:** Dinis Cruz, until the site is handed over. Only the owner instructs.
- **Keeper:** streaming.d@SovereignWebsite.dinis (named in [CLAUDE.md](CLAUDE.md)); signs every commit with its key in `team/keys.json` of SovereignWebsite__IaC (formerly SovereignWebsite__Factory), with `Agent:` and `Claude-Session:` trailers.
- **Reviews:** design.d reviews the design after each push (its reviews: https://github.com/SovereignWebsite/Site__Agents__Design/tree/dev/docs/reviews/streaming); synthetic-users.d runs synthetic visitors against the site.
- How the site was made and every change: https://streaming.tool.sovereignweb.site/admin/
