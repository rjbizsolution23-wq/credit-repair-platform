const path = require('path');
const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = (config, options) => {
  // Enable tree shaking for better optimization
  config.optimization = {
    ...config.optimization,
    usedExports: true,
    sideEffects: false,
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10
        },
        angular: {
          test: /[\\/]node_modules[\\/]@angular[\\/]/,
          name: 'angular',
          chunks: 'all',
          priority: 20
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 5,
          reuseExistingChunk: true
        }
      }
    }
  };

  // Add performance hints
  config.performance = {
    hints: 'warning',
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  };

  // Add bundle analyzer in development mode
  if (options.configuration === 'development') {
    config.plugins.push(
      new BundleAnalyzerPlugin({
        analyzerMode: 'server',
        openAnalyzer: false,
        analyzerPort: 8888
      })
    );
  }

  // Optimize for production
  if (options.configuration === 'production') {
    // Add compression
    config.plugins.push(
      new webpack.optimize.AggressiveMergingPlugin(),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('production')
      })
    );

    // Minimize CSS
    config.optimization.minimizer = [
      ...config.optimization.minimizer,
    ];
  }

  return config;
};