module.exports = (grunt) ->

  grunt.registerTask "ipfs", "distribute into ipfs", (env_)  =>
    Embark = require('embark-framework')
    Embark.Release.ipfs()

