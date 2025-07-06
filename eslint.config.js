import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  { 
    ignores: [
      'dist/**',
      'server/dist/**',
      'node_modules/**',
      'coverage/**',
      'build/**',
      '*.config.js',
      '*.config.cjs',
      '*.config.ts',
      'public/**',
      'scripts/**',
      'server/src/setupBackendTests.js',
      'server/test-sanitize.js',
      'server/.eslintrc.js',
      'server/babel.config.js',
      'server/jest.config.cjs',
      'server/jest.config.js',
      'src/utils/mlWorkerUtils.js',
      'src/types/jest-dom.d.ts'
    ] 
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-namespace': 'warn',
      'no-case-declarations': 'warn',
      '@typescript-eslint/no-unsafe-declaration-merging': 'warn'
    },
  },
];
