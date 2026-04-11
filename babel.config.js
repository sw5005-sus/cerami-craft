module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxRuntime: 'automatic' }],
      '@babel/preset-typescript',
      '@babel/preset-flow',
    ],
    plugins: [
      '@babel/plugin-transform-flow-strip-types',
    ],
  };
};
