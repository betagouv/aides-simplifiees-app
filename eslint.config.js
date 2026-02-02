import { configApp as adonisConfig } from '@adonisjs/eslint-config'
import antfu from '@antfu/eslint-config'
import { globalIgnores } from "eslint/config";


export default antfu(
  {
    vue: true,
    typescript: true,
  },
  globalIgnores([
    // Build & dependencies
    'public/assets/**',
    '**/publicodes-build/**',
    'node_modules/**',
    'build/**',
    'tmp/**',
    'dist/**',

    // Coverage & reports
    'coverage/**',
    '.nyc_output/**',
    'reports/**',
    '*.lcov',

    // Database & backups
    'replications/**',
    'infra/backups*/**',
    'database/seeders_data/**',

    // Logs & cache
    'logs/**',
    '.mypy_cache/**',

    // Config & env files
    '.env*',
    '.DS_Store',
    '.npmrc',
    '.nvmrc',
    '.prettier-config',
    '.c8rc.json',
    '.editorconfig',
    '.dockerignore',
    'browserconfig.xml',

    // Git & CI/CD
    '.git/**',
    '.github/**',
    '.githooks/**',
    '.husky/**',
    '.gitignore',

    // Editor configs
    '.vscode/**',
    '.fleet/**',
    '.idea/**',

    // Docs & specific files
    'docs/**',
    '**/publicodes/**/README.md',
    'CHANGELOG.md',
    'LICENSE',
    'README.md',
    'Makefile',
    'logfile',
    'package-lock.json',

    // Query & data files
    'queries/**',
    '**/detected_icons.json',

    // Infrastructure
    'infra/**',

    // SQL dumps
    '*.sql',
  ]),
  {
    rules: {
      'prettier/prettier': 'off',
      'no-console': 'off',
    }
  },
  {
    files: ['**/*.ts'],
    rules: {
      '@unicorn/filename-case': ['error', { case: 'snakeCase', ignore: ['\\.md$'] }],
    }
  },
  {
    files: ['**/*.vue'],
    rules: {
      'vue/max-attributes-per-line': [
        'error',
        {
          singleline: {
            max: 1,
          },
          multiline: {
            max: 1,
          },
        },
      ],
    },
  },
)
  .renamePlugins({
    'style': 'antfu-style',
  })
  .prepend(adonisConfig())
