import js from "@eslint/js";
import ts from "typescript-eslint";
import a11y from "eslint-plugin-jsx-a11y";
import globals from "globals";
export default [
  {
    ignores: [
      "dist/**",
      ".astro/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ["**/*.{ts,tsx,mjs}"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  { files: ["**/*.tsx"], ...a11y.flatConfigs.recommended },
  {
    files: ["src/components/ReplicationLab.tsx"],
    rules: {
      // Named scrollable lists need focus for keyboard scrolling across browsers.
      "jsx-a11y/no-noninteractive-tabindex": ["error", { tags: ["ul", "ol"] }],
    },
  },
];
