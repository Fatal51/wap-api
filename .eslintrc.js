module.exports = {
  env: {
    browser: false,
    es2021: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "simple-import-sort", "unused-imports"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier", // Integrates with Prettier
  ],
  rules: {
    "no-unused-vars": "off",
    "no-console": "warn", // You may want to see console warnings during development
    "@typescript-eslint/explicit-module-boundary-types": "off",

    // Unused import and variable handling
    "@typescript-eslint/no-unused-vars": "off",
    "unused-imports/no-unused-imports": "warn",
    "unused-imports/no-unused-vars": [
      "warn",
      {
        vars: "all",
        varsIgnorePattern: "^_", // Ignore underscore-prefixed variables
        args: "after-used",
        argsIgnorePattern: "^_", // Ignore underscore-prefixed arguments
      },
    ],

    // Import sorting rules
    "simple-import-sort/exports": "warn",
    "simple-import-sort/imports": [
      "warn",
      {
        groups: [
          // External libraries
          ["^@?\\w"],
          // Internal imports
          ["^@/"],
          // Relative imports up to three levels
          [
            "^\\./?$",
            "^\\.(?!/?$)",
            "^\\.\\./?$",
            "^\\.\\.(?!/?$)",
            "^\\.\\./\\.\\./?$",
          ],
        ],
      },
    ],
  },
  overrides: [
    {
      files: ["**/*.ts"], // Apply to TypeScript files only
      rules: {
        "@typescript-eslint/explicit-function-return-type": "off", // Adjust based on your preference
      },
    },
  ],
};
