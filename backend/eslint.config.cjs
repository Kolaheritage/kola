// eslint.config.cjs
const js = require("@eslint/js");
const globals = require("globals");
// const pluginNode = require("@eslint/plugin-node"); // optional if needed

module.exports = [
  {
    files: ["**/*.js"],
    languageOptions: {
      globals: { ...globals.node },
      ecmaVersion: "latest",
      sourceType: "commonjs", // for Node projects
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
    },
  },
  js.configs.recommended,
];
