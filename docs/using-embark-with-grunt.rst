Using Embark with Grunt
====================================

**1. Edit embark.json**

Edit ``embark.json`` to have the line ``"js/app.js": ["embark.js"]``, this will make embark create the file containing the contracts initilization to ``dist/app.js``.

.. code:: json

    {
      "contracts": ["app/contracts/**"],
      "app": {
        "app.js": ["embark.js"]
      },
      "buildDir": "dist/",
      "config": "config/",
      "plugins": {
      }
    }

**2. add the generated file to Grunt config file so it's included with the other assets**

.. code:: coffee

    module.exports = (grunt) ->

      grunt.initConfig(
        files:
          js:
            src: [
              "dist/app.js"
              "app/js/**/*.js"
            ]

