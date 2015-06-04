module.exports = (grunt) ->

  grunt.loadNpmTasks "embark-framework"

  grunt.initConfig(
    @initEmbarkConfig(
      files:
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

        contracts:
          src: [
            "app/contracts/**/*.sol"
          ]

      concat:
        app:
          src: ["<%= files.web3 %>", 'generated/tmp/abi.js', "<%= files.js.src %>", "<%= files.coffee.compiled %>"]
          dest: "generated/dapp/js/app.min.js"
        css:
          src: "<%= files.css.src %>"
          dest: "generated/dapp/css/app.min.css"

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

      deploy:
        contracts: '<%= files.contracts.src %>'
        dest: 'generated/tmp/abi.js'
    )
  )

  # loading external tasks (aka: plugins)
  # Loads all plugins that match "grunt-", in this case all of our current plugins
  require('matchdep').filterAll('grunt-*').forEach(grunt.loadNpmTasks)

