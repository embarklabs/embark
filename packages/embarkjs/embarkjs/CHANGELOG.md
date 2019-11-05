# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.0.0-alpha.1](https://github.com/embark-framework/embark/compare/v5.0.0-alpha.0...v5.0.0-alpha.1) (2019-11-05)

**Note:** Version bump only for package embarkjs





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


### Bug Fixes

* **@mbark/embarkjs:** enable using wss in embarkjs and the Dapp ([d2fc210](https://github.com/embark-framework/embark/commit/d2fc210))





# [4.1.0](https://github.com/embark-framework/embark/compare/v4.1.0-beta.6...v4.1.0) (2019-08-12)

**Note:** Version bump only for package embarkjs





# [4.1.0-beta.6](https://github.com/embark-framework/embark/compare/v4.1.0-beta.5...v4.1.0-beta.6) (2019-08-09)

**Note:** Version bump only for package embarkjs





# [4.1.0-beta.5](https://github.com/embark-framework/embark/compare/v4.1.0-beta.4...v4.1.0-beta.5) (2019-07-10)


### Bug Fixes

* **@embark/embarkjs-whisper:** Messages.isAvailable() should always return a promise ([93ca3ad](https://github.com/embark-framework/embark/commit/93ca3ad))
* **@embark/storage:** revise timing for process:started and code eval to avoid race conditions ([5828ae6](https://github.com/embark-framework/embark/commit/5828ae6))





# [4.1.0-beta.3](https://github.com/embark-framework/embark/compare/v4.1.0-beta.2...v4.1.0-beta.3) (2019-06-07)

**Note:** Version bump only for package embarkjs





# [4.1.0-beta.2](https://github.com/embark-framework/embark/compare/v4.1.0-beta.1...v4.1.0-beta.2) (2019-05-22)

**Note:** Version bump only for package embarkjs





# [4.1.0-beta.1](https://github.com/embark-framework/embark/compare/v4.1.0-beta.0...v4.1.0-beta.1) (2019-05-15)


### Features

* **@embark/storage:** Add command `service swarm on/off` ([3dcc339](https://github.com/embark-framework/embark/commit/3dcc339))





# [4.1.0-beta.0](https://github.com/embark-framework/embark/compare/v4.0.0...v4.1.0-beta.0) (2019-04-17)


### Bug Fixes

* **@embark/storage:** Fix hang when IPFS/Swarm started externally ([eca456f](https://github.com/embark-framework/embark/commit/eca456f))


### Features

* **@embark/embarkjs:** add bytecode to contract ([4d4704a](https://github.com/embark-framework/embark/commit/4d4704a))
* **@embark/generator:** transpile embarkjs.js to be used by node ([ae88cc6](https://github.com/embark-framework/embark/commit/ae88cc6))





## [4.0.2](https://github.com/embark-framework/embark/compare/v4.0.1...v4.0.2) (2019-04-11)


### Bug Fixes

* **@embark/storage:** Fix hang when IPFS/Swarm started externally ([c5b11ae](https://github.com/embark-framework/embark/commit/c5b11ae))





# [4.0.0](https://github.com/embark-framework/embark/compare/v4.0.0-beta.2...v4.0.0) (2019-03-18)

**Note:** Version bump only for package embarkjs





# [4.0.0-beta.1](https://github.com/embark-framework/embark/compare/v4.0.0-beta.0...v4.0.0-beta.1) (2019-03-18)


### Bug Fixes

* **@embark/core:** Metamask + geth warning to enable regular txs ([c233dbc](https://github.com/embark-framework/embark/commit/c233dbc))
* **@embark/embarkjs:** Fix potential race condition ([876eee5](https://github.com/embark-framework/embark/commit/876eee5)), closes [/github.com/embark-framework/embark/pull/1319#discussion_r256850820](https://github.com//github.com/embark-framework/embark/pull/1319/issues/discussion_r256850820)
* **@embark/storage:** Fix storage not connecting error ([0d72ebe](https://github.com/embark-framework/embark/commit/0d72ebe))
* **embarkjs/blockchain:** only call doFirst once on connect ([a0d336e](https://github.com/embark-framework/embark/commit/a0d336e))


### Features

* **embarkjs/blockchain:** remove dependency on web3instance.js ([bd9fc66](https://github.com/embark-framework/embark/commit/bd9fc66))
* **web3connector:** add web3 connector plugin to connect to web3 ([976f994](https://github.com/embark-framework/embark/commit/976f994))
* add repository.directory field to package.json ([a9c5e1a](https://github.com/embark-framework/embark/commit/a9c5e1a))
* enable embark to be run with an external pipeline ([ebcc3c4](https://github.com/embark-framework/embark/commit/ebcc3c4))
* normalize README and package.json bugs, homepage, description ([5418f16](https://github.com/embark-framework/embark/commit/5418f16))
