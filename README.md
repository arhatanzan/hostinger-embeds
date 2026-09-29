# hostinger-embeds

Custom-code embeds for kaifabbas.com (Hostinger) plus the shared admin config they load. Served via jsDelivr.

## Structure

- `embeds/`: HTML to paste into Hostinger "Embed code" elements.
  - `lab.html`: games grid; cards link to `/civic-games?game=<slug>`.
  - `civic-games.html`: the `/civic-games` page; loads the selected game from `democracylab.netlify.app`.
  - `product.html`, `blog.html`: products and blog grids.
- `assets/js/admin-config.js`: Google Sheet IDs, tab names and per-page defaults. Also loaded by the Netlify game pages (`hostinger-civic-games` repo) for the carousel.
- `assets/js/store-logic.js`, `assets/css/store-style.css`: shared grid logic and styles.
- `blocks/`: content-only HTML for the static page sections (research, books, metrics, ...).
- `assets/js/blocks.js`, `assets/css/blocks.css`: loader and shared styles for `blocks/`.
- `preview.html`: local preview of every block (`python3 -m http.server`, then open `/preview.html`).
- `admin/`: block builder for creating/editing blocks without touching code (see below).

CDN base: `https://cdn.jsdelivr.net/gh/arhatanzan/hostinger-embeds@main/`

## Content blocks

Each Hostinger embed element only needs this (change the name to the file in `blocks/`, without `.html`):

```html
<div data-kb-block="research"></div>
<script src="https://cdn.jsdelivr.net/gh/arhatanzan/hostinger-embeds@main/assets/js/blocks.js"></script>
```

Edit text in `blocks/<name>.html` and styles in `assets/css/blocks.css`; nothing needs re-pasting into Hostinger.

Building blocks available in `blocks.css`:

- `kb-page` + `kb-10col`: 12-col page, content in cols 2–12; 1/2/3 per row (add `kb-4up` for 4 on desktop).
- `kb-line-item`: gold left-line item (`h3`, `h4`, `p`, `ul`, `p.kb-citation`).
- `kb-split-item` (inside `kb-10col kb-split`): side-by-side columns separated by a centred gold divider; stacks on mobile.
- `kb-pill` (inside `kb-10col kb-pills` or `kb-pill-row`) with `kb-pill-num` / `kb-pill-sub`.
- `kb-cards` + `kb-card`: gold-framed cards.
- Theme on the outer div: `kb-light` (navy text) or `kb-dark` (cream text); extras `kb-gold-titles`, `kb-compact`.
- `kb-full` on `kb-10col`: use the full width instead of columns 2–12.

## Block builder (`admin/`)

A static form that writes block HTML for you, with a live preview using `blocks.css`.

- Open it by deploying this repo to Netlify (publish directory: repo root, no build) and visiting `/admin/`, or locally via `python3 -m http.server` → `http://localhost:8000/admin/`. jsDelivr can't host it (it serves HTML as plain text).
- It never writes anything itself: "Create on GitHub" opens GitHub's new-file page pre-filled, and for existing blocks it copies the HTML and opens GitHub's editor. You review and commit there, so a bad edit is just a git revert.
- Text is escaped (no raw HTML), links must be `http(s)`, and names are limited to `a-z 0-9 _ -`, so it can't produce broken markup or clash with the loader.
- It warns if a name already exists in `blocks/` on GitHub. Drafts autosave in the browser.
- Styles are not editable there; change `assets/css/blocks.css` in code.

## Updating

1. Commit and push to `main`.
2. Purge the changed file(s) so jsDelivr serves the new version, e.g.
   `https://purge.jsdelivr.net/gh/arhatanzan/hostinger-embeds@main/assets/js/admin-config.js`
3. Hard refresh the site.

Changes to files in `embeds/` must also be pasted into the matching Hostinger embed element.

## Games

Games are listed in the `Games` tab of the sheet. To publish one, add a row with `productUrl` = `/game-<slug>` (matching `games/game-<slug>.html` on Netlify), `title`, `summary`, `category`, `imageUrl`, and `flag` = `1`. The lab grid, carousel and `/civic-games` pick it up automatically.
