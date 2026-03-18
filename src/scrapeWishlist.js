import { CONFIG } from "./config.js";
import { sleep, uniqueLinks } from "./utils.js";
import { SELECTORS } from "./selectors.js";

async function scrollWishlistFully(page) {
  let lastHeight = 0;
  let stablePasses = 0;

  for (let i = 0; i < CONFIG.maxScrollPasses; i++) {
    const height = await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
      return document.body.scrollHeight;
    });

    await sleep(1600);

    if (height === lastHeight) {
      stablePasses += 1;
    } else {
      stablePasses = 0;
      lastHeight = height;
    }

    if (stablePasses >= 3) {
      break;
    }
  }
}

async function collectLinksFromPage(page) {
  const anchors = await page
    .locator(SELECTORS.productAnchors[0])
    .evaluateAll(elements => elements.map(el => el.href))
    .catch(() => []);

  return uniqueLinks(anchors);
}

async function clickNext(page) {
  for (const selector of SELECTORS.nextPage) {
    const locator = page.locator(selector).first();
    const visible = await locator.isVisible().catch(() => false);
    if (!visible) {
      continue;
    }

    const disabled =
      (await locator.getAttribute("disabled").catch(() => null)) !== null ||
      (await locator.getAttribute("aria-disabled").catch(() => null)) === "true";

    if (disabled) {
      continue;
    }

    await locator.click().catch(() => {});
    await sleep(2500);
    return true;
  }

  return false;
}

export async function scrapeEntireWishlist(page, log) {
  const allLinks = new Set();
  let pageNumber = 1;

  await page.goto(CONFIG.wishlistUrl, {
    waitUntil: "domcontentloaded",
    timeout: CONFIG.pageLoadTimeoutMs
  });

  await sleep(2000);

  while (true) {
    await log(`[SOURCE] Scraping wishlist page ${pageNumber}`);
    await scrollWishlistFully(page);

    const pageLinks = await collectLinksFromPage(page);
    pageLinks.forEach(link => allLinks.add(link));

    await log(`[SOURCE] Total unique product links so far: ${allLinks.size}`);

    const moved = await clickNext(page);
    if (!moved) {
      break;
    }

    pageNumber += 1;
  }

  return [...allLinks];
}
