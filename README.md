# hostinger-embeds

Custom-code embeds for kaifabbas.com (Hostinger) plus the shared admin config they load. Served via jsDelivr.

## Structure

- `embeds/`: HTML to paste into Hostinger "Embed code" elements.
  - `lab.html`: games grid; cards link to `/civic-games?game=<slug>`.
  - `civic-games.html`: the `/civic-games` page; loads the selected game from `democracylab.netlify.app`.
  - `product.html`, `blog.html`: products and blog grids.
- `assets/js/admin-config.js`: Google Sheet IDs, tab names and per-page defaults. Also loaded by the Netlify game pages (`hostinger-civic-games` repo) for the carousel.
- `assets/js/store-logic.js`, `assets/css/store-style.css`: shared grid logic and styles.

CDN base: `https://cdn.jsdelivr.net/gh/arhatanzan/hostinger-embeds@main/`

## Updating

1. Commit and push to `main`.
2. Purge the changed file(s) so jsDelivr serves the new version, e.g.
   `https://purge.jsdelivr.net/gh/arhatanzan/hostinger-embeds@main/assets/js/admin-config.js`
3. Hard refresh the site.

Changes to files in `embeds/` must also be pasted into the matching Hostinger embed element.

## Games

Games are listed in the `Games` tab of the sheet. To publish one, add a row with `productUrl` = `/game-<slug>` (matching `games/game-<slug>.html` on Netlify), `title`, `summary`, `category`, `imageUrl`, and `flag` = `1`. The lab grid, carousel and `/civic-games` pick it up automatically.
