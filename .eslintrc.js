/** @type import('@typescript-eslint/experimental-utils').TSESLint.Linter.Config */
module.exports = {
    root: true,
    env: { es2020: true, node: true },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'plugin:import/recommended',
        'plugin:import/typescript',
        'prettier'
    ],
    parserOptions: {
        allowAutomaticSingleRunInference: false,
        createDefaultProgram: false,
        EXPERIMENTAL_useSourceOfProjectReferenceRedirect: false,
        project: './tsconfig.json',
        sourceType: 'module'
    },
    rules: {
        '@typescript-eslint/restrict-template-expressions': 'off',

        // these rules are validated by the typescript itself
        'import/named': 'off',
        'import/namespace': 'off',
        'import/default': 'off',
        'import/no-named-as-default-member': 'off',

        'import/extensions': ['error', 'never', { json: 'always' }],
        'import/first': 'error',
        'import/newline-after-import': 'error',
        'import/no-absolute-path': 'error',
        'import/no-anonymous-default-export': 'error',
        'import/no-cycle': 'error',
        'import/no-deprecated': 'warn',
        'import/no-extraneous-dependencies': ['error', { devDependencies: ['**/*.test.ts', 'test/**/*'] }],
        'import/no-named-default': 'error',
        'import/no-useless-path-segments': ['error', { noUselessIndex: true }],
        'import/order': ['error', { alphabetize: { order: 'asc' } }],
        'no-duplicate-imports': ['error', { includeExports: true }]
    }
}
