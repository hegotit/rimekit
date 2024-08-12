import js from '@eslint/js';
import ts from 'typescript-eslint';
import vue from 'eslint-plugin-vue';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  ...vue.configs['flat/recommended'],
  prettier,
  { files: ['*.{js,mjs,cjs,jsx,vue,ts,mts,cts,tsx}', '**/*.{js,mjs,cjs,jsx,vue,ts,mts,cts,tsx}'] },
  {
    languageOptions: {
      parserOptions: {
        parser: ts.parser,
        ecmaVersion: 'latest',
        ecmaFeatures: {
          jsx: true,
        },
        extraFileExtensions: ['.vue'],
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
    },
  },
  {
    ignores: ['node_modules/', 'dist/', 'out/', '.gitignore'],
  },
  {
    rules: {
      semi: ['error', 'always'],
      'linebreak-style': ['error', 'unix'],
      '@typescript-eslint/no-unused-vars': ['off'],
      '@typescript-eslint/no-explicit-any': ['warn'],
      '@typescript-eslint/explicit-function-return-type': ['off'],
      'vue/require-default-prop': 'off',
      'vue/multi-word-component-names': 'off',
    },
  },
];
