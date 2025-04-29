import { configApp as adonisConfig } from '@adonisjs/eslint-config'
import antfu from '@antfu/eslint-config'
import { globalIgnores } from "eslint/config";


export default antfu(
    {
      vue: true,
      typescript: true,
    },
    globalIgnores([
      '/public/assets/**',
    ]),
    {
      rules: {
        'prettier/prettier': 'off',
        'no-console': 'off',
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
