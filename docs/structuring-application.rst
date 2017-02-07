Structuring Application
=======================

Embark is quite flexible and you can configure you're own directory
structure using ``embark.json``

.. code:: json

    # embark.json
    {
      "contracts": ["app/contracts/**"],
      "app": {
        "css/app.css": ["app/css/**"],
        "images/": ["app/images/**"],
        "js/app.js": ["embark.js", "app/js/**"],
        "index.html": "app/index.html"
      },
      "buildDir": "dist/",
      "config": "config/",
      "plugins": {}
    }

