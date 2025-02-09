import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // General rules
      "no-console": "off",
      "no-debugger": "off",
      "no-unused-vars": "off",
      "no-restricted-syntax": "off",

      // TypeScript-specific rules
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-non-null-assertion": "off",

      // React/Next.js-specific rules
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/jsx-key": "off",

      // Formatting rules (handled by Prettier if used)
      "semi": "off",
      "quotes": "off",
      "comma-dangle": "off",
      "indent": "off",
    },
  },
];

export default eslintConfig;