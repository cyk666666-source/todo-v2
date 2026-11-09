module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  ignorePatterns: ['dist', 'node_modules'],
  rules: {
    // 三条标尺：对应 AI 生成代码的三个高频病
    '@typescript-eslint/no-explicit-any': 'error',
    complexity: ['error', 10],
    'max-depth': ['error', 3],
    // TS 项目里由 TS 自己检查标识符，关掉内核规则避免误报；
    // 未使用变量交给 TS 版规则，warning 上限 3 条
    'no-undef': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
  },
};
