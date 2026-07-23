import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Investors portal (migrated from tidepay-bp): relax the newest React-hooks
  // stylistic rules and `any` for this migrated subtree so its established
  // patterns don't block the build. Scoped to the migrated dirs only — the rest
  // of the app keeps the full rule set. Candidates for a later polish pass.
  {
    files: [
      "components/plan/**",
      "components/gate/**",
      "components/analytics/**",
      "hooks/**",
    ],
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
