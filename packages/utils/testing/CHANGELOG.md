# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.1.0-nightly.5](https://github.com/embarklabs/embark/compare/v5.1.0-nightly.4...v5.1.0-nightly.5) (2020-01-24)


### Features

* **@embark/testing:** add missing APIs to register console commands and API calls ([bef582d](https://github.com/embarklabs/embark/commit/bef582d))





# [5.1.0-nightly.1](https://github.com/embarklabs/embark/compare/v5.1.0-nightly.0...v5.1.0-nightly.1) (2020-01-20)


### Features

* support Node.js v12.x and newer ([c093cf8](https://github.com/embarklabs/embark/commit/c093cf8))





# [5.1.0-nightly.0](https://github.com/embarklabs/embark/compare/v5.0.0...v5.1.0-nightly.0) (2020-01-17)


### Features

* **@embark/testing:** introduce proper request2 api for async/await ([c947517](https://github.com/embarklabs/embark/commit/c947517))





# [5.0.0](https://github.com/embarklabs/embark/compare/v5.0.0-beta.0...v5.0.0) (2020-01-07)

**Note:** Version bump only for package embark-testing





# [5.0.0-alpha.5](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.4...v5.0.0-alpha.5) (2019-12-16)

**Note:** Version bump only for package embark-testing





# [5.0.0-alpha.4](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.3...v5.0.0-alpha.4) (2019-12-12)


### Bug Fixes

* **@embark/tests:** Tests exiting early ([acd1d72](https://github.com/embarklabs/embark/commit/acd1d72))





# [5.0.0-alpha.2](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.1...v5.0.0-alpha.2) (2019-12-05)

**Note:** Version bump only for package embark-testing





# [5.0.0-alpha.1](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.0...v5.0.0-alpha.1) (2019-11-05)

**Note:** Version bump only for package embark-testing





# [5.0.0-alpha.0](https://github.com/embarklabs/embark/compare/v4.1.1...v5.0.0-alpha.0) (2019-10-28)


### Build System

* bump all packages' engines settings ([#1985](https://github.com/embarklabs/embark/issues/1985)) ([ed02cc8](https://github.com/embarklabs/embark/commit/ed02cc8))


### Features

* **@embark/testing:** introduce plugin APIs to register compilers ([f289a6f](https://github.com/embarklabs/embark/commit/f289a6f))


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
