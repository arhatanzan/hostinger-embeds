# hostinger-embeds

Custom-code embeds for kaifabbas.com (Hostinger), plus the shared assets they load. Hosted on Netlify at `https://arhatembeds.netlify.app/`.

## Hostinger: what to paste

Every Hostinger "Embed code" element holds a single line. Content, styles and scripts all come from Netlify, so edits go live on push with no re-pasting.

| Page | Paste |
|---|---|
| `/lab` | `<script src="https://arhatembeds.netlify.app/assets/js/embed.js" data-embed="lab"></script>` |
| `/civic-games` | `<script src="https://arhatembeds.netlify.app/assets/js/embed.js" data-embed="civic-games"></script>` |
| Meet | `<script src="https://arhatembeds.netlify.app/assets/js/embed.js" data-embed="meet"></script>` |
| Products | `<script src="https://arhatembeds.netlify.app/assets/js/embed.js" data-embed="product"></script>` |
| Blog | `<script src="https://arhatembeds.netlify.app/assets/js/embed.js" data-embed="blog"></script>` |
| Any content block | `<script src="https://arhatembeds.netlify.app/assets/js/embed.js" data-block="research"></script>` |

`embed.js` fetches `/embeds/<name>.html` or `/blocks/<name>.html`, inserts it where the tag is, and runs its scripts in order. Hostinger resizes the element to the content automatically.
Netlify's edge-injected badge/toolbar script is excluded from fetched fragments;
it is page chrome, not embed content. To disable the badge on direct Netlify
previews too, turn off **Project configuration > General > Powered by Netlify badge**
in the Netlify dashboard (no redeploy needed).

## Structure

`public/` is the deployed site:

- `embeds/`: the lab, civic-games, meet, product and blog embeds. Open e.g. `/embeds/lab.html` directly to preview one.
  - `lab.html`: games grid; cards link to `/civic-games?game=<slug>`.
  - `civic-games.html`: the `/civic-games` page; loads the selected game from `democracylab.netlify.app`.
  - `meet.html`: responsive full-width frame for the Meet page, with camera/microphone access delegated to the embedded page.
    Uses width-based heights capped at 720px on desktop, with taller heights
    below Linklee's 640px mobile breakpoint, rather than `100vh`, which would depend on Hostinger's
    own auto-sized embed frame. The Contact
    page scrolls normally; the booking frame has room for the calendar without
    nested scrollbars. Linklee is cross-origin and does not currently publish
    content-height messages, so recheck these heights when its layout changes.
  - `product.html`, `blog.html`: products and blog grids.
    The blog date filter uses a newest-first Year dropdown and a Month dropdown
    limited to dates in the selected year. Leave Month at "All months" to show the
    whole year; selecting "All years" or Reset clears the month selection.
    Month displays "Select year first" until a year is chosen.
    Options come from published rows (`flag = 1`) in the configured Google Sheet,
    not a hardcoded list. The `date` column can be a Sheet date (its underlying
    value drives filtering, while its formatted value stays on the card) or
    text such as `Jan, 2026` / `January 2026`. No new sheet columns are needed.
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
- Embed previews: http://localhost:8888/embeds/lab.html (also `product`, `blog`, `civic-games`, `meet`)

The blog loads JS/CSS relative to its HTML, so local previews use local changes.
The one-line embed loader resolves those assets against the fetched template URL
on Netlify, keeping Hostinger embeds working. Other embeds still use production
asset URLs in their direct previews.

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

## Blog: automatic Google Sheet metadata

The optional [sheet-bound Apps Script](scripts/google-sheets/blog-autofill.gs)
fills blank cells when you paste a URL into `articleURL` on the `Blogs` tab.
It writes into the sheet itself; the website continues reading the same columns.
No API keys, external metadata services, or Netlify backend are needed.

### One-time installation

1. Open the Google Sheet as an editor. Choose **Extensions > Apps Script**.
2. Paste `scripts/google-sheets/blog-autofill.gs` into a script file and save it.
   If the project already has an `onOpen` function, merge the menu setup into it.
3. Run **installBlogAutofill** once and approve the Google permissions to read/write
   this sheet and fetch article URLs. Use one designated owner account to install
   the trigger; different accounts can otherwise install duplicate triggers.
4. Reload the sheet. A **Blog metadata** menu will appear.
5. Paste a public article URL into an `articleURL` cell. After the import finishes,
   review the populated values before manually setting `flag` to `1`.

Header names are case-insensitive, so `articleUrl` and `imageUrl` also work.
The tab must be named `Blogs` (or change `BLOG_AUTOFILL.sheetName` in the script).
Only existing columns are filled; no columns or formats are added.

| Column | Imported value, when supplied by the article |
|---|---|
| `title` | Open Graph / Twitter preview title, article structured headline, or page title |
| `imageURL` | Preview image URL, resolved to an absolute URL |
| `summary`, `description` | Short preview description, **not the full article** |
| `date`, `fullDate` | Article publication calendar date stored as a real Sheet date in the sheet's timezone |
| `category` | Article section |
| `readMinutes` | Explicit structured reading duration, rounded up to minutes |

`id`, `type`, `price`, and `flag` stay manual. Missing values are not guessed.
The existing Sheet cell formats control how dates display.

### Manual overrides and retries

- **Existing values and formulas are never overwritten**, including values previously
  generated by the script. Edit any populated cell normally to override it.
- To regenerate a field, clear only that cell and use **Blog metadata > Fill blank
  cells in selected rows**. The same menu can import existing URLs.
- Changing `articleURL` does not replace old row values. For a different article,
  use a new row or clear the metadata fields you want to replace first.
- Multi-row pastes are supported, up to 20 rows per edit/menu action. For larger
  imports, select smaller batches. Automatic imports run on user edits, not formula
  recalculations or API/script writes; use the menu for those.
- Blocked/paywalled/JavaScript-only sites may provide little or no metadata.
  The script does not bypass access restrictions. Fill unavailable fields manually.
- Import failures appear in a sheet toast and the Apps Script **Executions** log;
  installed trigger failures also use Google's trigger failure notifications.
  Unavailable metadata stays blank; other rows in the batch still run.

The script fetches the article URL from Google's servers and follows up to five
redirects. Only use public article links, not private/signed URLs. Website metadata
is untrusted: review it before publishing. Image hotlinking and reuse are subject to
the source site's permissions; a preview URL does not grant reuse rights.

Local regression checks (mock Google services; no sheet writes or external fetches):

```bash
node --test scripts/google-sheets/blog-autofill.test.mjs
```

## Games

Games are listed in the `Games` tab of the sheet. To publish one, add a row with `productUrl` = `/game-<slug>` (matching `games/game-<slug>.html` on Netlify), `title`, `summary`, `category`, `imageUrl`, and `flag` = `1`. The lab grid, carousel and `/civic-games` pick it up automatically.
