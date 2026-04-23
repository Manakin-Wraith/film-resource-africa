import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Root-level utility scripts — not part of the Next.js app
    "*.mjs",
    "scripts/**",
  ]),
  {
    rules: {
      // Downgrade from error → warn so builds don't fail on legacy `any` usage
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow setState in effects for controlled filter resets
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
