import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const origin = "https://arhatembeds.netlify.app";
const publicDir = new URL("../public/", import.meta.url);
const columns = ["title", "summary", "category", "articleURL", "productUrl", "imageUrl", "flag", "date", "readMinutes"];
const rows = Array.from({ length: 13 }, (_, index) => [
  `Published item ${index + 1}`, "Research and civic engagement", "Research",
  `https://www.kaifabbas.com/blog-post${index + 1}`, `/game-example-${index + 1}`,
  "https://images.example.com/cover.png", index === 12 ? "0" : "1", "January 2026", "5"
]);

async function mockAssets(page, { failedContent = false, failedSheet = false } = {}) {
  await page.route(`${origin}/**`, async route => {
    const path = new URL(route.request().url()).pathname.slice(1);
    if (failedContent && path === "blocks/research.html") return route.fulfill({ status: 503, body: "Unavailable" });
    const sourcePath = path === "assets/js/admin-config.runtime.js" ? "assets/js/admin-config.js" : path;
    let body = await readFile(new URL(sourcePath, publicDir), "utf8");
    if (path === "assets/js/admin-config.runtime.js") body = body.replace("__SHEET_ID__", "test-sheet");
    await route.fulfill({
      body,
      contentType: path.endsWith(".js") ? "text/javascript" : path.endsWith(".css") ? "text/css" : "text/html",
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  });
  await page.route("https://docs.google.com/**", route => {
    if (failedSheet) return route.fulfill({ status: 503, body: "Unavailable", headers: { "Access-Control-Allow-Origin": "*" } });
    const sheet = new URL(route.request().url()).searchParams.get("sheet");
    const tableRows = rows.map(row => {
      const values = [...row];
      if (sheet !== "Games") values[4] = values[3];
      return { c: values.map(v => ({ v })) };
    });
    return route.fulfill({
      body: "/*O_o*/\ngoogle.visualization.Query.setResponse(" + JSON.stringify({
        table: { cols: columns.map(label => ({ label })), rows: tableRows }
      }) + ");",
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  });
  await page.route("https://cdn.jsdelivr.net/**", route => route.fulfill({ body: "", contentType: "text/css" }));
  await page.route("https://fonts.googleapis.com/**", route => route.fulfill({ body: "", contentType: "text/css" }));
  await page.route("https://images.example.com/**", route => route.fulfill({
    contentType: "image/svg+xml",
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180"></svg>'
  }));
  await page.route("https://democracylab.netlify.app/**", route => route.fulfill({
    contentType: "text/html",
    body: '<button onclick="parent.postMessage({type:\'selectGame\',game:\'game-example-2\'},\'*\')">Next game</button><script>parent.postMessage({type:"resizeIframe",height:640},"*")</script>'
  }));
  await page.route("https://kaifabbas.linklee.in/**", route => route.fulfill({ contentType: "text/html", body: "<h1>Calendar</h1>" }));
}

async function hostPage(page, { path = "/blog", embed = "blog", block, legacy = false, sandbox = false, iframeOnly = false, secondBlock = false, siteSeo = false, pasted = false } = {}) {
  await page.route("https://www.kaifabbas.com/**", route => {
    let snippet = legacy
      ? `<div data-kb-block="${block}"></div><script src="${origin}/assets/js/blocks.js"></script>`
      : `<script src="${origin}/assets/js/embed.js" ${block ? `data-block="${block}"` : `data-embed="${embed}"`}${iframeOnly ? ' data-render="iframe"' : ""}></script>`;
    if (pasted) snippet = '<style>:root{--accent:#d4a017}.legacy-title{color:var(--accent)}</style><h2 class="legacy-title">Published Research</h2><p>Research available to readers.</p><a href="/blog">Read the blog</a>';
    snippet += '<script>new ResizeObserver(([e])=>parent.postMessage({action:"iframeHeightUpdated",height:e.contentRect.height,id:"embed-container"},"*")).observe(document.documentElement)</script>';
    const srcdoc = `<!doctype html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}</style></head><body>${snippet}</body></html>`;
    const iframe = `<iframe class="grid-embed__iframe" title="custom code element" ${sandbox ? 'sandbox="allow-scripts"' : ""} srcdoc="${srcdoc.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}"></iframe>`;
    return route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html><head><title>Blog</title>${siteSeo ? `<script defer src="${origin}/assets/js/site-seo.js"></script>` : ""}</head><body style="margin:0"><header style="height:40px">Site navigation</header><main><section><div><div id="embed-container" style="width:100%">${iframe}</div></div></section></main>${secondBlock ? `<iframe title="second block" srcdoc="&lt;script src=&quot;${origin}/assets/js/embed.js&quot; data-block=&quot;homepage&quot;&gt;&lt;/script&gt;"></iframe>` : ""}<footer>Site footer</footer><script>addEventListener("message",e=>{if(e.data.action==="iframeHeightUpdated")document.getElementById("embed-container").style.setProperty("--embed-height",e.data.height+"px")})</script></body></html>`
    });
  });
  await page.goto("https://www.kaifabbas.com" + path);
}

for (const width of [1440, 390]) {
  test(`blog exposes content and metadata on the host at ${width}px`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await mockAssets(page);
    await hostPage(page);
    const surface = page.locator('[data-kb-embed="blog"]');
    await expect(surface.locator(".card")).toHaveCount(8);
    await expect(surface.locator("#pageSizeSelect")).toHaveValue("8");
    await expect(surface.getByRole("button", { name: "← Prev", exact: true })).toBeDisabled();
    await surface.getByRole("button", { name: "Next →", exact: true }).click();
    await expect(surface.locator(".card")).toHaveCount(4);
    await expect(surface.locator(".title").first()).toHaveText("Published item 9");
    await expect(surface.getByRole("button", { name: "Next →", exact: true })).toBeDisabled();
    await surface.getByRole("button", { name: "1", exact: true }).click();
    await expect(surface.locator(".card")).toHaveCount(8);
    await expect(surface.getByRole("heading", { name: "Blog", exact: true })).toBeVisible();
    await expect(page).toHaveTitle("Blog | Kaif Abbas");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /published articles/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://www.kaifabbas.com/blog");
    const schema = JSON.parse(await page.locator("#kb-blog-jsonld").textContent());
    expect(schema.numberOfItems).toBe(12);
    expect(schema.itemListElement[11].url).toBe("https://www.kaifabbas.com/blog-post12");
    await expect(surface.locator("img").first()).toHaveAttribute("alt", "Published item 1");
    await expect(surface.getByRole("link", { name: "Read Post" }).first()).toHaveAttribute("target", "_top");
    await surface.locator("#searchInput").fill("item 1");
    await expect(surface.locator(".card")).toHaveCount(4);
    await surface.getByRole("button", { name: "Reset", exact: true }).click();
    await expect(surface.locator(".card")).toHaveCount(8);
    await surface.locator("#yearSelect").selectOption("2026");
    await surface.locator("#filter2Select").selectOption("jan 2026");
    await expect(surface.locator(".card")).toHaveCount(8);
    await surface.locator("#pageSizeSelect").selectOption("all");
    await expect(surface.locator(".card")).toHaveCount(12);
    await expect(surface.locator("#pagination")).toBeHidden();
    await surface.locator("#pageSizeSelect").selectOption("4");
    await expect(surface.locator(".card")).toHaveCount(4);
    await surface.getByRole("button", { name: "Next", exact: false }).click();
    await expect(surface.locator(".card")).toHaveCount(4);
    await surface.getByRole("button", { name: "Details", exact: true }).first().click();
    await expect(surface.locator(".card").first()).toHaveClass(/is-flipped/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await surface.evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThan(300);
    expect(await page.locator("footer").evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThan(300);
    expect(errors).toEqual([]);
  });
}

test("products and lab preserve their page sizes and catalog metadata", async ({ page }) => {
  await mockAssets(page);
  for (const [embed, path, key] of [["product", "/products", "products"], ["lab", "/democracy-lab", "lab"]]) {
    await hostPage(page, { embed, path });
    const surface = page.locator(`[data-kb-embed="${embed}"]`);
    await expect(surface.locator(".card")).toHaveCount(embed === "lab" ? 8 : 12);
    await expect(surface.locator("#pageSizeSelect")).toHaveValue(embed === "lab" ? "8" : "all");
    if (embed === "lab") {
      await surface.getByRole("button", { name: "Next →", exact: true }).click();
      await expect(surface.locator(".card")).toHaveCount(4);
      await surface.getByRole("button", { name: "← Prev", exact: true }).click();
      await expect(surface.locator(".card")).toHaveCount(8);
    } else {
      await expect(surface.locator("#pagination")).toBeHidden();
    }
    await expect(surface.getByRole("heading", { level: 1 })).toBeVisible();
    expect(JSON.parse(await page.locator(`#kb-${key}-jsonld`).textContent()).numberOfItems).toBe(12);
    if (embed === "lab") await expect(surface.getByRole("link", { name: "Play Now" }).first()).toHaveAttribute("href", /www\.kaifabbas\.com\/civic-games\?game=game-example-/);
  }
});

for (const legacy of [false, true]) {
  test(`static blocks appear in the host with isolated styles (legacy=${legacy})`, async ({ page }) => {
    await mockAssets(page);
    await hostPage(page, { path: "/research-and-publications", block: "research", legacy, secondBlock: true });
    await expect(page.locator('[data-kb-embed="research"] h3').first()).toBeVisible();
    await expect(page.locator('[data-kb-embed="homepage"] h3')).toHaveCount(4);
    expect(await page.locator('[data-kb-embed="research"] .kb-line-item').first().evaluate(el => getComputedStyle(el).borderLeftColor)).toBe("rgb(212, 160, 23)");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /research, publications/);
    await expect(page.locator('header')).toHaveCSS("height", "40px");
  });
}

test("civic games expose selected game information and preserve messaging", async ({ page }) => {
  await mockAssets(page);
  await hostPage(page, { embed: "civic-games", path: "/civic-games?game=game-example-1" });
  const surface = page.locator('[data-kb-embed="civic-games"]');
  await expect(surface.locator("#gameTitle")).toHaveText("Published item 1");
  await expect(surface.locator("#gameFrame")).toHaveCSS("height", "640px");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://www.kaifabbas.com/civic-games?game=game-example-1");
  await surface.locator("#gameFrame").contentFrame().getByRole("button", { name: "Next game" }).click();
  await expect(page).toHaveURL(/game=game-example-2/);
  await expect(surface.locator("#gameTitle")).toHaveText("Published item 2");
  expect(JSON.parse(await page.locator("#civic-game-jsonld").textContent()).url).toBe("https://www.kaifabbas.com/civic-games?game=game-example-2");
  await page.evaluate(() => history.back());
  await expect(surface.locator("#gameTitle")).toHaveText("Published item 1");
});

test("booking keeps its calendar, permissions and readable fallback link", async ({ page }) => {
  await mockAssets(page);
  await hostPage(page, { embed: "meet", path: "/book-a-meeting" });
  const surface = page.locator('[data-kb-embed="meet"]');
  await expect(surface.getByRole("link", { name: "Open the booking calendar directly" })).toHaveAttribute("href", "https://kaifabbas.linklee.in/meet");
  await expect(surface.locator("iframe")).toHaveAttribute("allow", /camera; microphone/);
  await expect(surface.locator("iframe").contentFrame().getByRole("heading", { name: "Calendar" })).toBeVisible();
});

for (const sandbox of [false, true]) {
  test(`iframe rendering remains usable (sandbox=${sandbox})`, async ({ page }) => {
    await mockAssets(page);
    await hostPage(page, { sandbox, iframeOnly: !sandbox });
    await expect(page.locator("[data-kb-embed]")).toHaveCount(0);
    await expect(page.frameLocator('iframe[title="custom code element"]').locator(".card")).toHaveCount(8);
    await expect(page.locator('meta[name="description"]')).toHaveCount(0);
  });
}

test("fragment and sheet failures remain visible", async ({ page }) => {
  await mockAssets(page, { failedContent: true, failedSheet: true });
  await hostPage(page, { block: "research" });
  await expect(page.locator('[data-kb-embed="research"]')).toContainText("Sorry, this content");
  await hostPage(page);
  await expect(page.locator('[data-kb-embed="blog"] #empty')).toHaveText("Unable to load blogs. Please refresh to try again.");
  await expect(page.locator("#kb-blog-jsonld")).toHaveCount(0);
});

test("site-wide integration exposes older pasted embeds without duplicate content", async ({ page }) => {
  await mockAssets(page);
  await hostPage(page, { path: "/research-and-publications", siteSeo: true, pasted: true });
  await expect(page.locator("[data-kb-legacy]")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Published Research" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Published Research" })).toHaveCSS("color", "rgb(212, 160, 23)");
  await expect(page.getByRole("link", { name: "Read the blog" })).toHaveAttribute("href", "/blog");
  await expect(page.locator('iframe[title="custom code element"]')).toBeHidden();
  await expect(page).toHaveTitle("Research & Publications | Kaif Abbas");
  await page.evaluate(() => document.body.appendChild(document.createElement("div")));
  await expect(page.locator("[data-kb-legacy]")).toHaveCount(1);
});

test("site-wide integration does not clone managed interactive embeds", async ({ page }) => {
  await mockAssets(page);
  await hostPage(page, { siteSeo: true });
  await expect(page.locator('[data-kb-embed="blog"] .card')).toHaveCount(8);
  await expect(page.locator("[data-kb-legacy]")).toHaveCount(0);
});

test("build rejects masked Sheet values instead of deploying a broken catalog", () => {
  const result = spawnSync(process.execPath, ["scripts/build.mjs"], {
    env: { ...process.env, SHEET_ID: "****************abcd" },
    encoding: "utf8"
  });
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain("SHEET_ID must be an unmasked Google spreadsheet ID");
});
