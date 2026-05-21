const raycast = require("@raycast/eslint-config");

module.exports = [
  ...raycast.slice(0, 5),
  ...raycast[5],
  ...raycast.slice(6),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
];
