import js from '@eslint/js'
import globals from 'globals'

export default [
    {
        ignores: ['node_modules/**', 'deploy/**', 'logs/**', 'deploy.tar.gz'],
    },
    js.configs.recommended,
    {
        languageOptions: {
            globals: globals.node,
            ecmaVersion: 2023,
            sourceType: 'module',
        },
    },
]
