import eslint from '@eslint/js'
import jsdocPlugin from 'eslint-plugin-jsdoc'
import prettierPlugin from 'eslint-plugin-prettier'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    ignores: [
      '**/build/**',
      '**/coverage/**',
      '**/generated/**',
      '**/results/**',
      '**/perf/**',
      '**/.vscode/**',
      '**/.yarn/**',
      '**/.pnp.*',
      '**/tsconfig.tsbuildinfo',
      '**/.env',
      '**/logback.log',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      jsdoc: jsdocPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
      'jsdoc/tag-lines': ['error', 'any', { startLines: 1 }],
    },
  },
  {
    files: ['**/*.tsx'],
    rules: {
      'jsdoc/require-param': 'off',
      'jsdoc/require-returns': 'off',
    },
  },
  {
    files: ['**/test/**/*', '**/scripts/**/*'],
    rules: {
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      ...Object.fromEntries(Object.keys(jsdocPlugin.rules ?? {}).map((rule) => [`jsdoc/${rule}`, 'off'])),
    },
  }
)
