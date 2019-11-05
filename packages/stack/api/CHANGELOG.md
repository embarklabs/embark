# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.0.0-alpha.1](https://github.com/embark-framework/embark/compare/v5.0.0-alpha.0...v5.0.0-alpha.1) (2019-11-05)

**Note:** Version bump only for package embark-api





# [5.0.0-alpha.0](https://github.com/embark-framework/embark/compare/v4.1.1...v5.0.0-alpha.0) (2019-10-28)


### Build System

* bump all packages' engines settings ([#1985](https://github.com/embark-framework/embark/issues/1985)) ([ed02cc8](https://github.com/embark-framework/embark/commit/ed02cc8))


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





## [4.1.1](https://github.com/embark-framework/embark/compare/v4.1.0...v4.1.1) (2019-08-28)

**Note:** Version bump only for package embark-api





# [4.1.0](https://github.com/embark-framework/embark/compare/v4.1.0-beta.6...v4.1.0) (2019-08-12)

**Note:** Version bump only for package embark-api





# [4.1.0-beta.6](https://github.com/embark-framework/embark/compare/v4.1.0-beta.5...v4.1.0-beta.6) (2019-08-09)

**Note:** Version bump only for package embark-api





# [4.1.0-beta.5](https://github.com/embark-framework/embark/compare/v4.1.0-beta.4...v4.1.0-beta.5) (2019-07-10)

**Note:** Version bump only for package embark-api





# [4.1.0-beta.4](https://github.com/embark-framework/embark/compare/v4.1.0-beta.3...v4.1.0-beta.4) (2019-06-27)

**Note:** Version bump only for package embark-api





# [4.1.0-beta.3](https://github.com/embark-framework/embark/compare/v4.1.0-beta.2...v4.1.0-beta.3) (2019-06-07)

**Note:** Version bump only for package embark-api





# [4.1.0-beta.2](https://github.com/embark-framework/embark/compare/v4.1.0-beta.1...v4.1.0-beta.2) (2019-05-22)

**Note:** Version bump only for package embark-api





# [4.1.0-beta.1](https://github.com/embark-framework/embark/compare/v4.1.0-beta.0...v4.1.0-beta.1) (2019-05-15)


### Bug Fixes

* **@embark/api:** import colors pkg so type string has .stripColors ([fbfe376](https://github.com/embark-framework/embark/commit/fbfe376))
* **@embark/api:** setup the embark-ui build dir before the express instance ([c4d647c](https://github.com/embark-framework/embark/commit/c4d647c))
* **@embark/api:** specify colors package as a dependency ([ae8ec69](https://github.com/embark-framework/embark/commit/ae8ec69))


### Features

* **@embark/api:** Add command `service api on/off` ([634feb5](https://github.com/embark-framework/embark/commit/634feb5))
