# Research brief: what Streaming could become

Paste everything below the line into a Claude session (Opus) on the account where `diniscruz-agent` works. Written by sites.b@SovereignWebsite.dinis on 21 November 2026, at Dinis Cruz's request: "delegate also to that account ... to do a bit more research on what we can do, because this is a great example of a sovereign site that we can do that actually would be quite useful ... you can even build an app on it ... for personal use, but non-commercial ... be quite creative with this and look at all the stuff that we already do on this, and even the connection of the multiple data sets that we have."

---

You are a researcher for Dinis Cruz. Write a report, in plain British English without em dashes, saved as `docs/research/2026-11-21-what-streaming-could-become.md` in https://github.com/SovereignWebsite/Site__Tool__Streaming (branch `dev`, signed commit; see `docs/prompt-for-the-build-agent.md` for signing and the rules). Every claim cited with its link and the date you read it; mark anything you estimate as an estimate.

## The question

Streaming (https://streaming.tool.sovereignweb.site) is a sovereign, personal, non-commercial app for what is streaming in the United Kingdom and Portugal, in English and Portuguese, the sovereign layer around PrompTugal's streaming page (https://data.promptugal.news/streaming/): the owner's own watchlist, notes and preferences, kept in the browser and later in an encrypted vault, each title linking to that page, with no TMDB data of its own (Dinis agreed this plan on 21 November 2026; see docs/decisions.md). What could it become, as a showcase of a sovereign website that is genuinely useful?

## What to look at

1. **What already exists in our world:** data.promptugal.news (https://data.promptugal.news/llms.txt: every open source and its terms), the PrompTugal sites (promptugal.news, events, weather, videos, live, travel, library), the Sovereign Website family (https://sovereignwebsite.ai, https://hub.sovereignweb.site), the vault and key-once pattern (https://vault.sovereignwebsite.site), the Mistral provider site (https://mistral.provider.sovereignweb.site: in-browser models and the visitor's own key), and the Whois tool's privacy notice pattern.
2. **Connections between datasets** that respect each source's terms: weather and what to watch, events and films in the same city, London data, Portuguese public data, travel. Which joins are allowed, which are not, and why.
3. **Personal features in the browser:** watchlists, "seen", recommendations computed locally (or by a small model in the browser, such as Ministral 3 3B on the Mistral site, or the visitor's own model key), family profiles, notifications without a server (what is possible with static files, a service worker, a calendar file), sharing a list without an account (signed links, QR codes, the vault).
4. **An app:** a Progressive Web App, offline use, install on phone and TV browser; what is possible without servers or tracking.
5. **The terms:** TMDB's API terms (https://www.themoviedb.org/api-terms-of-use), its attribution rules, rate limits, what "non-commercial" allows, what may and may not be cached or stored and for how long, the rule on AI systems, JustWatch's position on where-to-watch data, and the services' own trademarks. Say plainly what we must not do.
6. **Ideas ranked:** ten to twenty ideas, each with what it needs, the terms it touches, effort (small, medium, large) and why a visitor would care; then your top five for the next two weeks.

## Rules

- Do not read or copy TMDB's catalogue data yourself, and do not read the list on data.promptugal.news/streaming/: under TMDB's terms it is not offered to agents or AI systems. Read TMDB's documentation and terms only.
- Never invent a fact, a feature of another product, a price or a figure. Name no private person.
- Report to Dinis in your session when the report is pushed, with its link.
