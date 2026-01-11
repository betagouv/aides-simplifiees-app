import { configApp as adonisConfig } from '@adonisjs/eslint-config'
import antfu from '@antfu/eslint-config'
import { globalIgnores } from "eslint/config";


export default antfu(
  {
    vue: true,
    typescript: true,
  },
  globalIgnores([
    'public/assets/**',
    '**/publicodes-build/**',
    '**/publicodes-build/**',
    '**/publicodes/**/README.md',
    'docs/**',
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
