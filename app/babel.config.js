module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // ✅ NativeWind plugin for className support (temporarily disabled)
      // 'nativewind/babel',
    ],
  };
};
