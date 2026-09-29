# hostinger-embeds

Custom-code embeds for kaifabbas.com (Hostinger), plus the shared assets they load. Hosted on Netlify at `https://arhatembeds.netlify.app/`.

## Structure

- `embeds/` (**not deployed**): HTML to paste into Hostinger "Embed code" elements.
  - `lab.html`: games grid; cards link to `/civic-games?game=<slug>`.
  - `civic-games.html`: the `/civic-games` page; loads the selected game from `democracylab.netlify.app`.
  - `product.html`, `blog.html`: products and blog grids.
- `public/` (**the deployed site**):
  - `assets/js/admin-config.js`: Google Sheet IDs, tab names and per-page defaults. Also loaded by the game pages (`hostinger-civic-games` repo) for the carousel.
  - `assets/js/store-logic.js`, `assets/css/store-style.css`: shared grid logic and styles for the embeds.
  - `blocks/`: content-only HTML for the static page sections (research, books, metrics, ...).
  - `assets/js/blocks.js`, `assets/css/blocks.css`: loader and shared styles for `blocks/`.
  - `admin/`: block builder (see below). `/` redirects here.
  - `preview.html`: every block on one page.
- `scripts/build-blocks-index.mjs`: writes `public/blocks/index.json` (block list for the builder). Runs on every Netlify build; the file is git-ignored.
- `netlify.toml`: publish `public/`, CORS headers for `/assets/*` and `/blocks/*`, `noindex` for `/admin/`.

## Local development

Requires Node and the Netlify CLI (`npm i -g netlify-cli`).

```bash
npm run dev    # builds blocks/index.json, then `netlify dev` on http://localhost:8888
```

- Builder: http://localhost:8888/admin/
- All blocks: http://localhost:8888/preview.html

Embeds point at the production URL. To test one against local files, copy it somewhere outside `public/`, replace `https://arhatembeds.netlify.app/` with `http://localhost:8888/`, and open it from another local server (that also exercises the CORS headers).

## Netlify setup

Link the site to this repo (Site configuration → Build & deploy → Link repository). `netlify.toml` provides the settings, so leave the UI build fields empty. Every push to `main` deploys automatically; no cache purging needed.

## Content blocks

Each Hostinger embed element only needs this (the name is the file in `public/blocks/`, without `.html`):

```html
<div data-kb-block="research"></div>
<script src="https://arhatembeds.netlify.app/assets/js/blocks.js"></script>
```

Edit text in `public/blocks/<name>.html` and styles in `public/assets/css/blocks.css`; nothing needs re-pasting into Hostinger.

Building blocks available in `blocks.css`:

- `kb-page` + `kb-10col`: 12-col page, content in cols 2–12; 1/2/3 per row (add `kb-4up` for 4 on desktop).
- `kb-line-item`: gold left-line item (`h3`, `h4`, `p`, `ul`, `p.kb-citation`).
- `kb-split-item` (inside `kb-10col kb-split`): side-by-side columns separated by a centred gold divider; stacks on mobile.
- `kb-pill` (inside `kb-10col kb-pills` or `kb-pill-row`) with `kb-pill-num` / `kb-pill-sub`.
- `kb-cards` + `kb-card`: gold-framed cards.
- Theme on the outer div: `kb-light` (navy text) or `kb-dark` (cream text); extras `kb-gold-titles`, `kb-compact`.
- `kb-full` on `kb-10col`: use the full width instead of columns 2–12.

## Block builder (`/admin/`)

A static form that writes block HTML for you, with a live preview using `blocks.css`.

- It never writes anything itself: "Create on GitHub" opens GitHub's new-file page pre-filled, and for existing blocks it copies the HTML and opens GitHub's editor. You review and commit there (you must be logged in with access to the repo), so a bad edit is just a git revert.
- Text is escaped (no raw HTML), links must be `http(s)`, and names are limited to `a-z 0-9 _ -`.
- It warns if a name already exists (from `blocks/index.json`). Drafts autosave in the browser.
- Styles are not editable there; change `public/assets/css/blocks.css` in code.

## Updating

1. Commit and push to `main`; Netlify deploys in about a minute.
2. Hard refresh the site.

Changes to files in `embeds/` must also be pasted into the matching Hostinger embed element.

## Games

Games are listed in the `Games` tab of the sheet. To publish one, add a row with `productUrl` = `/game-<slug>` (matching `games/game-<slug>.html` on Netlify), `title`, `summary`, `category`, `imageUrl`, and `flag` = `1`. The lab grid, carousel and `/civic-games` pick it up automatically.
