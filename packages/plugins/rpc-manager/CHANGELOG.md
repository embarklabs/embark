# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.0.0](https://github.com/embark-framework/embark/compare/v5.0.0-beta.0...v5.0.0) (2020-01-07)

**Note:** Version bump only for package embark-rpc-manager





# [5.0.0-alpha.9](https://github.com/embark-framework/embark/compare/v5.0.0-alpha.8...v5.0.0-alpha.9) (2019-12-20)


### Build System

* **deps:** bump web3[-*] from 1.2.1 to 1.2.4 ([7e550f0](https://github.com/embark-framework/embark/commit/7e550f0))


### BREAKING CHANGES

* **deps:** bump embark's minimum supported version of parity from
`>=2.0.0` to `>=2.2.1`. This is necessary since web3 1.2.4 makes use of the
`eth_chainId` RPC method (EIP 695) and that parity version is the earliest one
to implement it.

[bug]: https://github.com/ethereum/web3.js/issues/3283





# [5.0.0-alpha.8](https://github.com/embark-framework/embark/compare/v5.0.0-alpha.7...v5.0.0-alpha.8) (2019-12-19)


### Bug Fixes

* **@embark/rpc-manager:** fix duplicated accounts in rpc manager ([03bd49c](https://github.com/embark-framework/embark/commit/03bd49c))





# [5.0.0-alpha.7](https://github.com/embark-framework/embark/compare/v5.0.0-alpha.6...v5.0.0-alpha.7) (2019-12-18)


### Bug Fixes

* **@embark/rpc-manager:** fix sign data address comparison ([1bc967c](https://github.com/embark-framework/embark/commit/1bc967c))





# [5.0.0-alpha.5](https://github.com/embark-framework/embark/compare/v5.0.0-alpha.4...v5.0.0-alpha.5) (2019-12-16)


### Bug Fixes

* **@embarkrpc-manager:** fix infinite loop in eth_accounts modifier ([7e70761](https://github.com/embark-framework/embark/commit/7e70761))





# [5.0.0-alpha.4](https://github.com/embark-framework/embark/compare/v5.0.0-alpha.3...v5.0.0-alpha.4) (2019-12-12)

**Note:** Version bump only for package embark-rpc-manager





# [5.0.0-alpha.3](https://github.com/embark-framework/embark/compare/v5.0.0-alpha.2...v5.0.0-alpha.3) (2019-12-06)

**Note:** Version bump only for package embark-rpc-manager





# [5.0.0-alpha.2](https://github.com/embark-framework/embark/compare/v5.0.0-alpha.1...v5.0.0-alpha.2) (2019-12-05)


### Bug Fixes

* **@embark/proxy:** Fix unsubsribe handling and add new provider ([f6f4507](https://github.com/embark-framework/embark/commit/f6f4507))
* **@embark/rpc-manager:** implement missing RPC modifier for eth_sign ([4ebbb44](https://github.com/embark-framework/embark/commit/4ebbb44))


### Features

* **@embark/embark-rpc-manager:** Add support for `eth_signTypedData_v3` ([c7ec49a](https://github.com/embark-framework/embark/commit/c7ec49a)), closes [#1850](https://github.com/embark-framework/embark/issues/1850) [#1850](https://github.com/embark-framework/embark/issues/1850)
