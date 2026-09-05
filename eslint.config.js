const eslint = require('@eslint/js') // eslint-disable-line no-undef,@typescript-eslint/no-require-imports
const jsdoc = require('eslint-plugin-jsdoc') // eslint-disable-line no-undef,@typescript-eslint/no-require-imports
const tseslint = require('typescript-eslint') // eslint-disable-line no-undef,@typescript-eslint/no-require-imports

// eslint-disable-next-line no-undef
module.exports = tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  jsdoc.configs['flat/recommended-typescript'],
  {
    ignores: [
      '**/*@tmp*', // Jenkins temp files
      '**/build/**',
      '**/coverage/**',
      '**/generated/**',
      '**/results/**',
      '**/screenshots/**',
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
    rules: {
      'jsdoc/tag-lines': ['warn', 'any', { startLines: 1 }],
      'jsdoc/require-jsdoc': [
        'warn',
        {
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
          },
        },
      ],
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
      ...Object.fromEntries(Object.keys(jsdoc.rules ?? {}).map((rule) => [`jsdoc/${rule}`, 'off'])),
    },
  }
)
