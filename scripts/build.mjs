// Writes generated public assets used by the admin builder and embeds.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";

const configTemplate = new URL("../public/assets/js/admin-config.js", import.meta.url);
const runtimeConfig = new URL("../public/assets/js/admin-config.runtime.js", import.meta.url);
const sheetId = process.env.SHEET_ID || "";
const configSource = readFileSync(configTemplate, "utf8");

if (!configSource.includes('const SHEET_ID = "__SHEET_ID__";')) {
  throw new Error("SHEET_ID placeholder is missing from admin-config.js");
}

writeFileSync(runtimeConfig, configSource.replace('"__SHEET_ID__"', JSON.stringify(sheetId)));
if (!sheetId) console.warn("SHEET_ID is unset; sheet-backed embeds will not load data.");

const dir = new URL("../public/blocks/", import.meta.url);
const names = readdirSync(dir)
  .filter((f) => /^[a-z0-9_-]+\.html$/.test(f))
  .map((f) => f.slice(0, -5))
  .sort();

writeFileSync(new URL("index.json", dir), JSON.stringify(names, null, 2) + "\n");
console.log(`blocks/index.json: ${names.length} blocks`);