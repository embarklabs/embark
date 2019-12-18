# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.2.0](https://github.com/embark-framework/embark/compare/v4.1.1...v4.2.0) (2019-12-18)


### Build System

* **deps:** bump web3[-*] from 1.2.1 to 1.2.4 ([e7ed552](https://github.com/embark-framework/embark/commit/e7ed552))


### BREAKING CHANGES

* **deps:** bump embark's minimum supported version of geth from
`>=1.8.14` to `>=1.9.0` and its minimum supported version of parity from
`>=2.0.0` to `>=2.2.1`. This is necessary since web3 1.2.4 makes use of the
`eth_chainId` RPC method (EIP 695) and those client versions are the earliest
ones to implement it.





## [4.1.1](https://github.com/embark-framework/embark/compare/v4.1.0...v4.1.1) (2019-08-28)


### Bug Fixes

* **@embark/demo:** add back lights ([dd07f67](https://github.com/embark-framework/embark/commit/dd07f67))





# [4.1.0](https://github.com/embark-framework/embark/compare/v4.1.0-beta.6...v4.1.0) (2019-08-12)

**Note:** Version bump only for package embark-dapp-template-demo





# [4.1.0-beta.6](https://github.com/embark-framework/embark/compare/v4.1.0-beta.5...v4.1.0-beta.6) (2019-08-09)


### Features

* **@embark/pipeline:** add minimalContractSize to remove bytecode ([b0cccae](https://github.com/embark-framework/embark/commit/b0cccae))
* **@embark/pipeline:** enable choosing which fields to filter out ([b5c81bd](https://github.com/embark-framework/embark/commit/b5c81bd))





# [4.1.0-beta.5](https://github.com/embark-framework/embark/compare/v4.1.0-beta.4...v4.1.0-beta.5) (2019-07-10)


### Bug Fixes

* **@embark/embarkjs-whisper:** Messages.isAvailable() should always return a promise ([93ca3ad](https://github.com/embark-framework/embark/commit/93ca3ad))





# [4.1.0-beta.4](https://github.com/embark-framework/embark/compare/v4.1.0-beta.3...v4.1.0-beta.4) (2019-06-27)


### Bug Fixes

* **@dapps/demo:** don't allow subscription to whisper channels with less than 4 chars ([322397f](https://github.com/embark-framework/embark/commit/322397f)), closes [#1666](https://github.com/embark-framework/embark/issues/1666)
* **@dapps/templates/demo:** ensure whisper channel state is set correctly ([1b6987e](https://github.com/embark-framework/embark/commit/1b6987e))





# [4.1.0-beta.3](https://github.com/embark-framework/embark/compare/v4.1.0-beta.2...v4.1.0-beta.3) (2019-06-07)

**Note:** Version bump only for package embark-dapp-template-demo





# [4.1.0-beta.2](https://github.com/embark-framework/embark/compare/v4.1.0-beta.1...v4.1.0-beta.2) (2019-05-22)

**Note:** Version bump only for package embark-dapp-template-demo





# [4.1.0-beta.1](https://github.com/embark-framework/embark/compare/v4.1.0-beta.0...v4.1.0-beta.1) (2019-05-15)


### Bug Fixes

* **@embark/demo:** link css from dependency ([438e917](https://github.com/embark-framework/embark/commit/438e917))
* **@embark/demo:** render whisper error messages not error objects ([925ed06](https://github.com/embark-framework/embark/commit/925ed06))





# [4.1.0-beta.0](https://github.com/embark-framework/embark/compare/v4.0.0...v4.1.0-beta.0) (2019-04-17)

**Note:** Version bump only for package embark-dapp-template-demo





## [4.0.2](https://github.com/embark-framework/embark/compare/v4.0.1...v4.0.2) (2019-04-11)

**Note:** Version bump only for package embark-dapp-template-demo





## [4.0.1](https://github.com/embark-framework/embark/compare/v4.0.0...v4.0.1) (2019-03-26)

**Note:** Version bump only for package embark-dapp-template-demo





# [4.0.0](https://github.com/embark-framework/embark/compare/v4.0.0-beta.2...v4.0.0) (2019-03-18)

**Note:** Version bump only for package embark-dapp-template-demo





# [4.0.0-beta.2](https://github.com/embark-framework/embark/compare/v4.0.0-beta.1...v4.0.0-beta.2) (2019-03-18)

**Note:** Version bump only for package embark-dapp-template-demo





# [4.0.0-beta.1](https://github.com/embark-framework/embark/compare/v4.0.0-beta.0...v4.0.0-beta.1) (2019-03-18)


### Features

* add repository.directory field to package.json ([a9c5e1a](https://github.com/embark-framework/embark/commit/a9c5e1a))
* **@embark/pipeline:** Add `enabled` property to pipeline config ([5ea4807](https://github.com/embark-framework/embark/commit/5ea4807))
* normalize README and package.json bugs, homepage, description ([5418f16](https://github.com/embark-framework/embark/commit/5418f16))
