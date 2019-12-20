# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.0.0-alpha.9](https://github.com/embark-framework/embark/compare/v5.0.0-alpha.8...v5.0.0-alpha.9) (2019-12-20)


### Bug Fixes

* **@embark/tests:** fix slow embark test because of the tx-logger ([1e9b8d8](https://github.com/embark-framework/embark/commit/1e9b8d8))


### Build System

* **deps:** bump web3[-*] from 1.2.1 to 1.2.4 ([7e550f0](https://github.com/embark-framework/embark/commit/7e550f0))


### BREAKING CHANGES

* **deps:** bump embark's minimum supported version of parity from
`>=2.0.0` to `>=2.2.1`. This is necessary since web3 1.2.4 makes use of the
`eth_chainId` RPC method (EIP 695) and that parity version is the earliest one
to implement it.

[bug]: https://github.com/ethereum/web3.js/issues/3283





# [5.0.0-alpha.8](https://github.com/embark-framework/embark/compare/v5.0.0-alpha.7...v5.0.0-alpha.8) (2019-12-19)

**Note:** Version bump only for package embark-transaction-logger





# [5.0.0-alpha.5](https://github.com/embark-framework/embark/compare/v5.0.0-alpha.4...v5.0.0-alpha.5) (2019-12-16)


### Bug Fixes

* **@embark/transaction-logger:** handle non-contract transactions ([1a7fc66](https://github.com/embark-framework/embark/commit/1a7fc66)), closes [/github.com/status-im/status-teller-network/blob/a5ab4d4b26afccf15ac7472a18728385dd8b2461/embarkConfig/data.js#L100-L110](https://github.com//github.com/status-im/status-teller-network/blob/a5ab4d4b26afccf15ac7472a18728385dd8b2461/embarkConfig/data.js/issues/L100-L110)





# [5.0.0-alpha.4](https://github.com/embark-framework/embark/compare/v5.0.0-alpha.3...v5.0.0-alpha.4) (2019-12-12)

**Note:** Version bump only for package embark-transaction-logger





# [5.0.0-alpha.3](https://github.com/embark-framework/embark/compare/v5.0.0-alpha.2...v5.0.0-alpha.3) (2019-12-06)

**Note:** Version bump only for package embark-transaction-logger





# [5.0.0-alpha.2](https://github.com/embark-framework/embark/compare/v5.0.0-alpha.1...v5.0.0-alpha.2) (2019-12-05)


### Bug Fixes

* **@embark/proxy:** Fix unsubsribe handling and add new provider ([f6f4507](https://github.com/embark-framework/embark/commit/f6f4507))





# [5.0.0-alpha.1](https://github.com/embark-framework/embark/compare/v5.0.0-alpha.0...v5.0.0-alpha.1) (2019-11-05)

**Note:** Version bump only for package embark-transaction-logger





# [5.0.0-alpha.0](https://github.com/embark-framework/embark/compare/v4.1.1...v5.0.0-alpha.0) (2019-10-28)


### Bug Fixes

* **@embark/transaction-logger:** don't show logs for stray receipts ([395ae83](https://github.com/embark-framework/embark/commit/395ae83))


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

**Note:** Version bump only for package embark-console-listener





# [4.1.0](https://github.com/embark-framework/embark/compare/v4.1.0-beta.6...v4.1.0) (2019-08-12)

**Note:** Version bump only for package embark-console-listener





# [4.1.0-beta.6](https://github.com/embark-framework/embark/compare/v4.1.0-beta.5...v4.1.0-beta.6) (2019-08-09)

**Note:** Version bump only for package embark-console-listener





# [4.1.0-beta.5](https://github.com/embark-framework/embark/compare/v4.1.0-beta.4...v4.1.0-beta.5) (2019-07-10)

**Note:** Version bump only for package embark-console-listener





# [4.1.0-beta.4](https://github.com/embark-framework/embark/compare/v4.1.0-beta.3...v4.1.0-beta.4) (2019-06-27)

**Note:** Version bump only for package embark-console-listener





# [4.1.0-beta.3](https://github.com/embark-framework/embark/compare/v4.1.0-beta.2...v4.1.0-beta.3) (2019-06-07)

**Note:** Version bump only for package embark-console-listener





# [4.1.0-beta.2](https://github.com/embark-framework/embark/compare/v4.1.0-beta.1...v4.1.0-beta.2) (2019-05-22)

**Note:** Version bump only for package embark-console-listener





# [4.1.0-beta.1](https://github.com/embark-framework/embark/compare/v4.1.0-beta.0...v4.1.0-beta.1) (2019-05-15)

**Note:** Version bump only for package embark-console-listener
