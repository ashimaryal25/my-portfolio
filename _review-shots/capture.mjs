import { chromium } from "file:///C:/Users/hp/Documents/New%20project/node_modules/playwright/index.mjs";
import path from "path";
import { fileURLToPath } from "url";

const out = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ channel: "chrome", headless: true });

const routes = [
  ["home", "/"],
  ["projects", "/projects"],
  ["printfarm", "/projects/printfarm"],
  ["keyforge", "/projects/keyforge"],
  ["iclbooth", "/projects/iclbooth"],
  ["mural", "/projects/tic-tac-toe-mural"],
  ["jack", "/projects/ask-jack"],
  ["blog", "/blog"],
  ["post", "/blog/ai-coding-agents-workflow"],
  ["classifier", "/blog/training-a-local-trait-classifier"],
  ["about", "/about"],
];

async function shoot(label, base) {
  for (const [w, h, vp] of [
    [1440, 900, "desktop"],
    [390, 844, "mobile"],
  ]) {
    const context = await browser.newContext({
      viewport: { width: w, height: h },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(25000);

    for (const [name, route] of routes) {
      const url = base + route;
      try {
        const resp = await page.goto(url, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(900);
        const file = path.join(out, `${label}-${vp}-${name}.png`);
        await page.screenshot({ path: file, fullPage: true });
        const title = await page.title();
        const status = resp ? resp.status() : "noresp";
        console.log(`${label} ${vp} ${name} ${status} ${title}`);
      } catch (err) {
        console.log(`${label} ${vp} ${name} ERROR ${err.message}`);
      }
    }

    try {
      await page.goto(base + "/", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(500);
      const buttons = await page.locator("button").allTextContents();
      console.log(`${label} ${vp} home buttons: ${JSON.stringify(buttons)}`);
      const plotter = page.getByRole("button", { name: /Plotter/i });
      if (await plotter.count()) {
        await plotter.first().click();
        await page.waitForTimeout(600);
        await page.screenshot({
          path: path.join(out, `${label}-${vp}-home-plotter.png`),
          fullPage: true,
        });
        console.log(`${label} ${vp} home-plotter ok`);
      }
      const ml = page.getByRole("button", { name: /ML|Scorer|Offline/i });
      if (await ml.count()) {
        await ml.first().click();
        await page.waitForTimeout(600);
        await page.screenshot({
          path: path.join(out, `${label}-${vp}-home-ml.png`),
          fullPage: true,
        });
        console.log(`${label} ${vp} home-ml ok`);
      }
    } catch (err) {
      console.log(`${label} ${vp} extra-tabs ERROR ${err.message}`);
    }

    await context.close();
  }
}

await shoot("local", "http://localhost:3000");
await shoot("live", "https://www.ashimaryal.com");
await browser.close();
console.log("DONE");
