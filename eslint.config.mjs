import { config } from "@remotion/eslint-config-flat";

export default [
  ...config,
  {
    ignores: ["node_modules/**", "out/**", "media/**", ".agents/**", "docs/**"],
  },
  {
    files: ["scripts/**/*.ts"],
    rules: {
      // Scripts print progress on purpose.
      "no-console": "off",
    },
  },
];
