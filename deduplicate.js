/**
 * node deduplicate.js exports/customHeaders.json
 */

import fs from "fs";

import { sortObjectNested } from "./lib/sortObjectNested.js";

import { md5 } from "./lib/md5.js";

const target = `exports/customHeaders.json`;

const files = fs
  .readdirSync("exports")
  .filter((f) => f.endsWith(".json"))
  .map((f) => `exports/${f}`);

if (files.length !== 1) {
  throw new Error("Please provide exactly one file in the exports directory");
}

const file = files[0];

const data = JSON.parse(fs.readFileSync(file, "utf8"));

const sortedData = sortObjectNested(data);

const uniq = [];

const uniqData = sortedData.reduce((acc, d) => {
  const hash = md5(JSON.stringify(d));

  if (!uniq.includes(hash)) {
    uniq.push(hash);
    acc.push(d);
  }

  return acc;
}, []);

console.log(`${sortedData.length} -> ${uniqData.length}`);

fs.writeFileSync(target, JSON.stringify(uniqData, null, 2));

if (file !== target) {
  console.log(`Removing ${file}`);
  fs.unlinkSync(file);
}
