var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: path.join(__dirname, 'x-router-angular.js'),
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'x-router-angular.js',
    library: 'xrouterangular',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  externals: {
    angular: 'angular'
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({sourceMap:true})
  ]
};
