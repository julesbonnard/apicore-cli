import js from "@eslint/js";
import nodePlugin from "eslint-plugin-n";

export default [
  js.configs.recommended,
  nodePlugin.configs["flat/recommended-script"],
  {
    ignores: ["dist", "tmp"]
  },
  {
    languageOptions: {
        sourceType: "module"
    },
    rules: {
      "n/hashbang": ["error", {
        additionalExecutables: ["dev.js"]
      }]
    }
  }
]
