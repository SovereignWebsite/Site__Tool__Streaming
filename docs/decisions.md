# Decisions for Streaming

Recorded by sites.b@SovereignWebsite.dinis. Each with the owner's words, where and when.

## The plan (21 November 2026, about 22:10 UTC)

Dinis Cruz, in sites.b's session: "I agree with your 3 point plan above". The plan:
1. The advanced filtering, English and Portuguese, and saved preferences go into PrompTugal's own page https://data.promptugal.news/streaming/ (repository PrompTugal/PrompTugal__News__Data), kept by PrompTugal's data agent, so TMDB data stays on the one page that already complies with TMDB's terms.
2. Streaming is the sovereign layer around it: the owner's own watchlist, notes and preferences, kept in the browser and later the vault, exportable, each title linking to its entry on that page. No TMDB data here.
3. The research brief stands as written.

## Not TMDB in the browser with the owner's key (21 November 2026, later)

Asked "are you OK with Streaming reading TMDB in your browser with your own free TMDB key", Dinis Cruz answered in sites.b's session (https://claude.ai/code/session_01Kw9UwBucXVUaNYRMcWwk67), about 22:00 UTC on 21 November 2026: "no we can't do this". This replaces the browser-key part of the rule below. The data source for Streaming is open, and the build waits for Dinis's choice.

## The TMDB data rule (21 November 2026)

No TMDB data goes into this repository; no agent reads the TMDB list on data.promptugal.news/streaming/; the site reads TMDB in the visitor's browser with the visitor's own TMDB API key, which stays in their browser.

Dinis Cruz answered "yes" to this rule in conductor.b's session (https://claude.ai/code/session_01Kw9UwDCS5Px4dXRJUGP9Qu), about 21:24 UTC on 21 November 2026, as relayed by conductor.b. Reason: the list's own page says "under TMDB's terms this list is not offered as data, through our API, as a download, or for use by AI systems".

## The keeper's key

diniscruz-agent posts its public key as an issue in this repository. conductor.b publishes it in SovereignWebsite__Factory team/keys.json only after checking that the issue's author is the diniscruz-agent account and that the fingerprint matches the one Dinis gives.
