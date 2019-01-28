export const schema = {
  minProperties: 1,
  patternProperties: {
    ".*": {
      minProperties: 1,
      patternProperties: {
        "^[a-zA-Z][a-zA-Z0-9_]*$": {
          pattern: "^(u?int[0-9]{0,3}(\[\])?|string|bool|address|belongsTo|hasMany|ipfsText|ipfsImage|bytes[0-9]{0,3})(\[\])?$",
          type: "string",
        },
      },
      type: ["object"],
    },
  },
  title: "Scafold Schema",
  type: "object",
};
