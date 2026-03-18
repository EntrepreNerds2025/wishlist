import fs from "fs/promises";
import path from "path";

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

export async function writeJson(file, data) {
  await ensureDir(path.dirname(file));
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

export async function readJson(file, fallback = null) {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export async function writeCsv(file, rows) {
  await ensureDir(path.dirname(file));
  const csv = rows
    .map(row =>
      row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");
  await fs.writeFile(file, csv, "utf8");
}

export function uniqueLinks(links) {
  return [
    ...new Set(
      links
        .filter(Boolean)
        .map(link => String(link).split("?")[0].trim())
        .filter(Boolean)
    )
  ];
}

export function nowStamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(
    d.getHours()
  )}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

export async function appendLog(logFile, message) {
  await fs.appendFile(logFile, `${new Date().toISOString()} ${message}\n`, "utf8");
}

export async function withRetries(fn, retries, onRetry) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      if (attempt < retries && onRetry) {
        await onRetry(attempt, error);
      }
    }
  }
  throw lastError;
}
