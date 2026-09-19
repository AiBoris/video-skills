// Converts a CSV into the data.json shape build.mjs expects.
//
//   node csv-to-data.mjs input.csv [output.json]
//
// Expected layout — first column is the series name, every other column is one
// period, in chronological order left to right:
//
//   Company,Q1,Q2,Q3,Q4
//   Quanta,27,62,70,84
//   Orbit,24,44,50,60
//
// The header row's remaining cells become the period labels. Empty cells become
// null ("not in the race yet"). Numbers may use . or , as the decimal mark and
// may carry thousands separators, currency symbols or %.
//
// The long/tidy layout (name,period,value — one row per observation) is detected
// and pivoted automatically.

import { readFileSync, writeFileSync } from "node:fs";

const [, , inPath, outPath = "data.json"] = process.argv;
if (!inPath) {
  console.error("\n! Usage: node csv-to-data.mjs input.csv [output.json]\n");
  process.exit(1);
}

const die = (msg) => {
  console.error("\n! " + msg + "\n");
  process.exit(1);
};

// --- parse ----------------------------------------------------------------
// Handles quoted fields, escaped quotes and both , and ; as the delimiter.
function parseCsv(text) {
  const src = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const head = src.slice(0, src.indexOf("\n") + 1 || undefined);
  const delim = (head.match(/;/g) || []).length > (head.match(/,/g) || []).length ? ";" : ",";

  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === delim) { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

// "1.234,5" -> 1234.5   "$1,234.50" -> 1234.5   "12%" -> 12
function toNumber(raw) {
  const s = String(raw).trim();
  if (s === "" || s === "-" || s.toLowerCase() === "n/a" || s.toLowerCase() === "null") return null;
  let t = s.replace(/[^\d.,\-]/g, "");
  const lastComma = t.lastIndexOf(",");
  const lastDot = t.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    // Whichever comes last is the decimal mark; the other is a grouping separator.
    t = lastComma > lastDot ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, "");
  } else if (lastComma > -1) {
    // A lone comma is a decimal mark unless it groups three digits.
    t = /,\d{3}$/.test(t) ? t.replace(/,/g, "") : t.replace(",", ".");
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

const rows = parseCsv(readFileSync(inPath, "utf8"));
if (rows.length < 2) die(`${inPath} has no data rows.`);

const header = rows[0].map((c) => c.trim());
const body = rows.slice(1);

let periods, series;

const looksLong =
  header.length === 3 && body.length > 0 && body.every((r) => toNumber(r[2]) !== null);

if (looksLong) {
  // name,period,value — pivot to one row per series.
  const periodOrder = [];
  const byName = new Map();
  for (const r of body) {
    const name = r[0].trim();
    const period = r[1].trim();
    if (!periodOrder.includes(period)) periodOrder.push(period);
    if (!byName.has(name)) byName.set(name, new Map());
    byName.get(name).set(period, toNumber(r[2]));
  }
  periods = periodOrder;
  series = [...byName.entries()].map(([name, m]) => ({
    name,
    values: periods.map((p) => (m.has(p) ? m.get(p) : null)),
  }));
  console.log(`Detected long format (${header.join(", ")}) and pivoted it.`);
} else {
  periods = header.slice(1);
  if (periods.length < 2)
    die(`Need at least two period columns — found ${periods.length} after the name column.`);
  series = body.map((r) => ({
    name: r[0].trim(),
    values: periods.map((_, i) => toNumber(r[i + 1])),
  }));
}

series = series.filter((s) => s.name !== "");
if (series.length < 2) die(`Found only ${series.length} series. The race needs at least two.`);

// Leading nulls mean "not in the race yet" and are kept. A trailing null would make a
// bar vanish mid-race, which reads as an error — carry the last known value instead.
for (const s of series) {
  let last = null;
  for (let i = 0; i < s.values.length; i++) {
    if (s.values[i] === null && last !== null) s.values[i] = last;
    else if (s.values[i] !== null) last = s.values[i];
  }
  if (s.values.every((v) => v === null))
    die(`"${s.name}" has no numeric values at all. Remove the row or fix the source.`);
}

const decimals = series.some((s) => s.values.some((v) => v !== null && !Number.isInteger(v)))
  ? 1
  : 0;

writeFileSync(
  outPath,
  JSON.stringify(
    {
      title: "TODO — write a title",
      subtitle: "TODO — what the numbers are, and their unit",
      valueSuffix: "",
      periods,
      series,
      options: { format: "landscape", visibleRows: Math.min(series.length, 6), decimals },
    },
    null,
    2
  ) + "\n"
);

console.log(
  `${outPath} written — ${series.length} series x ${periods.length} periods.\n` +
    `Now fill in "title" and "subtitle", then run: node build.mjs`
);
