export default (prefix) => (msg) => new Error(`${prefix}: ${msg}`);
