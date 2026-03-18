import path from "path";
import { CONFIG } from "./config.js";
import { sleep, withRetries, nowStamp } from "./utils.js";
import { SELECTORS } from "./selectors.js";

async function screenshotOnFailure(page, prefix, link) {
  const safe = link
    .replace(/^https?:\/\//, "")
    .replace(/[^\w.-]+/g, "_")
    .slice(0, 120);

  const file = path.join(CONFIG.paths.screenshotsDir, `${prefix}-${nowStamp()}-${safe}.png`);
  await page.screenshot({ path: file, fullPage: true }).catch(() => {});
  return file;
}

async function detectOutOfStock(page) {
  const bodyText = (await page.locator("body").innerText().catch(() => "")).toLowerCase();

  if (
    bodyText.includes("sold out") ||
    bodyText.includes("out of stock") ||
    bodyText.includes("coming soon") ||
    bodyText.includes("get notified")
  ) {
    const addToBag = page.locator(SELECTORS.addToBagButtons[0]).first();
    const visible = await addToBag.isVisible().catch(() => false);
    if (!visible) {
      return true;
    }
  }

  const sizeStates = await page
    .locator("button")
    .evaluateAll(buttons =>
      buttons
        .map(btn => ({
          text: (btn.textContent || "").trim(),
          disabled:
            btn.hasAttribute("disabled") || btn.getAttribute("aria-disabled") === "true"
        }))
        .filter(btn => /^(xxs|xs|s|m|l|xl|1x|2x|3x|4x|5x)$/i.test(btn.text))
    )
    .catch(() => []);

  if (sizeStates.length > 0 && sizeStates.every(x => x.disabled)) {
    return true;
  }

  return false;
}

async function clickWishlistButton(page) {
  for (const selector of SELECTORS.addToWishlistButtons) {
    const locator = page.locator(selector).first();
    if (await locator.isVisible().catch(() => false)) {
      await locator.click().catch(() => {});
      await sleep(CONFIG.addDelayMs);
      return true;
    }
  }

  const heartFallback = page.locator('button, a').filter({ hasText: /❤|♥/ }).first();
  if (await heartFallback.isVisible().catch(() => false)) {
    await heartFallback.click().catch(() => {});
    await sleep(CONFIG.addDelayMs);
    return true;
  }

  const likelyHeart = page.locator("button").last();
  if (await likelyHeart.isVisible().catch(() => false)) {
    await likelyHeart.click().catch(() => {});
    await sleep(CONFIG.addDelayMs);
    return true;
  }

  return false;
}

export async function importWishlist(page, links, log) {
  const results = {
    totalLinks: links.length,
    added: [],
    skippedOutOfStock: [],
    skippedDuplicateInput: [],
    failed: []
  };

  const dedupedLinks = [...new Set(links)];
  results.skippedDuplicateInput = links.filter((link, index) => dedupedLinks.indexOf(link) !== index);

  for (let i = 0; i < dedupedLinks.length; i++) {
    const link = dedupedLinks[i];
    await log(`[TARGET] ${i + 1}/${dedupedLinks.length} Processing ${link}`);

    try {
      await withRetries(
        async () => {
          await page.goto(link, {
            waitUntil: "domcontentloaded",
            timeout: CONFIG.pageLoadTimeoutMs
          });

          await sleep(CONFIG.productDelayMs);

          if (await detectOutOfStock(page)) {
            results.skippedOutOfStock.push(link);
            await log(`[TARGET] Skipped out of stock: ${link}`);
            return;
          }

          const clicked = await clickWishlistButton(page);
          if (!clicked) {
            throw new Error("wishlist_button_not_found");
          }

          results.added.push(link);
          await log(`[TARGET] Added to wishlist: ${link}`);
        },
        CONFIG.retryCount,
        async (attempt, error) => {
          await log(`[TARGET] Retry ${attempt} failed for ${link}: ${error.message}`);
          await screenshotOnFailure(page, "retry", link);
          await sleep(1200);
        }
      );
    } catch (error) {
      const screenshot = await screenshotOnFailure(page, "failed", link);
      results.failed.push({
        link,
        reason: error.message,
        screenshot
      });
      await log(`[TARGET] Failed: ${link} | reason=${error.message} | screenshot=${screenshot}`);
    }
  }

  return results;
}
