module.exports = (grunt) ->

  grunt.initConfig
    files:
      web3:
        "node_modules/embark-framework/js/web3.js"

      js:
        src: [
          "app/js/**/*.js"
        ]

      css:
        src: [
          "app/css/**/*.css"
        ]

      html:
        src: [
          "app/html/**/*.html"
        ]

      coffee:
        dest: "generated/dapp/compiled-coffee"
        compiled: [
          "generated/dapp/compiled-coffee/app.coffee"
          "generated/dapp/compiled-coffee/**/*.js"
        ]

      contracts:
        src: [
          "app/contracts/**/*.sol"
        ]

    coffee:
      compile:
        expand: true
        cwd: 'coffee'
        src: '**/*.coffee'
        dest: '<%= files.coffee.dest %>'
        ext: '.js'

    concat:
      app:
        src: ["<%= files.web3 %>", 'generated/tmp/abi.js', "<%= files.js.src %>", "<%= files.coffee.compiled %>"]
        dest: "generated/dapp/js/app.min.js"
      css:
        src: "<%= files.css.src %>"
        dest: "generated/dapp/css/app.min.css"

    watch:
      options:
        livereload: true

      html:
        files: ["<%= files.html.src %>"]
        tasks: ["copy"]

      js:
        files: ["<%= files.js.src %>"]
        tasks: ["concat"]

      css:
        files: ["<%= concat.css.src %>"]
        tasks: ["concat"]

      coffee:
        files: ["coffee/**/*.coffee"]
        tasks: ["coffee", "concat"]

      contracts:
        files: ["<%= files.contracts.src %>"]
        tasks: ["deploy", "concat", "copy"]

    copy:
      html:
        files:
          "generated/dapp/index.html" : "<%= files.html.src %>"
          "dist/dapp/index.html"      : "<%= files.html.src %>"
      css:
        files:
          "dist/dapp/css/app.min.css" : "<%= files.css.src %>"
      contracts:
        files:
          "dist/contracts/": '<%= files.contracts.src %>'

    uglify:
      dist:
        src: "<%= concat.app.dest %>" # input from the concat process
        dest: "dist/dapp/js/app.min.js"

    clean:
      workspaces: ["dist", "generated"]

    deploy:
      contracts: '<%= files.contracts.src %>'
      dest: 'generated/tmp/abi.js'

