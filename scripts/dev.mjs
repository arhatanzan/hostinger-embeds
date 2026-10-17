import { spawnSync } from "node:child_process";
import process from "node:process";

const envResult = spawnSync("netlify", [
  "env:get",
  "SHEET_ID",
  "--context",
  "dev",
  "--scope",
  "builds"
], { encoding: "utf8" });

if (envResult.error) throw envResult.error;
if (envResult.status !== 0) {
  if (envResult.stderr) process.stderr.write(envResult.stderr);
  process.exit(envResult.status || 1);
}

const sheetId = envResult.stdout.trim();
if (!sheetId) throw new Error("Netlify returned an empty SHEET_ID for the dev context.");

process.env.SHEET_ID = sheetId;

for (const [command, args] of [
  [process.execPath, ["scripts/build.mjs"]],
  ["netlify", ["dev"]]
]) {
  const result = spawnSync(command, args, { stdio: "inherit", env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}