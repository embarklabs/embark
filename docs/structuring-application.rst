Structuring Application
=======================

Embark is quite flexible and you can configure you're own directory
structure using ``embark.json``

.. code:: json

    # embark.json
    {
      "contracts": ["contracts/**"],
      "app": {
        "js/app.js": ["app/dapp.js"],
        "index.html": "app/index.html",
        "css/app.css": ["app/css/**"],
        "images/": ["app/images/**"]
      },
      "buildDir": "dist/",
      "config": "config/",
      "plugins": {}
    }

