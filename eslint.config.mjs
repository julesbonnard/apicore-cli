import js from "@eslint/js";
import nodePlugin from "eslint-plugin-n";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  nodePlugin.configs["flat/recommended-script"],
  ...tseslint.configs.recommended,
  {
    ignores: ["dist", "tmp"]
  },
  {
    languageOptions: {
      sourceType: "module",
      parserOptions: {
        project: "tsconfig.eslint.json",
      }
    },
    rules: {
      "n/hashbang": ["error", {
        additionalExecutables: ["dev.js"]
      }],
      "n/no-missing-import": "off",
      "n/no-unpublished-import": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_"
      }],
      "@typescript-eslint/no-namespace": "off",
    }
  },
  {
    files: ["bin/*.js", "eslint.config.mjs"],
    languageOptions: {
      parserOptions: {
        project: null,
      }
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    }
  }
)
