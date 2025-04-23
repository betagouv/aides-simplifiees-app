import { configApp as adonisConfig } from '@adonisjs/eslint-config'
import antfu from '@antfu/eslint-config'

export default antfu(
    {
      vue: true,
      typescript: true,
    },
    {
      rules: {
        // 'vue/no-undef-components ': 'error',
        'antfu-style/arrow-parens': [
          'error',
          'always',
        ],
        'antfu-style/operator-linebreak': ["error", "none"],
        'antfu-style/member-delimiter-style': ["error", {
          "multiline": {
            "delimiter": "none",
          },
          "singleline": {
            "delimiter": "semi",
            "requireLast": false
          },
          "multilineDetection": "brackets"
        }], // disable member delimiter style
        'antfu-style/brace-style': [ // enforce the one true brace style
          'error',
          '1tbs',
          {
            allowSingleLine: true,
          },
        ],
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
