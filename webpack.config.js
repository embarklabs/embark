module.exports = {
  entry: './js/embark.js',
  output: {
    libraryTarget: 'umd',
    library: 'EmbarkJS',
    path: __dirname + '/js/build',
    filename: 'embark.bundle.js'
  }
};
