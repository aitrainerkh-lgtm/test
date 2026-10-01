// Load the built composition in headless Chrome and export the sound-event list
// the timeline recorded (window.__sfx), so audio lands exactly on the picture.
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import puppeteer from "puppeteer-core";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const chrome = execSync("npx hyperframes browser path", { cwd: ROOT }).toString().trim().split("\n").pop();
const browser = await puppeteer.launch({ executablePath: chrome, args: ["--no-sandbox"] });
const page = await browser.newPage();
page.on("pageerror", (e) => console.error("page error:", e.message));
await page.evaluateOnNewDocument(() => { window.__timelines = {}; });
await page.goto("file://" + path.join(ROOT, "index.html"));
for (let i = 0; ; i++) {
  if (await page.evaluate(() => !!(window.__timelines && window.__timelines.main))) break;
  if (i > 150) throw new Error("timeline never registered");
  await new Promise((r) => setTimeout(r, 100));
}
const events = await page.evaluate(() => window.__sfx);
await browser.close();
events.sort((a, b) => a.t - b.t);
fs.writeFileSync(path.join(ROOT, "audio", "events.json"), JSON.stringify(events, null, 1));
const counts = {};
events.forEach((e) => (counts[e.name] = (counts[e.name] || 0) + 1));
console.log(`${events.length} sound events`, counts);
