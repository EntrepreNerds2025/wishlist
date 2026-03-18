import { chromium } from "@playwright/test";
import { CONFIG } from "./config.js";
import { ensureDir, appendLog, nowStamp } from "./utils.js";
import { createContext, ensureLoggedIn } from "./auth.js";
import { scrapeEntireWishlist } from "./scrapeWishlist.js";
import { importWishlist } from "./importWishlist.js";
import { saveLinksOutputs, saveFinalReport } from "./reporter.js";

async function main() {
  await ensureDir(CONFIG.paths.dataDir);
  await ensureDir(CONFIG.paths.logsDir);
  await ensureDir(CONFIG.paths.screenshotsDir);
  await ensureDir(CONFIG.paths.storageDir);

  const runId = nowStamp();
  const logFile = `${CONFIG.paths.logsDir}/run-${runId}.log`;
  const log = async message => appendLog(logFile, message);

  await log(`[RUN] Starting migration run ${runId}`);

  const browser = await chromium.launch({
    headless: CONFIG.headless,
    slowMo: CONFIG.slowMo
  });

  try {
    const sourceContext = await createContext(browser, CONFIG.paths.sourceStorage);
    const sourcePage = await sourceContext.newPage();

    await log("[SOURCE] Ensuring source account is logged in");
    await ensureLoggedIn(
      sourceContext,
      sourcePage,
      CONFIG.sourceCredentials,
      "SOURCE",
      CONFIG.paths.sourceStorage
    );

    const sourceLinks = await scrapeEntireWishlist(sourcePage, log);
    await saveLinksOutputs(sourceLinks);
    await log(`[SOURCE] Saved ${sourceLinks.length} unique links`);

    await sourceContext.close();

    const targetContext = await createContext(browser, CONFIG.paths.targetStorage);
    const targetPage = await targetContext.newPage();

    await log("[TARGET] Ensuring target account is logged in");
    await ensureLoggedIn(
      targetContext,
      targetPage,
      CONFIG.targetCredentials,
      "TARGET",
      CONFIG.paths.targetStorage
    );

    const results = await importWishlist(targetPage, sourceLinks, log);

    const report = {
      runId,
      sourceWishlistCount: sourceLinks.length,
      totalProcessed: results.totalLinks,
      addedCount: results.added.length,
      skippedOutOfStockCount: results.skippedOutOfStock.length,
      skippedDuplicateInputCount: results.skippedDuplicateInput.length,
      failedCount: results.failed.length,
      added: results.added,
      skippedOutOfStock: results.skippedOutOfStock,
      skippedDuplicateInput: results.skippedDuplicateInput,
      failed: results.failed,
      logFile
    };

    await saveFinalReport(report);
    await log(
      `[DONE] Added=${report.addedCount} skippedOutOfStock=${report.skippedOutOfStockCount} failed=${report.failedCount}`
    );

    await targetContext.close();

    console.log("Migration complete.");
    console.log(`Links JSON: ${CONFIG.paths.linksJson}`);
    console.log(`Links CSV: ${CONFIG.paths.linksCsv}`);
    console.log(`Report: ${CONFIG.paths.reportJson}`);
    console.log(`Log: ${logFile}`);
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
