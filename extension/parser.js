const th = (msg) => new Error(`parser.js error: ${msg}`);
/**
 * @param {string} str
 * @returns {Object}
 */
export default function parser(str) {
  if (typeof str !== "string") {
    throw th("Input must be a string");
  }

  const lines = str
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => line.includes(":"))
    .map((line) => {
      const parts = line.split(":");

      const first = parts.shift();

      const rest = parts.join(":");

      if (typeof first === "string" && typeof rest === "string") {
        const a = first.trim();
        const b = rest.trim();

        if (a && b) {
          return [a, b];
        }
      }

      return false;
    })
    .filter(Boolean).reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});

  return lines;
}
