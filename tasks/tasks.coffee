module.exports = (grunt) ->

  grunt.registerTask "deploy", ["coffee", "deploy_contracts", "concat", "copy", "server", "watch"]
  grunt.registerTask "build", ["clean", "deploy_contracts", "coffee", "concat", "uglify", "copy"]

