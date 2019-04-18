title: Troubleshooting
layout: docs
---
In case you're experiencing problems with using Embark, here is a list of solutions to some frequently encountered issues. If this page doesn't help you solve your problem, try doing a search on [GitHub](https://github.com/embark-framework/embark/issues).

## node-gyp problems
node-gyp can cause problems, because it requires a C++ compiler.

If you do have problems caused by it, first follow the installation steps for your OS [here](https://github.com/nodejs/node-gyp#installation).

If you still have problems and are on Windows, try the following:
- run `npm config set msvs_version 2015` before `npm install`
- Repair Windows Build tools that the node-gyp doc made you install. If it tells you to remove a conflicting version do it. After the repair succeeded, reboot.

## EACCES / npm ERR Permission denied

Issues typically occur if NodeJS and/or Embark are installed using `sudo`, avoid using it possible. There are [several options](https://docs.npmjs.com/getting-started/fixing-npm-permissions) to fix this. We recommend installing node using [NVM](https://github.com/creationix/nvm/blob/master/README.md)

