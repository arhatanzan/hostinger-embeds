// Writes public/blocks/index.json (list of block names) for the admin builder.
import { readdirSync, writeFileSync } from "node:fs";

const dir = new URL("../public/blocks/", import.meta.url);
const names = readdirSync(dir)
  .filter((f) => /^[a-z0-9_-]+\.html$/.test(f))
  .map((f) => f.slice(0, -5))
  .sort();

writeFileSync(new URL("index.json", dir), JSON.stringify(names, null, 2) + "\n");
console.log(`blocks/index.json: ${names.length} blocks`);
