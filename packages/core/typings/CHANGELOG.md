# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.0.0-alpha.2](https://github.com/embark-framework/embark/compare/v5.0.0-alpha.1...v5.0.0-alpha.2) (2019-12-05)


### Bug Fixes

* **@embark/core:** ensure type declaration for Plugin.registerActionForEvent() is legit ([5dc4b21](https://github.com/embark-framework/embark/commit/5dc4b21)), closes [/github.com/embark-framework/embark/commit/776db1b7f71e9a78f216cf2acc6c1387c60b3604#diff-5cab125016e6d753f03b6cd0241d5ebbR267](https://github.com//github.com/embark-framework/embark/commit/776db1b7f71e9a78f216cf2acc6c1387c60b3604/issues/diff-5cab125016e6d753f03b6cd0241d5ebbR267)
* **@embark/proxy:** Fix unsubsribe handling and add new provider ([f6f4507](https://github.com/embark-framework/embark/commit/f6f4507))


### Features

* **@embark/embark-rpc-manager:** Add support for `eth_signTypedData_v3` ([c7ec49a](https://github.com/embark-framework/embark/commit/c7ec49a)), closes [#1850](https://github.com/embark-framework/embark/issues/1850) [#1850](https://github.com/embark-framework/embark/issues/1850)





# [5.0.0-alpha.1](https://github.com/embark-framework/embark/compare/v5.0.0-alpha.0...v5.0.0-alpha.1) (2019-11-05)


### Bug Fixes

* **@embark/proxy:** Fix contract event subscriptions ([f9ad486](https://github.com/embark-framework/embark/commit/f9ad486))





# [5.0.0-alpha.0](https://github.com/embark-framework/embark/compare/v4.1.1...v5.0.0-alpha.0) (2019-10-28)


### Bug Fixes

* **@embark/proxy:** Fix contract event subscriptions ([173d53d](https://github.com/embark-framework/embark/commit/173d53d))


### Build System

* bump all packages' engines settings ([#1985](https://github.com/embark-framework/embark/issues/1985)) ([ed02cc8](https://github.com/embark-framework/embark/commit/ed02cc8))


### Features

* **@embark/compiler:** support :before and :after hooks on event compiler:contracts:compile ([#1878](https://github.com/embark-framework/embark/issues/1878)) ([043ccc0](https://github.com/embark-framework/embark/commit/043ccc0))


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





# [4.1.0](https://github.com/embark-framework/embark/compare/v4.1.0-beta.6...v4.1.0) (2019-08-12)

**Note:** Version bump only for package @types/embark





# [4.1.0-beta.5](https://github.com/embark-framework/embark/compare/v4.1.0-beta.4...v4.1.0-beta.5) (2019-07-10)


### Bug Fixes

* **@embark/code-runner:** restore EmbarkJS.environment property in the cli dashboard ([7d27125](https://github.com/embark-framework/embark/commit/7d27125))





# [4.1.0-beta.4](https://github.com/embark-framework/embark/compare/v4.1.0-beta.3...v4.1.0-beta.4) (2019-06-27)


### Bug Fixes

* **@embark/coverage:** function types and single statement ifs ([2ce9ca6](https://github.com/embark-framework/embark/commit/2ce9ca6))





# [4.1.0-beta.3](https://github.com/embark-framework/embark/compare/v4.1.0-beta.2...v4.1.0-beta.3) (2019-06-07)

**Note:** Version bump only for package @types/embark





# [4.1.0-beta.1](https://github.com/embark-framework/embark/compare/v4.1.0-beta.0...v4.1.0-beta.1) (2019-05-15)


### Features

* **@embark/api:** Add command `service api on/off` ([634feb5](https://github.com/embark-framework/embark/commit/634feb5))





# [4.0.0](https://github.com/embark-framework/embark/compare/v4.0.0-beta.2...v4.0.0) (2019-03-18)

**Note:** Version bump only for package @types/embark





# [4.0.0-beta.1](https://github.com/embark-framework/embark/compare/v4.0.0-beta.0...v4.0.0-beta.1) (2019-03-18)


### Bug Fixes

* **@embark/cockpit:** Fix cockpit not suggesting console commands ([0eaad43](https://github.com/embark-framework/embark/commit/0eaad43))
* **console:** fix ENS tests not working with embark side by side ([e20c08a](https://github.com/embark-framework/embark/commit/e20c08a))


### Features

* **@embark/core:** Auto generate EmbarkJS events ([d378ccf](https://github.com/embark-framework/embark/commit/d378ccf))
* **test/reporter:** log tx functions during tests ([87d92b6](https://github.com/embark-framework/embark/commit/87d92b6))
* add repository.directory field to package.json ([a9c5e1a](https://github.com/embark-framework/embark/commit/a9c5e1a))
* normalize README and package.json bugs, homepage, description ([5418f16](https://github.com/embark-framework/embark/commit/5418f16))
