function logUtils(message) {
  if(typeof message !== "string") return message;

  return message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/\'/g, "&#39;");
}

function normalizeInput(input) {
  if(typeof input === 'string') return input;
  let args = Object.values(input);
  if (args.length === 0) {
    return "";
  }
  if (args.length === 1) {
    if (Array.isArray(args[0])) {
      return args[0].join(',');
    }
    return args[0] || "";
  }
  return ('[' + args.map((x) => {
    if (x === null) {
      return "null";
    }
    if (x === undefined) {
      return "undefined";
    }
    if (Array.isArray(x)) {
      return x.join(',');
    }
    return x;
  }).toString() + ']');
}

module.exports = {
  escapeHtml: logUtils,
  normalizeInput
};
