// CSV / TSV export -> testimonials.json
//
//   node csv-to-testimonials.mjs bewertungen.csv testimonials.json
//
// Columns are matched by their header, in German and English, so exports from
// Google Business Profile, ProvenExpert, Trustpilot and plain spreadsheets all
// land in the right fields. The review text is copied VERBATIM and untouched:
// shortening it and choosing the focus text is an editorial decision that the
// agent makes with the user, not something a converter should guess.
import { readFileSync, writeFileSync } from "node:fs";

const [, , inFile, outFile = "testimonials.json"] = process.argv;
if (!inFile) {
  console.error("usage: node csv-to-testimonials.mjs <datei.csv> [testimonials.json]");
  process.exit(1);
}

const raw = readFileSync(inFile, "utf8").replace(/^﻿/, "");

// Delimiter: whichever of , ; \t appears most often outside quotes in line 1.
function sniff(text) {
  const first = text.split(/\r?\n/)[0];
  let best = ",";
  let bestN = -1;
  for (const d of [",", ";", "\t"]) {
    let n = 0;
    let q = false;
    for (const ch of first) {
      if (ch === '"') q = !q;
      else if (ch === d && !q) n++;
    }
    if (n > bestN) (bestN = n), (best = d);
  }
  return best;
}

function parseCsv(text, d) {
  const rows = [];
  let row = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') {
        if (text[i + 1] === '"') (cell += '"'), i++;
        else q = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"') q = true;
    else if (ch === d) row.push(cell), (cell = "");
    else if (ch === "\n") row.push(cell), rows.push(row), (row = []), (cell = "");
    else if (ch !== "\r") cell += ch;
  }
  if (cell || row.length) row.push(cell), rows.push(row);
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

const rows = parseCsv(raw, sniff(raw));
if (rows.length < 2) {
  console.error("The file has no data rows.");
  process.exit(1);
}

const header = rows[0].map((h) => h.trim().toLowerCase());
const find = (...needles) =>
  header.findIndex((h) => needles.some((n) => h.includes(n)));

const iText = find(
  "review text", "reviewtext", "bewertungstext", "kommentar", "comment",
  "text", "bewertung", "review", "feedback", "erfahrung", "zitat", "quote"
);
const iName = find("name", "author", "autor", "kunde", "customer", "reviewer", "verfasser");
const iRating = find("rating", "stern", "star", "note", "score", "punkte");
const iDate = find("datum", "date", "zeit", "erstellt", "created");
const iRole = find("rolle", "role", "firma", "company", "unternehmen", "funktion", "position", "ort", "branche");
const iSource = find("quelle", "source", "plattform", "platform", "portal");
const iUrl = find("url", "link", "permalink");

if (iText < 0) {
  console.error(
    "No review-text column found. Rename the column to 'Bewertungstext' or 'Review text', " +
      "or pass the data as JSON instead.\nHeaders seen: " + header.join(" | ")
  );
  process.exit(1);
}

const num = (s) => {
  const v = parseFloat(String(s).replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(v) ? v : null;
};

const at = (r, i) => (i >= 0 ? (r[i] || "").trim() : "");

const testimonials = [];
const skipped = [];
for (const r of rows.slice(1)) {
  const text = at(r, iText).replace(/\s+/g, " ").trim();
  if (!text) {
    skipped.push(at(r, iName) || "(ohne Namen)");
    continue;
  }
  const rating = num(at(r, iRating));
  const src = at(r, iSource);
  const t = { quote: text };
  const name = at(r, iName);
  if (name) t.name = name;
  const role = at(r, iRole);
  if (role) t.role = role;
  const date = at(r, iDate);
  if (date) t.date = date;
  if (rating != null) t.rating = rating;
  if (src) t.source = { name: src };
  const url = at(r, iUrl);
  if (url) t.url = url;
  testimonials.push(t);
}

const sources = new Set(testimonials.map((t) => t.source?.name).filter(Boolean));
const out = {
  _todo:
    "1) Jedes quote kürzen (max. ~16 Wörter, nur streichen, nie umformulieren, " +
    "Auslassungen mit …). 2) Die eine entscheidende Stelle in **doppelte Sternchen** " +
    "setzen. 3) Zitate, die auf einem Pronomen beginnen, auf den Namen umstellen " +
    '("Boris hat …" statt "Er hat …"). 4) brand, intro und outro ausfüllen. ' +
    "Danach dieses Feld löschen.",
  brand: { kind: "person", name: "TODO", subject: "TODO" },
  intro: { headline: "Das sagen **meine Kunden**" },
  defaultSource: { name: sources.size === 1 ? [...sources][0] : "TODO" },
  options: { format: "landscape" },
  testimonials,
  outro: {
    rating: null,
    count: testimonials.length,
    source: sources.size === 1 ? [...sources][0] : "TODO",
    cta: "TODO",
    website: "TODO",
  },
};
writeFileSync(outFile, JSON.stringify(out, null, 2) + "\n");

console.log(
  `${outFile} written — ${testimonials.length} testimonial(s)` +
    (sources.size ? `, source(s): ${[...sources].join(", ")}` : "")
);
console.log(
  `  columns used: text=${header[iText]}` +
    (iName >= 0 ? `, name=${header[iName]}` : "") +
    (iRating >= 0 ? `, rating=${header[iRating]}` : "") +
    (iDate >= 0 ? `, date=${header[iDate]}` : "")
);
if (skipped.length)
  console.warn(`! ${skipped.length} row(s) had no text and were skipped: ${skipped.slice(0, 5).join(", ")}`);
console.warn(
  "! Quotes are copied verbatim and have NO focus text yet. build.mjs will refuse " +
    "to run until every quote has one — shorten them with the user first."
);
console.warn(
  "! Dates are kept in the JSON as provenance but are never rendered on a card."
);
