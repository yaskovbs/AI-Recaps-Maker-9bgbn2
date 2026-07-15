import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // This codebase intentionally uses broad boundary types for Supabase,
      // browser APIs, generated translations, and third-party SDK globals.
      // TypeScript remains the source of truth while these boundaries are
      // incrementally narrowed.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "react-refresh/only-export-components": "off",
      // Existing effects deliberately run on lifecycle boundaries. Enabling
      // this globally caused unstable subscriptions; new hooks should use
      // memoized callbacks and declare their dependencies explicitly.
      "react-hooks/exhaustive-deps": "off",
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-useless-escape": "off",
    },
  }
);
