# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.0.0-alpha.1](https://github.com/embark-framework/embark/compare/v5.0.0-alpha.0...v5.0.0-alpha.1) (2019-11-05)


### Bug Fixes

* **@embark/proxy:** Fix contract event subscriptions ([f9ad486](https://github.com/embark-framework/embark/commit/f9ad486))
* fix ws providers to have the patch for a bigger threshold ([#2017](https://github.com/embark-framework/embark/issues/2017)) ([9e654c5](https://github.com/embark-framework/embark/commit/9e654c5))





# [5.0.0-alpha.0](https://github.com/embark-framework/embark/compare/v4.1.1...v5.0.0-alpha.0) (2019-10-28)


### Bug Fixes

* fix error logs in the cockpit due from negative blocks numbers ([#1967](https://github.com/embark-framework/embark/issues/1967)) ([4b947bb](https://github.com/embark-framework/embark/commit/4b947bb))
* **@embark/proxy:** Check if WebSocket open before sending ([#1978](https://github.com/embark-framework/embark/issues/1978)) ([db71a93](https://github.com/embark-framework/embark/commit/db71a93))
* **@embark/proxy:** Fix contract event subscriptions ([173d53d](https://github.com/embark-framework/embark/commit/173d53d))


### Build System

* bump all packages' engines settings ([#1985](https://github.com/embark-framework/embark/issues/1985)) ([ed02cc8](https://github.com/embark-framework/embark/commit/ed02cc8))


### Features

* **@embark/test-runner:** make vm default node ([#1846](https://github.com/embark-framework/embark/issues/1846)) ([f54fbf0](https://github.com/embark-framework/embark/commit/f54fbf0))
* call action before starting the blockchain node ([c54b8d9](https://github.com/embark-framework/embark/commit/c54b8d9))


### BREAKING CHANGES

* node: >=10.17.0 <12.0.0
npm: >=6.11.3
yarn: >=1.19.1

node v10.17.0 is the latest in the 10.x series and is still in the Active LTS
lifecycle. Embark is still not compatible with node's 12.x and 13.x
series (because of some dependencies), otherwise it would probably make sense
to bump our minimum supported node version all the way to the most recent 12.x
release.

npm v6.11.3 is the version that's bundled with node v10.17.0.

yarn v1.19.1 is the most recent version as of the time node v10.17.0 was
released.
