/**
 * node deduplicate.js exports/customHeaders.json
 */

import fs from "fs";

import { sortObjectNested } from "./lib/sortObjectNested.js";

import { md5 } from "./lib/md5.js";

const file = process.argv[2];

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

fs.writeFileSync(file, JSON.stringify(uniqData, null, 2));
