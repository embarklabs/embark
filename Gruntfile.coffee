module.exports = (grunt) ->

  grunt.initConfig
    "embark-framework": {}
    pkg: grunt.file.readJSON('package.json')
    clean:
      build: ["build/"]
    coffee:
      compile:
        expand: true
        src: 'src/**/*.coffee'
        dest: 'build/'
        ext: '.js'
    uglify:
      options: banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      build:
        files:
          'build/<%= pkg.name %>.min.js': [
            "build/<%= pkg.name %>.js"
          ]
    mochaTest:
      test:
        src: ['test/**/*.js']
    jshint:
      all: ['bin/embark', 'lib/**/*.js', 'js/mine.js', 'js/embark.js']

  grunt.loadTasks "tasks"
  require('matchdep').filterAll(['grunt-*','!grunt-cli']).forEach(grunt.loadNpmTasks)

  grunt.registerTask 'default', ['clean']
  grunt.registerTask 'build', ['clean', 'coffee']

