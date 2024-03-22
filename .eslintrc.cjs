/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
  ignorePatterns: ['node_modules/', 'dist/', 'out/'],
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    '@electron-toolkit',
    '@electron-toolkit/eslint-config-ts/eslint-recommended',
    '@vue/eslint-config-typescript/recommended',
    '@vue/eslint-config-prettier',
    '@vue/eslint-config-prettier/skip-formatting',
  ],
  rules: {
    'prettier/prettier': ['error'],
    'linebreak-style': ['error', 'unix'],
    '@typescript-eslint/no-unused-vars': ['off'],
    '@typescript-eslint/no-explicit-any': ['warn'],
    '@typescript-eslint/explicit-function-return-type': ['off'],
    'vue/require-default-prop': 'off',
    'vue/multi-word-component-names': 'off',
  },
};
