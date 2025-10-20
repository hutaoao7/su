module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'plugin:vue/essential',
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['vue'],
  rules: {
    // ========== 工程硬约束规则 ==========
    // 禁止前端直连Supabase
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['**/supabase*', '@supabase/*'],
          message: '前端禁止直连Supabase，请使用云函数'
        }
      ]
    }],
    
    // 禁止前端出现service_role和硬编码API Key
    'no-restricted-syntax': ['error',
      {
        selector: "Literal[value=/service_role/i]",
        message: 'service_role只能在云函数中使用，前端禁止出现'
      },
      {
        selector: "Literal[value=/sk-[a-zA-Z0-9]{20,}/]",
        message: 'API Key必须使用环境变量，禁止硬编码'
      }
    ],
    
    // ========== Vue组件规范 ==========
    'vue/multi-word-component-names': 'off',
    'vue/no-v-model-argument': 'off',
    'vue/component-name-in-template-casing': ['error', 'kebab-case'],
    'vue/component-definition-name-casing': ['error', 'PascalCase'],
    'vue/prop-name-casing': ['error', 'camelCase'],
    'vue/require-default-prop': 'warn',
    'vue/require-prop-types': 'error',
    'vue/no-unused-components': 'warn',
    'vue/no-unused-vars': 'warn',
    
    // ========== 代码质量规则 ==========
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-undef': 'error',
    'eqeqeq': ['error', 'always', { null: 'ignore' }],
    'curly': ['error', 'all'],
    'no-var': 'error',
    'prefer-const': 'error',
    
    // ========== 代码风格 ==========
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'always-multiline'],
  },
  globals: {
    uni: 'readonly',
    wx: 'readonly',
    uniCloud: 'readonly',
    plus: 'readonly',
    getCurrentPages: 'readonly',
    getApp: 'readonly',
  },
};

