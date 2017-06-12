module.exports = {
  entry: './js/embark.js',
  output: {
    libraryTarget: 'var',
    library: 'EmbarkJS',
    path: __dirname + '/js/build',
    filename: 'embark.bundle.js'
  }
};
