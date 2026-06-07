import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      ".vercel/**",
      "node_modules/**",
      "out/**",
      "build/**",
      "coverage/**",
      "public/**",
      "designs/**",
      "next-env.d.ts",
      "*.config.ts.bak",
      "*.log",
      "*.tsbuildinfo"
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["*.js", "lib/**/*.js", "scripts/**/*.js", "scripts/**/*.mjs", "server.js", "standalone-socket.js", "test-db.js", "update_sidebars.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off"
    }
  },
  {
    rules: {
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off"
    }
  }
];

export default eslintConfig;
