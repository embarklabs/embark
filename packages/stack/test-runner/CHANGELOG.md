# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.0.0-alpha.4](https://github.com/embark-framework/embark/compare/v5.0.0-alpha.3...v5.0.0-alpha.4) (2019-12-12)


### Bug Fixes

* **@embark/test:** fix using --node option in tests ([b82a240](https://github.com/embark-framework/embark/commit/b82a240))





# [5.0.0-alpha.2](https://github.com/embark-framework/embark/compare/v5.0.0-alpha.1...v5.0.0-alpha.2) (2019-12-05)


### Bug Fixes

* **@embark/proxy:** Fix unsubsribe handling and add new provider ([f6f4507](https://github.com/embark-framework/embark/commit/f6f4507))
* **@embark/tests:** Improve expiration unit test ([23e94d6](https://github.com/embark-framework/embark/commit/23e94d6))


### Features

* **@embark/embark-rpc-manager:** Add support for `eth_signTypedData_v3` ([c7ec49a](https://github.com/embark-framework/embark/commit/c7ec49a)), closes [#1850](https://github.com/embark-framework/embark/issues/1850) [#1850](https://github.com/embark-framework/embark/issues/1850)
* **@embark/ens:** enable changing namesystem config per test ([de9e667](https://github.com/embark-framework/embark/commit/de9e667))
* **@embark/tests:** enable comms and storage in tests ([aecb99d](https://github.com/embark-framework/embark/commit/aecb99d))





# [5.0.0-alpha.1](https://github.com/embark-framework/embark/compare/v5.0.0-alpha.0...v5.0.0-alpha.1) (2019-11-05)

**Note:** Version bump only for package embark-test-runner





# [5.0.0-alpha.0](https://github.com/embark-framework/embark/compare/v4.1.1...v5.0.0-alpha.0) (2019-10-28)


### Bug Fixes

* **@contract-app:** fix contracts app tests ([#1982](https://github.com/embark-framework/embark/issues/1982)) ([6e9635c](https://github.com/embark-framework/embark/commit/6e9635c))
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





## [4.1.1](https://github.com/embark-framework/embark/compare/v4.1.0...v4.1.1) (2019-08-28)

**Note:** Version bump only for package embark-test-runner





# [4.1.0](https://github.com/embark-framework/embark/compare/v4.1.0-beta.6...v4.1.0) (2019-08-12)

**Note:** Version bump only for package embark-test-runner





# [4.1.0-beta.6](https://github.com/embark-framework/embark/compare/v4.1.0-beta.5...v4.1.0-beta.6) (2019-08-09)


### Bug Fixes

* **@embark/test-runner:** fix describe in describe tests ([c2094db](https://github.com/embark-framework/embark/commit/c2094db))





# [4.1.0-beta.5](https://github.com/embark-framework/embark/compare/v4.1.0-beta.4...v4.1.0-beta.5) (2019-07-10)


### Bug Fixes

* **@embark/test-runner:** make `--tx-details` option work again ([2531fc1](https://github.com/embark-framework/embark/commit/2531fc1)), closes [/github.com/embark-framework/embark/commit/87d92b6091#diff-92b4f79a0473160fe700440b1ced5204R140](https://github.com//github.com/embark-framework/embark/commit/87d92b6091/issues/diff-92b4f79a0473160fe700440b1ced5204R140)





# [4.1.0-beta.4](https://github.com/embark-framework/embark/compare/v4.1.0-beta.3...v4.1.0-beta.4) (2019-06-27)


### Bug Fixes

* **@embark/test-runenr:** fix event listener overflow ([e288483](https://github.com/embark-framework/embark/commit/e288483))
* **@embark/test-runner:** only run tests on files with describe ([9646673](https://github.com/embark-framework/embark/commit/9646673))
* **templates:** fix templates because tests don't like empty files ([908aa3b](https://github.com/embark-framework/embark/commit/908aa3b))
* alleviate races re: embarkjs by introducing Plugin#addGeneratedCode and related refactors ([fc4faa8](https://github.com/embark-framework/embark/commit/fc4faa8))


### Features

* **@embark/test-runner:** return accounts in the describe callback ([332229f](https://github.com/embark-framework/embark/commit/332229f))
* **@embark/test-runner:** wait for deploy before enterning describe ([8c16541](https://github.com/embark-framework/embark/commit/8c16541))





# [4.1.0-beta.3](https://github.com/embark-framework/embark/compare/v4.1.0-beta.2...v4.1.0-beta.3) (2019-06-07)


### Bug Fixes

* **@embark/test-runner:** don't try to deploy and register ENS domains after JS tests have run ([e5fc12e](https://github.com/embark-framework/embark/commit/e5fc12e))





# [4.1.0-beta.2](https://github.com/embark-framework/embark/compare/v4.1.0-beta.1...v4.1.0-beta.2) (2019-05-22)

**Note:** Version bump only for package embark-test-runner





# [4.1.0-beta.1](https://github.com/embark-framework/embark/compare/v4.1.0-beta.0...v4.1.0-beta.1) (2019-05-15)


### Features

* **@embark/test-runner:** show interface contract message in tests ([f9d7a3f](https://github.com/embark-framework/embark/commit/f9d7a3f))
