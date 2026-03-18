import fs from "fs/promises";
import { sleep } from "./utils.js";
import { CONFIG } from "./config.js";
import { SELECTORS, firstVisible } from "./selectors.js";

export async function createContext(browser, storageStatePath) {
  try {
    await fs.access(storageStatePath);
    return browser.newContext({ storageState: storageStatePath });
  } catch {
    return browser.newContext();
  }
}

export async function isLoggedIn(page) {
  await page.goto(CONFIG.wishlistUrl, {
    waitUntil: "domcontentloaded",
    timeout: CONFIG.pageLoadTimeoutMs
  });

  await sleep(2000);

  const bodyText = (await page.locator("body").innerText().catch(() => "")).toLowerCase();
  const onWishlist = page.url().includes("/pages/wishlist");
  const looksLoggedOut = bodyText.includes("log in") && bodyText.includes("sign up");

  return onWishlist && !looksLoggedOut;
}

export async function login(page, credentials, label) {
  if (!credentials.email || !credentials.password) {
    throw new Error(`[${label}] Missing credentials`);
  }

  await page.goto(CONFIG.loginUrl, {
    waitUntil: "domcontentloaded",
    timeout: CONFIG.pageLoadTimeoutMs
  });

  const emailInput = await firstVisible(page, SELECTORS.emailInput);
  const passwordInput = await firstVisible(page, SELECTORS.passwordInput);
  const signInButton = await firstVisible(page, SELECTORS.signInButton);

  if (!emailInput || !passwordInput || !signInButton) {
    throw new Error(`[${label}] Could not find login form`);
  }

  await emailInput.fill(credentials.email);
  await passwordInput.fill(credentials.password);
  await signInButton.click();

  await sleep(4000);

  await page.goto(CONFIG.wishlistUrl, {
    waitUntil: "domcontentloaded",
    timeout: CONFIG.pageLoadTimeoutMs
  });

  await sleep(2500);

  const ok = await isLoggedIn(page);
  if (!ok) {
    throw new Error(`[${label}] Login may have failed`);
  }
}

export async function ensureLoggedIn(context, page, credentials, label, storagePath) {
  const alreadyLoggedIn = await isLoggedIn(page).catch(() => false);

  if (!alreadyLoggedIn) {
    await login(page, credentials, label);
    await context.storageState({ path: storagePath });
  }
}
