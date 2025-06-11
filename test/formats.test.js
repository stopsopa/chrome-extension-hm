import test from "node:test";
import assert from "node:assert/strict";

import { toFlat, toList } from "../extension/formats.js";

test("no change", (t) => {
  const result = toFlat([
    {
      active: true,
      label: "Test Header",
      urlPattern: "example.com",
      name: "X-Test-Header",
      value: "test-value",
      valueSource: "dictionary",
    },
  ]);
  assert.deepEqual(result, [
    {
      active: true,
      label: "Test Header",
      urlPattern: "example.com",
      name: "X-Test-Header",
      value: "test-value",
      valueSource: "dictionary",
      first: true,
      regex: null,
    },
  ]);
});

test("synchronous passing test", (t) => {
  const result = toFlat([
    {
      active: true,
      label: "Test Header",
      urlPattern: "example.com",
      headers: {
        "X-discarded": {
          value: "test-value discarded",
          source: "dictionary discarded",
        },
        Authorization: {
          // Authorization will be prioritized
          value: "test-value",
          source: "dictionary",
        },
      },
    },
  ]);

  assert.deepEqual(result, [
    {
      active: true,
      label: "Test Header",
      urlPattern: "example.com",
      name: "Authorization",
      value: "test-value",
      valueSource: "dictionary",
      first: true,
      regex: null
    },
  ]);

  // This test passes because it does not throw an exception.
  //   assert.strictEqual(1, 1);
});

test("toList no change", (t) => {
  const result = toList([
    {
      active: true,
      label: "Test Header",
      urlPattern: "example.com",
      headers: {
        "X-Test-Header": {
          value: "test-value",
          source: "dictionary",
          first: false,
          regex: "/abc/i",
        },
      },
    },
  ]);

  assert.deepEqual(result, [
    {
      active: true,
      label: "Test Header",
      urlPattern: "example.com",
      headers: {
        "X-Test-Header": {
          value: "test-value",
          source: "dictionary",
          first: false,
          regex: "/abc/i",
        },
      },
    },
  ]);
});

// test for toList function
test("toList function test", (t) => {
  const result = toList([
    {
      active: true,
      label: "Test Header",
      urlPattern: "example.com",
      name: "X-Test-Header",
      value: "test-value",
      valueSource: "dictionary",
      first: false,
      regex: "/abc/i",
    },
  ]);

  assert.deepEqual(result, [
    {
      active: true,
      label: "Test Header",
      urlPattern: "example.com",
      headers: {
        "X-Test-Header": {
          value: "test-value",
          source: "dictionary",
          first: false,
          regex: "/abc/i",
        },
      },
    },
  ]);
});
