# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.0.0-alpha.8](https://github.com/embark-framework/embark/compare/v5.0.0-alpha.7...v5.0.0-alpha.8) (2019-12-19)

**Note:** Version bump only for package embark-accounts-manager





# [5.0.0-alpha.5](https://github.com/embark-framework/embark/compare/v5.0.0-alpha.4...v5.0.0-alpha.5) (2019-12-16)

**Note:** Version bump only for package embark-accounts-manager





# [5.0.0-alpha.4](https://github.com/embark-framework/embark/compare/v5.0.0-alpha.3...v5.0.0-alpha.4) (2019-12-12)

**Note:** Version bump only for package embark-accounts-manager





# [5.0.0-alpha.3](https://github.com/embark-framework/embark/compare/v5.0.0-alpha.2...v5.0.0-alpha.3) (2019-12-06)

**Note:** Version bump only for package embark-accounts-manager





# [5.0.0-alpha.2](https://github.com/embark-framework/embark/compare/v5.0.0-alpha.1...v5.0.0-alpha.2) (2019-12-05)


### Bug Fixes

* **@embark/accounts-manager:** limit funding accounts to 1 at a time ([95b5ae4](https://github.com/embark-framework/embark/commit/95b5ae4))


### Features

* **@embark/embark-rpc-manager:** Add support for `eth_signTypedData_v3` ([c7ec49a](https://github.com/embark-framework/embark/commit/c7ec49a)), closes [#1850](https://github.com/embark-framework/embark/issues/1850) [#1850](https://github.com/embark-framework/embark/issues/1850)





# [5.0.0-alpha.1](https://github.com/embark-framework/embark/compare/v5.0.0-alpha.0...v5.0.0-alpha.1) (2019-11-05)

**Note:** Version bump only for package embark-accounts-manager





# [5.0.0-alpha.0](https://github.com/embark-framework/embark/compare/v4.1.1...v5.0.0-alpha.0) (2019-10-28)


### Bug Fixes

* **test-app:** make test app test all pass ([#1980](https://github.com/embark-framework/embark/issues/1980)) ([2193d82](https://github.com/embark-framework/embark/commit/2193d82))


### Build System

* bump all packages' engines settings ([#1985](https://github.com/embark-framework/embark/issues/1985)) ([ed02cc8](https://github.com/embark-framework/embark/commit/ed02cc8))


### Features

* **@embark/test-runner:** make vm default node ([#1846](https://github.com/embark-framework/embark/issues/1846)) ([f54fbf0](https://github.com/embark-framework/embark/commit/f54fbf0))


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
