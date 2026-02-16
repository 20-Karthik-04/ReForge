import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';

export default [
    eslint.configs.recommended,
    {
        files: ['backend/**/*.js', 'shared/**/*.js'],
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
            globals: {
                console: 'readonly',
                process: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                Buffer: 'readonly',
                module: 'readonly',
                require: 'readonly',
            },
        },
        rules: {
            'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        },
    },
    prettier,
];
