const path = require('path');

module.exports = {
  // Entry point for your application
  entry: './src/index.ts',  // Adjust the entry point according to your project
  output: {
    filename: 'bundle.js',  // The bundled output file
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.ts', '.js'], // Resolve both TypeScript and JavaScript files
  },
  module: {
    rules: [
      {
        test: /\.ts$/,         // Match TypeScript files
        use: 'ts-loader',      // Use ts-loader to compile TypeScript
        exclude: /node_modules/,
      },
      {
        test: /\.(png|jpg|jpeg|gif)$/i,  // Handle image files
        type: 'asset/resource',          // Load images as assets
      },
    ],
  },
  mode: 'development',  // Use 'production' mode for optimized builds
};