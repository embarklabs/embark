# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.1.0-nightly.4](https://github.com/embarklabs/embark/compare/v5.1.0-nightly.3...v5.1.0-nightly.4) (2020-01-23)

**Note:** Version bump only for package embark-core





# [5.1.0-nightly.1](https://github.com/embarklabs/embark/compare/v5.1.0-nightly.0...v5.1.0-nightly.1) (2020-01-20)


### Features

* support Node.js v12.x and newer ([c093cf8](https://github.com/embarklabs/embark/commit/c093cf8))





# [5.1.0-nightly.0](https://github.com/embarklabs/embark/compare/v5.0.0...v5.1.0-nightly.0) (2020-01-17)


### Features

* **@embark/nethermind:** add Nethermind blockchain client plugin ([6db8d87](https://github.com/embarklabs/embark/commit/6db8d87))





# [5.0.0](https://github.com/embarklabs/embark/compare/v5.0.0-beta.0...v5.0.0) (2020-01-07)

**Note:** Version bump only for package embark-core





# [5.0.0-alpha.9](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.8...v5.0.0-alpha.9) (2019-12-20)


### Build System

* **deps:** bump web3[-*] from 1.2.1 to 1.2.4 ([7e550f0](https://github.com/embarklabs/embark/commit/7e550f0))


### BREAKING CHANGES

* **deps:** bump embark's minimum supported version of parity from
`>=2.0.0` to `>=2.2.1`. This is necessary since web3 1.2.4 makes use of the
`eth_chainId` RPC method (EIP 695) and that parity version is the earliest one
to implement it.

[bug]: https://github.com/ethereum/web3.js/issues/3283





# [5.0.0-alpha.8](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.7...v5.0.0-alpha.8) (2019-12-19)

**Note:** Version bump only for package embark-core





# [5.0.0-alpha.5](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.4...v5.0.0-alpha.5) (2019-12-16)


### Bug Fixes

* fix node connection test to use the endpoints correctly ([0503bb2](https://github.com/embarklabs/embark/commit/0503bb2))





# [5.0.0-alpha.4](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.3...v5.0.0-alpha.4) (2019-12-12)


### Bug Fixes

* **@embark/test:** fix using --node option in tests ([b82a240](https://github.com/embarklabs/embark/commit/b82a240))


### Features

* **@embark/whisper:** Add Whisper client config ([bd4b110](https://github.com/embarklabs/embark/commit/bd4b110))





# [5.0.0-alpha.3](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.2...v5.0.0-alpha.3) (2019-12-06)


### Bug Fixes

* **@embark/core:** spec embark-rpc-manager as a dependency ([a5d0650](https://github.com/embarklabs/embark/commit/a5d0650))





# [5.0.0-alpha.2](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.1...v5.0.0-alpha.2) (2019-12-05)


### Bug Fixes

* **@embark/core:** don't exit in Engine consumer API ([a7edca0](https://github.com/embarklabs/embark/commit/a7edca0))
* **@embark/proxy:** Fix unsubsribe handling and add new provider ([f6f4507](https://github.com/embarklabs/embark/commit/f6f4507))


### Features

* **@embark/embark-rpc-manager:** Add support for `eth_signTypedData_v3` ([c7ec49a](https://github.com/embarklabs/embark/commit/c7ec49a)), closes [#1850](https://github.com/embarklabs/embark/issues/1850) [#1850](https://github.com/embarklabs/embark/issues/1850)





# [5.0.0-alpha.1](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.0...v5.0.0-alpha.1) (2019-11-05)

**Note:** Version bump only for package embark-core





# [5.0.0-alpha.0](https://github.com/embarklabs/embark/compare/v4.1.1...v5.0.0-alpha.0) (2019-10-28)


### Bug Fixes

* add back log command for modules ([#1969](https://github.com/embarklabs/embark/issues/1969)) ([918a00c](https://github.com/embarklabs/embark/commit/918a00c))


### Build System

* bump all packages' engines settings ([#1985](https://github.com/embarklabs/embark/issues/1985)) ([ed02cc8](https://github.com/embarklabs/embark/commit/ed02cc8))


### Features

* **@embark/test-runner:** make vm default node ([#1846](https://github.com/embarklabs/embark/issues/1846)) ([f54fbf0](https://github.com/embarklabs/embark/commit/f54fbf0))


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





## [4.1.1](https://github.com/embarklabs/embark/compare/v4.1.0...v4.1.1) (2019-08-28)

**Note:** Version bump only for package embark-core





# [4.1.0](https://github.com/embarklabs/embark/compare/v4.1.0-beta.6...v4.1.0) (2019-08-12)

**Note:** Version bump only for package embark-core





# [4.1.0-beta.6](https://github.com/embarklabs/embark/compare/v4.1.0-beta.5...v4.1.0-beta.6) (2019-08-09)

**Note:** Version bump only for package embark-core





# [4.1.0-beta.5](https://github.com/embarklabs/embark/compare/v4.1.0-beta.4...v4.1.0-beta.5) (2019-07-10)

**Note:** Version bump only for package embark-core





# [4.1.0-beta.4](https://github.com/embarklabs/embark/compare/v4.1.0-beta.3...v4.1.0-beta.4) (2019-06-27)

**Note:** Version bump only for package embark-core





# [4.1.0-beta.3](https://github.com/embarklabs/embark/compare/v4.1.0-beta.2...v4.1.0-beta.3) (2019-06-07)

**Note:** Version bump only for package embark-core





# [4.1.0-beta.2](https://github.com/embarklabs/embark/compare/v4.1.0-beta.1...v4.1.0-beta.2) (2019-05-22)

**Note:** Version bump only for package embark-core





# [4.1.0-beta.1](https://github.com/embarklabs/embark/compare/v4.1.0-beta.0...v4.1.0-beta.1) (2019-05-15)


### Bug Fixes

* **@embark/core:** move process.on inside ProcessWrapper's constructor ([fd09488](https://github.com/embarklabs/embark/commit/fd09488))


### Features

* **@embark/storage:** Add command `service ipfs on/off` ([1e4e6e4](https://github.com/embarklabs/embark/commit/1e4e6e4))
* **@embark/whisper:** Remove support for `service whisper on/off` ([fc01daf](https://github.com/embarklabs/embark/commit/fc01daf))
