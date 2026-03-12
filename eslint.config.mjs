import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Project rule: disallow `as unknown` (and the common `unknown as T` double-cast pattern).
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSAsExpression[typeAnnotation.type='TSUnknownKeyword']",
          message:
            "Do not use `as unknown`. Model the type properly (e.g. Zod parse, type guards) or refactor the types.",
        },
        {
          selector: "TSTypeAssertion[typeAnnotation.type='TSUnknownKeyword']",
          message:
            "Do not use `<unknown>...` type assertions. Model the type properly (e.g. Zod parse, type guards) or refactor the types.",
        },
      ],
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
  // Must be last: turns off rules that conflict with Prettier.
  prettier,
]);

export default eslintConfig;
