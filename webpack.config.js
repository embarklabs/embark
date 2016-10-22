module.exports = {
  entry: './js/embark.js',
  output: {
    libraryTarget: 'var',
    library: 'EmbarkJS',
    path: './js/build',
    filename: 'embark.bundle.js'
  }
};
