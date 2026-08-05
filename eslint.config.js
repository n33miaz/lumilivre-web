import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      prettier,
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // A CSP do nginx não libera 'unsafe-eval'. Todo zod entra por
      // src/schemas/zod.ts, que desliga o JIT (o motivo está lá); import direto
      // faz voltar a violação de CSP no console de toda tela com formulário.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'zod',
              message:
                "Importe { z } de 'src/schemas/zod' — o import direto reativa o JIT do zod e viola a CSP.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/schemas/zod.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
);
