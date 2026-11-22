# Streaming's five designs

Written by streaming.d@SovereignWebsite.dinis, keeper of Streaming, on 22 November 2026, after Dinis Cruz said in the keeper's session: "start with those designs, and really try to explore the whole idea of visualizing it, and showing the data in quite interactive ways, and leveraging the images". Dinis's guideline: five designs with a "Choose a design" control on every page.

## What every design shares

- **Only the owner's own data.** The titles they added, the status, rating, tags, note, the dates added and seen, and their own pictures. No catalogue data, no TMDB data, nothing fetched about a title, and no images from anywhere else (docs/decisions.md).
- **Pictures come from two places only.** A generated poster, drawn in the browser from the title itself (its colours, shapes and type follow from the words, so a title always gets the same poster), or a picture the owner adds, shrunk and kept in their browser only.
- **The same actions everywhere.** Add (box, paste anywhere, or `/`), mark as seen, hide, rate, tag, note, the record per title with its JSON, pick something for tonight, undo. The same keyboard and screen reader support, and the same checks (axe with the WCAG 2.2 rules, no sideways scroll at 320 px).
- **Light and dark for each design**, following the device. "Automatic" means the home design, light or dark.
- **Both languages**, English at `/` and European Portuguese at `/pt/`.

## 1. The shelf (home design)

- **Philosophy:** a list of films should look like films. The owner's titles are covers on a shelf, and the cover is the thing you touch.
- **Visual narrative:** a dark room with a lit shelf, where every title is a poster. Seen titles carry a small ribbon, ratings sit under the cover, and tags are the shelf labels you filter by.
- **Pipeline:** tabs and tag labels at the top, then a responsive grid of covers (two across on a phone, up to six on a wide screen). Tap a cover to open its record; the quick actions sit under each cover.

## 2. The queue

- **Philosophy:** most evenings the question is "what next?", not "what is on my list?".
- **Visual narrative:** one large card for tonight's title at the top, with the next titles in a strip beneath it, like a programme running order.
- **Pipeline:** the first title in the owner's own order fills the top card (or the picked one, after "Pick something for tonight"). The rest follow in order, each with "Move up" and "Move down", so the owner can arrange the evening. Marking tonight's title as seen brings the next one forward.

## 3. The index cards

- **Philosophy:** for people who keep notes on what they watch, the note is the point.
- **Visual narrative:** a box of index cards. Each title is a card with a ruled face, the note written large, the tags as coloured tabs and the small poster in a corner.
- **Pipeline:** cards in a single column on a phone and two on a wide screen, the note always visible, editing in place.

## 4. The ticket stubs

- **Philosophy:** what you have watched is a story worth seeing.
- **Visual narrative:** each seen title is a ticket stub, torn and dated, laid along a timeline by month, with a small panel of the owner's own figures: titles seen per month, how the ratings spread, and the tags used most.
- **Pipeline:** the charts at the top (inline SVG, drawn from the owner's list only), then the stubs month by month, newest first. Titles still to watch wait at the end as unused tickets.

## 5. The list

- **Philosophy:** calm and quick, for people who want a checklist.
- **Visual narrative:** the notebook by the television.
- **Pipeline:** today's layout: tabs, compact rows with stars and one-tap actions, notes on demand, a small poster beside each title.

## What is not here yet

- A picture from an open source (Wikidata or Wikimedia Commons) would mean a request to Wikimedia from each visitor's browser; it waits for Dinis.
- Links to a per-title record on PrompTugal's page wait for the data agent and Dinis (docs/decisions.md: no TMDB data on this site).
