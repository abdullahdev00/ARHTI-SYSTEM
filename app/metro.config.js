const { getDefaultConfig } = require('expo/metro-config');

// ✅ Simple, working metro config
const config = getDefaultConfig(__dirname);

// Add security configurations for production builds
if (process.env.NODE_ENV === 'production') {
  config.transformer.minifierConfig = {
    keep_classnames: false,
    keep_fnames: false,
    mangle: {
      keep_classnames: false,
      keep_fnames: false,
    },
    output: {
      ascii_only: true,
      beautify: false,
      semicolons: false,
    },
    sourceMap: false,
    toplevel: false,
    warnings: false,
  };
}

module.exports = config;
