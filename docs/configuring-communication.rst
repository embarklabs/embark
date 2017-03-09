Configuring Communication (Whisper, Orbit)
==========================

Embark will check your prefered communication configuration in the file ``config/communication.json``. This file will contain the prefered configuration for each environment. With ``default`` being the configuration fields that applies to every environment. Each of those can be individually overriden in a per environment basis.

e.g :

.. code:: javascript

    {
      "default": {
        "enabled": true,
        "provider": "whisper",
        "available_providers": ["whisper", "orbit"]
      }
    }

options available:
  * ``enabled`` (boolean: true/false) to enable or completly disable communication support
  * ``provider`` (string: "wisper" or "orbit") desired provider to automatically connect to on the dapp. e.g in the example above, seting this to ``"whisper"`` will automaticaly add ``EmbarkJS.setProvider('whisper')`` to the generated code
  * ``available_providers`` (array: ["whisper", "orbit"]) list of communication platforms to be supported on the dapp. This will affect what's available with the EmbarkJS library on the dapp so if you don't need Orbit for e.g, removing it from this will considerably reduce the file size of the generated JS code.

