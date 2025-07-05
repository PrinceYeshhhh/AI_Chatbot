module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        node: 'current'
      }
    }],
    '@babel/preset-typescript'
  ],
  plugins: [
    '@babel/plugin-transform-export-namespace-from',
    '@babel/plugin-transform-class-properties',
    '@babel/plugin-transform-object-rest-spread'
  ],
  env: {
    test: {
      plugins: [
        ['@babel/plugin-transform-modules-commonjs', { allowTopLevelThis: true }]
      ]
    }
  }
}; 