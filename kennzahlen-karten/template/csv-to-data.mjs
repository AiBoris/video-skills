// Turns a CSV of metrics into the data.json this template expects.
//
// Usage:  node csv-to-data.mjs metrics.csv data.json
//
// Expected columns (header row required, order free, German or English names):
//
//   label;value;suffix;note;meta;delta;tone;trend
//   iPhone 17;16,6; Mio.;geschätzter Absatz;Q2 2026 · Counterpoint;;;up
//
// "note" is the line under the number (what it is), "meta" the smaller line below
// (where it comes from). Further columns: prefix, decimals, color.
//
// Only "label" and "value" are required. Semicolon or comma as the separator,
// German decimal commas and thousands dots, "%", "€" and empty cells are handled.

import { readFileSync, writeFileSync } from "node:fs";

const [, , csvPath, outPath = "data.json"] = process.argv;
if (!csvPath) {
  console.error("\n! Usage: node csv-to-data.mjs <metrics.csv> [data.json]\n");
  process.exit(1);
}

const raw = readFileSync(csvPath, "utf8").replace(/^﻿/, "").trim();
const lines = raw.split(/\r?\n/).filter((l) => l.trim() !== "");
if (lines.length < 2) {
  console.error("\n! The CSV needs a header row and at least one metric row.\n");
  process.exit(1);
}

// Whichever of ; , or tab appears most often in the header wins.
const sep = [";", "\t", ","].sort(
  (a, b) => lines[0].split(b).length - lines[0].split(a).length
)[0];

const splitRow = (line) => {
  const out = [];
  let cur = "";
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') quoted = !quoted;
    else if (ch === sep && !quoted) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  // Cells are returned untrimmed: a unit column is typically written as " Mio."
  // and that leading space is the space in front of the unit in the video.
  return out;
};

const ALIASES = {
  label: ["label", "beschriftung", "name", "kennzahl", "metric", "titel"],
  value: ["value", "wert", "zahl", "number"],
  prefix: ["prefix", "praefix", "präfix", "vorne"],
  suffix: ["suffix", "einheit", "unit", "hinten"],
  decimals: ["decimals", "nachkommastellen", "dezimalstellen"],
  delta: ["delta", "veraenderung", "veränderung", "change", "badge"],
  tone: ["tone", "ton", "richtung", "direction", "deltatone"],
  note: ["note", "notiz", "beschreibung", "was", "description"],
  meta: ["meta", "kontext", "zeitraum", "quelle", "context", "source"],
  trend: ["trend", "verlauf", "kurve", "sparkline"],
  color: ["color", "farbe"],
};

const header = splitRow(lines[0]).map((h) => h.trim().toLowerCase().replace(/[^a-zäöüß]/g, ""));
const colOf = (field) => header.findIndex((h) => ALIASES[field].includes(h));
const idx = Object.fromEntries(Object.keys(ALIASES).map((f) => [f, colOf(f)]));

if (idx.label < 0 || idx.value < 0) {
  console.error(
    `\n! The CSV needs a "label" and a "value" column. Found: ${header.join(", ")}\n` +
      `  German column names work too: Beschriftung, Wert, Einheit, Delta, Trend.\n`
  );
  process.exit(1);
}

const toNumber = (s) => {
  const cleaned = String(s)
    .replace(/[^\d,.\-]/g, "")
    // "1.234,5" -> German; "1,234.5" -> English. The last separator wins.
    .replace(/\.(?=\d{3}\b)/g, "")
    .replace(",", ".");
  const v = Number(cleaned);
  return Number.isFinite(v) ? v : null;
};

const metrics = [];
lines.slice(1).forEach((line, i) => {
  const cells = splitRow(line);
  const raw = (field) => (idx[field] >= 0 ? cells[idx[field]] || "" : "");
  const at = (field) => raw(field).trim();
  const label = at("label");
  if (!label) return;
  const rawValue = at("value");
  const num = toNumber(rawValue);
  if (num === null) {
    console.error(`! Row ${i + 2} ("${label}"): "${rawValue}" is not a number — skipped.`);
    return;
  }
  const m = { label, value: num };
  const decimals = at("decimals");
  if (decimals !== "") m.decimals = Number(decimals);
  else if (/[.,]\d/.test(rawValue)) m.decimals = (rawValue.split(/[.,]/).pop() || "").length;
  if (at("prefix")) m.prefix = raw("prefix");
  if (at("suffix")) m.suffix = raw("suffix");
  if (at("note")) m.note = at("note");
  if (at("meta")) m.meta = at("meta");
  if (at("delta")) m.delta = at("delta");
  const tone = at("tone").toLowerCase();
  if (["up", "auf", "hoch", "+"].includes(tone)) m.deltaTone = "up";
  else if (["down", "ab", "runter", "-"].includes(tone)) m.deltaTone = "down";
  else if (["flat", "neutral"].includes(tone)) m.deltaTone = "flat";
  const trend = at("trend").toLowerCase();
  if (["up", "down", "flat"].includes(trend)) m.trend = trend;
  else if (trend.includes(" ") || trend.includes("|")) m.trend = trend.split(/[|\s]+/).map(toNumber);
  if (at("color")) m.color = at("color");
  metrics.push(m);
});

if (metrics.length === 0) {
  console.error("\n! No usable metric rows found.\n");
  process.exit(1);
}

writeFileSync(
  outPath,
  JSON.stringify(
    {
      title: "TODO: Überschrift",
      subtitle: "TODO: was die Zahlen sind, Zeitraum, Quelle",
      footnote: "",
      metrics,
      options: { format: "landscape", locale: "de" },
    },
    null,
    2
  ) + "\n"
);

console.log(`${outPath} written — ${metrics.length} metrics. Fill in title and subtitle before building.`);
