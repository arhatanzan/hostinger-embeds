# hostinger-embeds

Custom-code embeds for kaifabbas.com (Hostinger), plus the shared assets they load. Hosted on Netlify at `https://arhatembeds.netlify.app/`.

## Hostinger: what to paste

Every Hostinger "Embed code" element holds a single line. Content, styles and scripts all come from Netlify, so edits go live on push with no re-pasting.

| Page | Paste |
|---|---|
| `/lab` | `<script src="https://arhatembeds.netlify.app/assets/js/embed.js" data-embed="lab"></script>` |
| `/civic-games` | `<script src="https://arhatembeds.netlify.app/assets/js/embed.js" data-embed="civic-games"></script>` |
| Products | `<script src="https://arhatembeds.netlify.app/assets/js/embed.js" data-embed="product"></script>` |
| Blog | `<script src="https://arhatembeds.netlify.app/assets/js/embed.js" data-embed="blog"></script>` |
| Any content block | `<script src="https://arhatembeds.netlify.app/assets/js/embed.js" data-block="research"></script>` |

`embed.js` fetches `/embeds/<name>.html` or `/blocks/<name>.html`, inserts it where the tag is, and runs its scripts in order. Hostinger resizes the element to the content automatically.

## Structure

`public/` is the deployed site:

- `embeds/`: the lab, civic-games, product and blog embeds. Open e.g. `/embeds/lab.html` directly to preview one.
  - `lab.html`: games grid; cards link to `/civic-games?game=<slug>`.
  - `civic-games.html`: the `/civic-games` page; loads the selected game from `democracylab.netlify.app`.
  - `product.html`, `blog.html`: products and blog grids.
- `blocks/`: content-only HTML for the static page sections (research, books, metrics, ...).
- `assets/js/embed.js`: the one-line loader used on Hostinger.
- `assets/js/admin-config.js`: Google Sheet IDs, tab names and per-page defaults. Also loaded by the game pages (`hostinger-civic-games` repo) for the carousel.
- `assets/js/store-logic.js`, `assets/css/store-style.css`: shared grid logic and styles for the embeds.
- `assets/css/blocks.css`: shared styles for `blocks/`. `assets/js/blocks.js` is the older `<div data-kb-block>` loader, kept so existing pastes keep working.
- `admin/`: block builder (see below). `/` redirects here.
- `preview.html`: every block on one page.

Also:

- `scripts/build.mjs`: runs on every Netlify build; writes the git-ignored `public/blocks/index.json` (block list for the builder).
- `netlify.toml`: publish `public/`, CORS headers for `/assets/*`, `/blocks/*` and `/embeds/*`, `noindex` for `/admin/` and `/embeds/`.

## Local development

Requires Node and the Netlify CLI (`npm i -g netlify-cli`).

```bash
npm run dev    # runs the build, then `netlify dev` on http://localhost:8888
```

- Builder: http://localhost:8888/admin/
- All blocks: http://localhost:8888/preview.html
- Embed previews: http://localhost:8888/embeds/lab.html (also `product`, `blog`, `civic-games`)

The embeds load their JS/CSS from the production URL, so previews show the deployed assets.

## Netlify setup

Link the site to this repo (Site configuration → Build & deploy → Link repository). `netlify.toml` provides the settings, so leave the UI build fields empty. Every push to `main` deploys automatically; no cache purging needed.

## Content blocks

Paste the `data-block` line from the table above (the name is the file in `public/blocks/`, without `.html`). Edit text in `public/blocks/<name>.html` and styles in `public/assets/css/blocks.css`.

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

## Games

Games are listed in the `Games` tab of the sheet. To publish one, add a row with `productUrl` = `/game-<slug>` (matching `games/game-<slug>.html` on Netlify), `title`, `summary`, `category`, `imageUrl`, and `flag` = `1`. The lab grid, carousel and `/civic-games` pick it up automatically.
