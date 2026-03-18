import { writeJson, writeCsv } from "./utils.js";
import { CONFIG } from "./config.js";

export async function saveLinksOutputs(links) {
  await writeJson(CONFIG.paths.linksJson, links);

  const rows = [["index", "product_link"], ...links.map((link, i) => [i + 1, link])];

  await writeCsv(CONFIG.paths.linksCsv, rows);
}

export async function saveFinalReport(report) {
  await writeJson(CONFIG.paths.reportJson, report);
}
