import dotenv from "dotenv";
import path from "path";

dotenv.config();

export const CONFIG = {
  baseUrl: "https://www.fashionnova.com",
  wishlistUrl: "https://www.fashionnova.com/pages/wishlist",
  loginUrl: "https://www.fashionnova.com/account/login",

  headless: String(process.env.HEADLESS || "false").toLowerCase() === "true",
  slowMo: Number(process.env.SLOW_MO || 80),

  maxScrollPasses: Number(process.env.MAX_SCROLL_PASSES || 250),
  productDelayMs: Number(process.env.PRODUCT_DELAY_MS || 2200),
  addDelayMs: Number(process.env.ADD_DELAY_MS || 1600),
  retryCount: Number(process.env.RETRY_COUNT || 3),

  pageLoadTimeoutMs: 45000,
  waitAfterNavMs: 2500,

  sourceCredentials: {
    email: process.env.FN_SOURCE_EMAIL || "",
    password: process.env.FN_SOURCE_PASSWORD || ""
  },

  targetCredentials: {
    email: process.env.FN_TARGET_EMAIL || "",
    password: process.env.FN_TARGET_PASSWORD || ""
  },

  paths: {
    dataDir: path.resolve("data"),
    logsDir: path.resolve("logs"),
    screenshotsDir: path.resolve("screenshots"),
    storageDir: path.resolve("storage"),
    linksJson: path.resolve("data/wishlist-links.json"),
    linksCsv: path.resolve("data/wishlist-links.csv"),
    reportJson: path.resolve("data/wishlist-import-report.json"),
    sourceStorage: path.resolve("storage/source.json"),
    targetStorage: path.resolve("storage/target.json")
  },

  productLinkPattern: /\/products\//i
};
