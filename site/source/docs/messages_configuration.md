title: Configuring Messages with Whisper
layout: docs
---

With Embark it's very easy to connect to messaging channels using Whisper. In this guide we'll discuss how to set everything up to add messaging support to our applications.

## Configuration basics

By default, Embark will check our preferred communication configuration in the file `config/communication.js`. This file contains the preferred configuration for each environment, with `default` being the configuration that applies to every environment (for more information about environments, check out [this guide](/docs/environments.html). Each of these options can be individually overridden on a per environment basis.

Here's an example configuration:

```
module.exports = {
  default: {
    enabled: true,
    provider: 'whisper',
    available_providers: ['whisper']
  }
}
```

Available options:


Option | Type: `default` | Value         
--- | --- | --- 
`enabled` | boolean: `true/false` | To enable or completely disable communication support
`provider` |  string: `whisper`  | Desired provider to automatically connect to in the dapp.
`available_providers`  | array: `["whisper"]` |  List of communication platforms to be supported in the dapp. This will affect what's available with the EmbarkJS library in the dapp so if you don't need Whisper for example, removing it from this will considerably reduce the file size of the generated JS code.

