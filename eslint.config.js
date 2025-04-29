// eslint.config.js
import globals from "globals";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

export default [
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off",
      "prettier/prettier": ["error"],
    },
    settings: {},
  },
  prettierConfig,
];
