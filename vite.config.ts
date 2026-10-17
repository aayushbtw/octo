import ultraciteFmt from "ultracite/oxfmt";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";
import react from "ultracite/oxlint/react";
import tanstack from "ultracite/oxlint/tanstack";
import { defineConfig } from "vite-plus";
import { voidPlugin } from "void";

export default defineConfig({
  fmt: {
    ...ultraciteFmt,
    ignorePatterns: [...(ultraciteFmt.ignorePatterns ?? []), ".claude/**"],
  },
  lint: {
    extends: [core, react, tanstack, antiSlop],
    ignorePatterns: [...(core.ignorePatterns ?? []), ".claude/**"],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    options: { typeAware: true, typeCheck: true },
    rules: {
      // Hoisting lets a route's `component:` sit above the component it names.
      "func-style": ["error", "declaration", { allowArrowFunctions: true }],
      "no-use-before-define": ["error", { functions: false }],
      // Hono middleware awaits next() and then reads or rewrites c.res.
      "node/callback-return": "off",
      // parseInt reads the leading count out of scraped text like "5 contributions"; Number() gives NaN.
      "unicorn/prefer-number-coercion": "off",
      // node-html-parser elements have no dataset.
      "unicorn/prefer-dom-node-dataset": "off",
      "react/function-component-definition": [
        "error",
        { namedComponents: "function-declaration" },
      ],
      // Base UI's checkbox is a span with a hidden input, so the label wraps it rather than pointing at it.
      "jsx-a11y/label-has-associated-control": [
        "error",
        { controlComponents: ["Checkbox", "Switch"], depth: 3 },
      ],
      // `throw redirect(...)` and `throw notFound()` are how TanStack Router exits a loader.
      "typescript/only-throw-error": [
        "error",
        {
          allow: [
            {
              from: "package",
              name: ["NotFoundError", "Redirect"],
              package: "@tanstack/router-core",
            },
          ],
        },
      ],
      "vite-plus/prefer-vite-plus-imports": "error",
    },
  },
  plugins: [voidPlugin()],
});
