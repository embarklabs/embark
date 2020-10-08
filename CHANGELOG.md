# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [6.0.1-nightly.1](https://github.com/embarklabs/embark/compare/v6.0.1-nightly.0...v6.0.1-nightly.1) (2020-10-08)


### Bug Fixes

* **@embark/dapps:** use utf-8 in html script tag ([cfa43bc](https://github.com/embarklabs/embark/commit/cfa43bc))





## [6.0.1-nightly.0](https://github.com/embarklabs/embark/compare/v6.0.0...v6.0.1-nightly.0) (2020-08-08)


### Bug Fixes

* **@embark/geth:** add --allow-insecure-unlock ([7702b92](https://github.com/embarklabs/embark/commit/7702b92))





# [6.0.0](https://github.com/embarklabs/embark/compare/v5.3.1-nightly.0...v6.0.0) (2020-04-27)

**Note:** Version bump only for package root





## [5.3.1-nightly.0](https://github.com/embarklabs/embark/compare/v5.3.0...v5.3.1-nightly.0) (2020-04-25)

**Note:** Version bump only for package root





# [5.3.0](https://github.com/embarklabs/embark/compare/v5.3.0-nightly.18...v5.3.0) (2020-04-24)

**Note:** Version bump only for package root





# [5.3.0-nightly.18](https://github.com/embarklabs/embark/compare/v5.3.0-nightly.17...v5.3.0-nightly.18) (2020-04-14)

**Note:** Version bump only for package root





# [5.3.0-nightly.17](https://github.com/embarklabs/embark/compare/v5.3.0-nightly.16...v5.3.0-nightly.17) (2020-04-11)


### Bug Fixes

* **@embark/mocha:** reset contracts before each test file ([deb682c](https://github.com/embarklabs/embark/commit/deb682c))
* **@embark/storage:** Allow upload when storage is disabled ([ec99cf6](https://github.com/embarklabs/embark/commit/ec99cf6))
* **core/utils:** shortcut `embarkConfig.plugins` in case it doesn't exist ([d83ad01](https://github.com/embarklabs/embark/commit/d83ad01))





# [5.3.0-nightly.16](https://github.com/embarklabs/embark/compare/v5.3.0-nightly.15...v5.3.0-nightly.16) (2020-04-03)


### Bug Fixes

* **cockpit/console:** ensure console for processes is rendered ([3ce666b](https://github.com/embarklabs/embark/commit/3ce666b))
* **plugins/solc:** don't read pluginConfig from plugin.config ([de8f217](https://github.com/embarklabs/embark/commit/de8f217)), closes [/github.com/embarklabs/embark/pull/2330#discussion_r389906144](https://github.com//github.com/embarklabs/embark/pull/2330/issues/discussion_r389906144)





# [5.3.0-nightly.15](https://github.com/embarklabs/embark/compare/v5.3.0-nightly.14...v5.3.0-nightly.15) (2020-03-26)

**Note:** Version bump only for package root





# [5.3.0-nightly.14](https://github.com/embarklabs/embark/compare/v5.3.0-nightly.13...v5.3.0-nightly.14) (2020-03-25)


### Bug Fixes

* **stack/proxy:** ensure wsProxy and httpProxy have correct type ([d9c8109](https://github.com/embarklabs/embark/commit/d9c8109))
* **stack/proxy:** have proxy.stop() receive callback ([ec134b9](https://github.com/embarklabs/embark/commit/ec134b9))


### Features

* **utils/testing:** introduce async/await for actions in tests ([0e32cc0](https://github.com/embarklabs/embark/commit/0e32cc0))





# [5.3.0-nightly.13](https://github.com/embarklabs/embark/compare/v5.3.0-nightly.12...v5.3.0-nightly.13) (2020-03-24)


### Bug Fixes

* **@embark-ganache:** fix ganache having different node accounts ([897aa3f](https://github.com/embarklabs/embark/commit/897aa3f))
* **@embark/blockchain:** fix blockchain plugins' use of async whilst ([fde1eeb](https://github.com/embarklabs/embark/commit/fde1eeb))
* **@embark/cmd_controller:** don't try to load pipeline module group in build cmd ([0c9b917](https://github.com/embarklabs/embark/commit/0c9b917))
* **@embark/storage:** Fix hang when changing environments ([edf4347](https://github.com/embarklabs/embark/commit/edf4347))
* **plugins/basic-pipeline:** ensure correct webpack config is loaded ([031ebe8](https://github.com/embarklabs/embark/commit/031ebe8))


### Features

* **@embark/accounts-manager:** Get alternative coinbase address ([72e609a](https://github.com/embarklabs/embark/commit/72e609a))
* **@embark/core:** Support minimum truffle projects ([a454ae8](https://github.com/embarklabs/embark/commit/a454ae8))
* **@embark/dapps:** Add blockchain config to simple template ([5fe318b](https://github.com/embarklabs/embark/commit/5fe318b))
* **@embark/quorum:** Add support for Quorum blockchains ([095bd0b](https://github.com/embarklabs/embark/commit/095bd0b))





# [5.3.0-nightly.12](https://github.com/embarklabs/embark/compare/v5.3.0-nightly.11...v5.3.0-nightly.12) (2020-03-21)

**Note:** Version bump only for package root





# [5.3.0-nightly.11](https://github.com/embarklabs/embark/compare/v5.3.0-nightly.10...v5.3.0-nightly.11) (2020-03-20)


### Features

* **@embark/snarks:** Allow embark-snark to be used in the dapp ([c1129dc](https://github.com/embarklabs/embark/commit/c1129dc))





# [5.3.0-nightly.10](https://github.com/embarklabs/embark/compare/v5.3.0-nightly.9...v5.3.0-nightly.10) (2020-03-14)

**Note:** Version bump only for package root





# [5.3.0-nightly.9](https://github.com/embarklabs/embark/compare/v5.3.0-nightly.8...v5.3.0-nightly.9) (2020-03-13)


### Bug Fixes

* don't open external links to another tab by default ([b8c0908](https://github.com/embarklabs/embark/commit/b8c0908))


### Features

* support selecting what library to generate artifacts ([ee1eb4e](https://github.com/embarklabs/embark/commit/ee1eb4e)), closes [#2285](https://github.com/embarklabs/embark/issues/2285)





# [5.3.0-nightly.8](https://github.com/embarklabs/embark/compare/v5.3.0-nightly.7...v5.3.0-nightly.8) (2020-03-11)


### Bug Fixes

* **@embark/ganache:** make embark blockchain exit when using Ganache ([53dc751](https://github.com/embarklabs/embark/commit/53dc751))


### Features

* **stack/blockchain:** expose networkId in generated artifact ([c624582](https://github.com/embarklabs/embark/commit/c624582)), closes [#2220](https://github.com/embarklabs/embark/issues/2220)





# [5.3.0-nightly.7](https://github.com/embarklabs/embark/compare/v5.3.0-nightly.6...v5.3.0-nightly.7) (2020-03-10)

**Note:** Version bump only for package root





# [5.3.0-nightly.6](https://github.com/embarklabs/embark/compare/v5.3.0-nightly.5...v5.3.0-nightly.6) (2020-03-07)


### Bug Fixes

* **@cockpit/utilities:** `signaturePending` prop should be type bool in component SignAndVerify ([ac7bdb1](https://github.com/embarklabs/embark/commit/ac7bdb1))


### Features

* add support for `embark.config.js` ([e0f7913](https://github.com/embarklabs/embark/commit/e0f7913))





# [5.3.0-nightly.5](https://github.com/embarklabs/embark/compare/v5.3.0-nightly.4...v5.3.0-nightly.5) (2020-03-06)


### Bug Fixes

* **@embark/cmd-controller:** add back embark-ganache registrations ([6fb2da3](https://github.com/embarklabs/embark/commit/6fb2da3))
* **@embark/rpc-manager:** fix eth_signTypedData method + tests ([b29998e](https://github.com/embarklabs/embark/commit/b29998e))


### Features

* **@embark/test-runner:** make evmMethod globally available + docs ([67581ce](https://github.com/embarklabs/embark/commit/67581ce))





# [5.3.0-nightly.4](https://github.com/embarklabs/embark/compare/v5.3.0-nightly.3...v5.3.0-nightly.4) (2020-03-05)

**Note:** Version bump only for package root





# [5.3.0-nightly.3](https://github.com/embarklabs/embark/compare/v5.3.0-nightly.2...v5.3.0-nightly.3) (2020-03-04)


### Features

* **plugins/specialconfigs:** adds support for Smart Contract args as functions ([a4a0e9d](https://github.com/embarklabs/embark/commit/a4a0e9d)), closes [#2270](https://github.com/embarklabs/embark/issues/2270)





# [5.3.0-nightly.2](https://github.com/embarklabs/embark/compare/v5.3.0-nightly.1...v5.3.0-nightly.2) (2020-03-03)

**Note:** Version bump only for package root





# [5.3.0-nightly.1](https://github.com/embarklabs/embark/compare/v5.3.0-nightly.0...v5.3.0-nightly.1) (2020-02-29)


### Features

* remove optional plugins from coming as default ([db10064](https://github.com/embarklabs/embark/commit/db10064))
* **@cmd:** add very basic embark init to add an embark.json file ([738ff8e](https://github.com/embarklabs/embark/commit/738ff8e))
* **@embark/cmd:** enable using engine with no embark.json ([382a0b5](https://github.com/embarklabs/embark/commit/382a0b5))





# [5.3.0-nightly.0](https://github.com/embarklabs/embark/compare/v5.2.4-nightly.0...v5.3.0-nightly.0) (2020-02-27)


### Bug Fixes

* **@embark/mocha-tests:** change `self` to `this` in mocha-tests ([c07ac55](https://github.com/embarklabs/embark/commit/c07ac55))
* **@embark/profiler:** Fix profile output and update messaging ([74e2935](https://github.com/embarklabs/embark/commit/74e2935))
* **@embark/reporter:** show stack trace in the reporter on errors ([e389ccc](https://github.com/embarklabs/embark/commit/e389ccc))
* **utils/testing:** add missing trace() API logger in testbed ([0ba8d86](https://github.com/embarklabs/embark/commit/0ba8d86))
* **utils/testing:** ensure API mock works with `req.params` and method chaining ([1a56d5f](https://github.com/embarklabs/embark/commit/1a56d5f))
* **utils/testing:** ensure runActionsForEvent() works without params object ([62a2291](https://github.com/embarklabs/embark/commit/62a2291))


### Features

* **@embark/test-app:** add Teller contracts and test as a new test dapp ([e65c4d2](https://github.com/embarklabs/embark/commit/e65c4d2))
* **utils/testing:** make mock apiCall() async ([4106a49](https://github.com/embarklabs/embark/commit/4106a49))





## [5.2.4-nightly.0](https://github.com/embarklabs/embark/compare/v5.2.3...v5.2.4-nightly.0) (2020-02-26)

**Note:** Version bump only for package root





## [5.2.3](https://github.com/embarklabs/embark/compare/v5.2.3-nightly.1...v5.2.3) (2020-02-25)


### Bug Fixes

* ensure that packages properly specify their dependencies ([3693ebd](https://github.com/embarklabs/embark/commit/3693ebd))





## [5.2.3-nightly.1](https://github.com/embarklabs/embark/compare/v5.2.3-nightly.0...v5.2.3-nightly.1) (2020-02-25)


### Bug Fixes

* **cmd-controller:** fix build --contracts command starting comm node ([e99a328](https://github.com/embarklabs/embark/commit/e99a328))





## [5.2.3-nightly.0](https://github.com/embarklabs/embark/compare/v5.2.2...v5.2.3-nightly.0) (2020-02-20)


### Bug Fixes

* **@embar/site:** fix proxyFor docs ([0461fa0](https://github.com/embarklabs/embark/commit/0461fa0))
* revert custom `deploy()` API for `EmbarkJS.Contract` ([d3200e3](https://github.com/embarklabs/embark/commit/d3200e3))





## [5.2.2](https://github.com/embarklabs/embark/compare/v5.2.1...v5.2.2) (2020-02-19)


### Bug Fixes

* **@embark/core:** fix templates not including embark as a dependency ([45e90f3](https://github.com/embarklabs/embark/commit/45e90f3))





## [5.2.1](https://github.com/embarklabs/embark/compare/v5.2.0...v5.2.1) (2020-02-18)


### Bug Fixes

* **@embark/ganache:** fix status when ganache is not the client ([37fbc80](https://github.com/embarklabs/embark/commit/37fbc80))





# [5.2.0](https://github.com/embarklabs/embark/compare/v5.2.0-nightly.5...v5.2.0) (2020-02-18)


### Bug Fixes

* **@embark/proxy:** only up event listeners on available providers ([caae922](https://github.com/embarklabs/embark/commit/caae922))





# [5.2.0-nightly.5](https://github.com/embarklabs/embark/compare/v5.2.0-nightly.4...v5.2.0-nightly.5) (2020-02-18)


### Bug Fixes

* **@embark/ganache:** fix connection to other nodes from Ganache ([5531b60](https://github.com/embarklabs/embark/commit/5531b60))
* **@embark/proxy:** up max listener for proxy request manager ([9c8837d](https://github.com/embarklabs/embark/commit/9c8837d))





# [5.2.0-nightly.4](https://github.com/embarklabs/embark/compare/v5.2.0-nightly.3...v5.2.0-nightly.4) (2020-02-15)


### Features

* **@embark/blockchain:** make GanacheCLI the default dev blockchain ([cd934f8](https://github.com/embarklabs/embark/commit/cd934f8))
* **@embark/contracts:** add proxyFor property for contracts ([2e8b255](https://github.com/embarklabs/embark/commit/2e8b255))





# [5.2.0-nightly.3](https://github.com/embarklabs/embark/compare/v5.2.0-nightly.2...v5.2.0-nightly.3) (2020-02-14)


### Bug Fixes

* **@embark/deployment:** fix undefined in nb arguments in deploy ([0016581](https://github.com/embarklabs/embark/commit/0016581))
* **@embark/logger:** Remove `writeToFile` for logger `dir` ([e9be40c](https://github.com/embarklabs/embark/commit/e9be40c))
* **stack/contracts-manager:** ensure custom `abiDefinition` is set properly if provided ([b4b4848](https://github.com/embarklabs/embark/commit/b4b4848))


### Features

* warn about packages not configured as plugins; make geth/parity full plugins ([d14e93c](https://github.com/embarklabs/embark/commit/d14e93c))





# [5.2.0-nightly.2](https://github.com/embarklabs/embark/compare/v5.2.0-nightly.1...v5.2.0-nightly.2) (2020-02-13)


### Bug Fixes

* set helper methods on contracts ([7031335](https://github.com/embarklabs/embark/commit/7031335))
* **core/config:** Fix `EmbarkConfig` type ([0f59e0c](https://github.com/embarklabs/embark/commit/0f59e0c))


### Features

* **@embark/test-runner:** introduce artifacts.require API ([b021689](https://github.com/embarklabs/embark/commit/b021689))
* **plugins/scripts-runner:** introduce exec command to run scripts ([40c3d98](https://github.com/embarklabs/embark/commit/40c3d98))





# [5.2.0-nightly.1](https://github.com/embarklabs/embark/compare/v5.2.0-nightly.0...v5.2.0-nightly.1) (2020-02-08)


### Bug Fixes

* **@embark/blockchain-api:** add back contract event listen and log ([5592753](https://github.com/embarklabs/embark/commit/5592753))
* **@embark/contracts-manager:** always deploy contracts with deploy: true ([87a04cd](https://github.com/embarklabs/embark/commit/87a04cd))
* **@embark/test-runner:** fix reporter to only catch gas for txs ([0e30bf3](https://github.com/embarklabs/embark/commit/0e30bf3))





# [5.2.0-nightly.0](https://github.com/embarklabs/embark/compare/v5.1.2-nightly.1...v5.2.0-nightly.0) (2020-02-07)


### Bug Fixes

* **@embark/contracts-manager:** Remove `logger` from serialized contract ([d529420](https://github.com/embarklabs/embark/commit/d529420))
* **@embark/ens:** fix tests erroring on FIFS contract deploy ([78fc7b6](https://github.com/embarklabs/embark/commit/78fc7b6))


### Features

* **@mbark/ens:** enable the use of $accounts in registrations ([de01022](https://github.com/embarklabs/embark/commit/de01022))





## [5.1.2-nightly.1](https://github.com/embarklabs/embark/compare/v5.1.2-nightly.0...v5.1.2-nightly.1) (2020-02-06)

**Note:** Version bump only for package root





## [5.1.2-nightly.0](https://github.com/embarklabs/embark/compare/v5.1.1...v5.1.2-nightly.0) (2020-02-05)


### Bug Fixes

* only show account warning when Geth will actually start ([f502650](https://github.com/embarklabs/embark/commit/f502650))
* **@embark/cmd-controller:** exit build if afterDeploy is not array ([5359cc6](https://github.com/embarklabs/embark/commit/5359cc6))
* **@embark/dashboard:** update dashboard's `logEntry` to match core/logger's `logFunction` ([63831f6](https://github.com/embarklabs/embark/commit/63831f6)), closes [#2184](https://github.com/embarklabs/embark/issues/2184)





## [5.1.1](https://github.com/embarklabs/embark/compare/v5.1.1-nightly.4...v5.1.1) (2020-02-03)

**Note:** Version bump only for package root





## [5.1.1-nightly.4](https://github.com/embarklabs/embark/compare/v5.1.1-nightly.3...v5.1.1-nightly.4) (2020-02-03)

**Note:** Version bump only for package root





## [5.1.1-nightly.3](https://github.com/embarklabs/embark/compare/v5.1.1-nightly.2...v5.1.1-nightly.3) (2020-02-01)


### Bug Fixes

* **@embark/demo:** fix ethereum not available in browser in the demo ([39919f2](https://github.com/embarklabs/embark/commit/39919f2))





## [5.1.1-nightly.2](https://github.com/embarklabs/embark/compare/v5.1.1-nightly.1...v5.1.1-nightly.2) (2020-01-31)

**Note:** Version bump only for package root





## [5.1.1-nightly.1](https://github.com/embarklabs/embark/compare/v5.1.1-nightly.0...v5.1.1-nightly.1) (2020-01-30)


### Bug Fixes

* **@embark/contracts:** fix ENS contracts not being resolved as deps ([2f5c16b](https://github.com/embarklabs/embark/commit/2f5c16b))
* **@embark/ens:** fix registerSubDomain in tests and add test ([3ceac53](https://github.com/embarklabs/embark/commit/3ceac53))





## [5.1.1-nightly.0](https://github.com/embarklabs/embark/compare/v5.1.0...v5.1.1-nightly.0) (2020-01-29)

**Note:** Version bump only for package root





# [5.1.0](https://github.com/embarklabs/embark/compare/v5.1.0-nightly.6...v5.1.0) (2020-01-27)


### Bug Fixes

* **@embark/pipeline:** make generateAll async so it completes tasks ([0a4d13f](https://github.com/embarklabs/embark/commit/0a4d13f))





# [5.1.0-nightly.6](https://github.com/embarklabs/embark/compare/v5.1.0-nightly.5...v5.1.0-nightly.6) (2020-01-25)

**Note:** Version bump only for package root





# [5.1.0-nightly.5](https://github.com/embarklabs/embark/compare/v5.1.0-nightly.4...v5.1.0-nightly.5) (2020-01-24)


### Bug Fixes

* **@embark/embarkjs:** change enableEthereum to not rely on returned accounts array ([b8f93ea](https://github.com/embarklabs/embark/commit/b8f93ea))
* **@embark/test:** increase default gas limit to 8M so tests support bigger contracts ([b6856b2](https://github.com/embarklabs/embark/commit/b6856b2))


### Features

* **@embark/testing:** add missing APIs to register console commands and API calls ([bef582d](https://github.com/embarklabs/embark/commit/bef582d))





# [5.1.0-nightly.4](https://github.com/embarklabs/embark/compare/v5.1.0-nightly.3...v5.1.0-nightly.4) (2020-01-23)


### Bug Fixes

* **@embark/proxy:** Parse `rpcPort` from config as integer ([9f7c682](https://github.com/embarklabs/embark/commit/9f7c682))





# [5.1.0-nightly.3](https://github.com/embarklabs/embark/compare/v5.1.0-nightly.2...v5.1.0-nightly.3) (2020-01-22)

**Note:** Version bump only for package root





# [5.1.0-nightly.2](https://github.com/embarklabs/embark/compare/v5.1.0-nightly.1...v5.1.0-nightly.2) (2020-01-21)


### Bug Fixes

* **@embark/ens:** connect to web3 only with dappAutoEnable is true ([e0ac539](https://github.com/embarklabs/embark/commit/e0ac539))





# [5.1.0-nightly.1](https://github.com/embarklabs/embark/compare/v5.1.0-nightly.0...v5.1.0-nightly.1) (2020-01-20)


### Features

* support Node.js v12.x and newer ([c093cf8](https://github.com/embarklabs/embark/commit/c093cf8))





# [5.1.0-nightly.0](https://github.com/embarklabs/embark/compare/v5.0.0...v5.1.0-nightly.0) (2020-01-17)


### Bug Fixes

* **@embark/cmd_controller:** fix build command to escape on finish ([e2767c2](https://github.com/embarklabs/embark/commit/e2767c2))
* **@embark/debugger:** Prevent error if contract not tracked by Embark ([1e1172e](https://github.com/embarklabs/embark/commit/1e1172e))
* **@embark/ens:** fix Infura connection and testnet use of ENS ([42bd3b7](https://github.com/embarklabs/embark/commit/42bd3b7))
* **@embark/test-dapp:** fix test_dapp broken for ENS resolve ([f5849e0](https://github.com/embarklabs/embark/commit/f5849e0))
* **@embark/tests:** Fix failing test with `—node=embark` ([81af3af](https://github.com/embarklabs/embark/commit/81af3af))
* **@embark/transaction-logger:** Circular JSON log and unknown contract log level ([5843a8e](https://github.com/embarklabs/embark/commit/5843a8e))
* **@embark/utils:** fix deconstruct url to return port as an integer ([4190d5e](https://github.com/embarklabs/embark/commit/4190d5e))
* **transaction-logger:** fix circular dep issue with util.inspect ([6f239f4](https://github.com/embarklabs/embark/commit/6f239f4))


### Features

* **@embark/deployment:** introduce `interfaces` and `libraries` configuration ([73d0443](https://github.com/embarklabs/embark/commit/73d0443))
* **@embark/nethermind:** add Nethermind blockchain client plugin ([6db8d87](https://github.com/embarklabs/embark/commit/6db8d87))
* **@embark/test-runner:** expose evmClientVersion for conditional tests ([e37d3f7](https://github.com/embarklabs/embark/commit/e37d3f7))
* **@embark/testing:** introduce proper request2 api for async/await ([c947517](https://github.com/embarklabs/embark/commit/c947517))





# [5.0.0](https://github.com/embarklabs/embark/compare/v5.0.0-beta.0...v5.0.0) (2020-01-07)


### Bug Fixes

* **@embark/watcher:** endless loop when artifacts are put in src ([c8f86e5](https://github.com/embarklabs/embark/commit/c8f86e5))





# [5.0.0-beta.0](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.10...v5.0.0-beta.0) (2020-01-03)


### Bug Fixes

* **@embark/snark:** Allow dapp to have no contracts ([2295f94](https://github.com/embarklabs/embark/commit/2295f94))





# [5.0.0-alpha.10](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.9...v5.0.0-alpha.10) (2019-12-24)


### Bug Fixes

* **@embark/embarkjs:** Fix event name misspelling ([8f9f631](https://github.com/embarklabs/embark/commit/8f9f631))
* **@embark/ens:** Handle cases when no “register” in config ([349b269](https://github.com/embarklabs/embark/commit/349b269))





# [5.0.0-alpha.9](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.8...v5.0.0-alpha.9) (2019-12-20)


### Bug Fixes

* **@embark/cli:** find ejectable webpack files within embark-basic-pipeline ([09e2dbe](https://github.com/embarklabs/embark/commit/09e2dbe))
* **@embark/coverage:** ensure handlers for 'tests:finished' are run as actions ([765e889](https://github.com/embarklabs/embark/commit/765e889))
* **@embark/tests:** fix slow embark test because of the tx-logger ([1e9b8d8](https://github.com/embarklabs/embark/commit/1e9b8d8))


### Build System

* **deps:** bump web3[-*] from 1.2.1 to 1.2.4 ([7e550f0](https://github.com/embarklabs/embark/commit/7e550f0))


### BREAKING CHANGES

* **deps:** bump embark's minimum supported version of parity from
`>=2.0.0` to `>=2.2.1`. This is necessary since web3 1.2.4 makes use of the
`eth_chainId` RPC method (EIP 695) and that parity version is the earliest one
to implement it.

[bug]: https://github.com/ethereum/web3.js/issues/3283





# [5.0.0-alpha.8](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.7...v5.0.0-alpha.8) (2019-12-19)


### Bug Fixes

* **@embark/cockpit:** Remove loading from ENS util ([6f49992](https://github.com/embarklabs/embark/commit/6f49992))
* **@embark/rpc-manager:** fix duplicated accounts in rpc manager ([03bd49c](https://github.com/embarklabs/embark/commit/03bd49c))





# [4.2.0](https://github.com/embarklabs/embark/compare/v4.1.1...v4.2.0) (2019-12-18)


### Build System

* **deps:** bump web3[-*] from 1.2.1 to 1.2.4 ([e7ed552](https://github.com/embarklabs/embark/commit/e7ed552))


### BREAKING CHANGES

* **deps:** bump embark's minimum supported version of geth from
`>=1.8.14` to `>=1.9.0` and its minimum supported version of parity from
`>=2.0.0` to `>=2.2.1`. This is necessary since web3 1.2.4 makes use of the
`eth_chainId` RPC method (EIP 695) and those client versions are the earliest
ones to implement it.





# [5.0.0-alpha.7](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.6...v5.0.0-alpha.7) (2019-12-18)


### Bug Fixes

* **@embark/mocha-tests:** set accounts correctly on each contracts ([1331212](https://github.com/embarklabs/embark/commit/1331212))
* **@embark/rpc-manager:** fix sign data address comparison ([1bc967c](https://github.com/embarklabs/embark/commit/1bc967c))





# [5.0.0-alpha.6](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.5...v5.0.0-alpha.6) (2019-12-17)


### Bug Fixes

* **@cockpit/contracts:** ensure contract state is emitted in realtime ([aa5121a](https://github.com/embarklabs/embark/commit/aa5121a))
* **@embark/dapps:** Contracts app test failure ([7dfa2b9](https://github.com/embarklabs/embark/commit/7dfa2b9))
* **@embark/engine:** ensure deployment hook logs don't produce unexpected output ([920b078](https://github.com/embarklabs/embark/commit/920b078)), closes [/github.com/embarklabs/embark/commit/ee56f3771389a00e019eadce595dcf30468f0afe#diff-a7c4cef8bfebeb39fcd092aca5570fecL324-L340](https://github.com//github.com/embarklabs/embark/commit/ee56f3771389a00e019eadce595dcf30468f0afe/issues/diff-a7c4cef8bfebeb39fcd092aca5570fecL324-L340)
* **@embark/ens:** Show ENS controls for Test DApp ([aea2b6f](https://github.com/embarklabs/embark/commit/aea2b6f))





# [5.0.0-alpha.5](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.4...v5.0.0-alpha.5) (2019-12-16)


### Bug Fixes

* fix node connection test to use the endpoints correctly ([0503bb2](https://github.com/embarklabs/embark/commit/0503bb2))
* **@embark/embarkjs:** use getNetworkId to test connection ([60f4d2f](https://github.com/embarklabs/embark/commit/60f4d2f))
* **@embark/transaction-logger:** handle non-contract transactions ([1a7fc66](https://github.com/embarklabs/embark/commit/1a7fc66)), closes [/github.com/status-im/status-teller-network/blob/a5ab4d4b26afccf15ac7472a18728385dd8b2461/embarkConfig/data.js#L100-L110](https://github.com//github.com/status-im/status-teller-network/blob/a5ab4d4b26afccf15ac7472a18728385dd8b2461/embarkConfig/data.js/issues/L100-L110)
* **@embark/whisper:** fix whisper status check ([926b2bb](https://github.com/embarklabs/embark/commit/926b2bb))
* **@embarkrpc-manager:** fix infinite loop in eth_accounts modifier ([7e70761](https://github.com/embarklabs/embark/commit/7e70761))





# [5.0.0-alpha.4](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.3...v5.0.0-alpha.4) (2019-12-12)


### Bug Fixes

* **@cockpit/ens:** ensure default account is set when registering subdomains ([9839e92](https://github.com/embarklabs/embark/commit/9839e92))
* **@embark/blockchain:** make disabling blockchain feature work ([446197b](https://github.com/embarklabs/embark/commit/446197b))
* **@embark/debugger:** Re-enable debugger ([8e0f8b4](https://github.com/embarklabs/embark/commit/8e0f8b4))
* **@embark/ens:** fix broken test due to async API ([9df2430](https://github.com/embarklabs/embark/commit/9df2430))
* **@embark/geth:** only register console command if in dev mode; use endpoint; use dev account for regular txs that fix geths stuck tx issue ([5d53847](https://github.com/embarklabs/embark/commit/5d53847))
* **@embark/proxy:** fix conflict for WS port in the proxy ([eae97de](https://github.com/embarklabs/embark/commit/eae97de))
* **@embark/test:** fix using --node option in tests ([b82a240](https://github.com/embarklabs/embark/commit/b82a240))
* **@embark/tests:** Tests exiting early ([acd1d72](https://github.com/embarklabs/embark/commit/acd1d72))


### Features

* **@embark/whisper:** Add Whisper client config ([bd4b110](https://github.com/embarklabs/embark/commit/bd4b110))
* **@embarkjs/ens:** Introduce `dappConnection` configuration for namesystem ([2ae4664](https://github.com/embarklabs/embark/commit/2ae4664))





# [5.0.0-alpha.3](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.2...v5.0.0-alpha.3) (2019-12-06)


### Bug Fixes

* **@embark/core:** spec embark-rpc-manager as a dependency ([a5d0650](https://github.com/embarklabs/embark/commit/a5d0650))





# [5.0.0-alpha.2](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.1...v5.0.0-alpha.2) (2019-12-05)


### Bug Fixes

* **@cockpit:** adjust table-related styling so changes in updated core-ui don't override font color ([92f6d41](https://github.com/embarklabs/embark/commit/92f6d41))
* **@cockpit/console:** show contract names in the suggestions list ([4ee9004](https://github.com/embarklabs/embark/commit/4ee9004))
* **@embark/accounts-manager:** limit funding accounts to 1 at a time ([95b5ae4](https://github.com/embarklabs/embark/commit/95b5ae4))
* **@embark/core:** don't exit in Engine consumer API ([a7edca0](https://github.com/embarklabs/embark/commit/a7edca0))
* **@embark/core:** ensure type declaration for Plugin.registerActionForEvent() is legit ([5dc4b21](https://github.com/embarklabs/embark/commit/5dc4b21)), closes [/github.com/embarklabs/embark/commit/776db1b7f71e9a78f216cf2acc6c1387c60b3604#diff-5cab125016e6d753f03b6cd0241d5ebbR267](https://github.com//github.com/embarklabs/embark/commit/776db1b7f71e9a78f216cf2acc6c1387c60b3604/issues/diff-5cab125016e6d753f03b6cd0241d5ebbR267)
* **@embark/dapps:** add missing constructor argument in contracts config ([3f4e12a](https://github.com/embarklabs/embark/commit/3f4e12a))
* **@embark/dapps:** add missing Smart Contract configurations ([92f6dd4](https://github.com/embarklabs/embark/commit/92f6dd4))
* **@embark/ens:** don't break when determining contract addresses ([0d20cb5](https://github.com/embarklabs/embark/commit/0d20cb5))
* **@embark/ens:** don't change shape of Smart Contract args in action hooks ([b4478a9](https://github.com/embarklabs/embark/commit/b4478a9))
* **@embark/library-manager:** add web3 to versions list ([3c760c3](https://github.com/embarklabs/embark/commit/3c760c3))
* **@embark/proxy:** Fix unsubsribe handling and add new provider ([f6f4507](https://github.com/embarklabs/embark/commit/f6f4507))
* **@embark/rpc-manager:** implement missing RPC modifier for eth_sign ([4ebbb44](https://github.com/embarklabs/embark/commit/4ebbb44))
* **@embark/simulator:** fix port used in simulator ([dba5f77](https://github.com/embarklabs/embark/commit/dba5f77))
* **@embark/site:** ensure fathom script is only loaded in production environment ([7c5d662](https://github.com/embarklabs/embark/commit/7c5d662))
* **@embark/tests:** Improve expiration unit test ([23e94d6](https://github.com/embarklabs/embark/commit/23e94d6))
* **@embark/whisper:** fix ipc conflict on Windows with 2 Geths ([abac984](https://github.com/embarklabs/embark/commit/abac984))
* **@embark/whisper:** fix whisper node printing twice because of duplicated name ([04a02af](https://github.com/embarklabs/embark/commit/04a02af))
* **@embark/whisper:** show message when geth port is already taken ([23f9a8c](https://github.com/embarklabs/embark/commit/23f9a8c))


### Build System

* **deps:** bump deprecated ipfs-api@17.2.4 to ipfs-http-client@39.0.2 ([978e17d](https://github.com/embarklabs/embark/commit/978e17d)), closes [#1985](https://github.com/embarklabs/embark/issues/1985) [#2033](https://github.com/embarklabs/embark/issues/2033) [#1994](https://github.com/embarklabs/embark/issues/1994)


### Code Refactoring

* **@embark/library-manager:** restrict versionable packages to only solc ([2543aca](https://github.com/embarklabs/embark/commit/2543aca))


### Features

* **@embark/embark-rpc-manager:** Add support for `eth_signTypedData_v3` ([c7ec49a](https://github.com/embarklabs/embark/commit/c7ec49a)), closes [#1850](https://github.com/embarklabs/embark/issues/1850) [#1850](https://github.com/embarklabs/embark/issues/1850)
* **@embark/ens:** enable changing namesystem config per test ([de9e667](https://github.com/embarklabs/embark/commit/de9e667))
* **@embark/plugin:** add priority to regsiterActionForEvents ([776db1b](https://github.com/embarklabs/embark/commit/776db1b))
* **@embark/plugins/geth:** bump min supported geth version from 1.8.14 to 1.9.7 ([25d0510](https://github.com/embarklabs/embark/commit/25d0510))
* **@embark/tests:** enable comms and storage in tests ([aecb99d](https://github.com/embarklabs/embark/commit/aecb99d))


### BREAKING CHANGES

* **deps:** 
* **@embark/library-manager:** Remove support for specifying the versions of `web3` and `ipfs-api` in a
project's `embark.json`.





# [5.0.0-alpha.1](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.0...v5.0.0-alpha.1) (2019-11-05)


### Bug Fixes

* fix ws providers to have the patch for a bigger threshold ([#2017](https://github.com/embarklabs/embark/issues/2017)) ([9e654c5](https://github.com/embarklabs/embark/commit/9e654c5))
* **@cockpit/dashboard:** "Deployed Contracts" should auto-update after deployment ([#2020](https://github.com/embarklabs/embark/issues/2020)) ([1a43dca](https://github.com/embarklabs/embark/commit/1a43dca))
* **@embark/cockpit:** ensure correct data is send to web3's `ecRecover` ([#2024](https://github.com/embarklabs/embark/issues/2024)) ([abe79c8](https://github.com/embarklabs/embark/commit/abe79c8))
* **@embark/console:** ensure Cockpit is only started in non-secondary mode ([#2026](https://github.com/embarklabs/embark/issues/2026)) ([b0e71d9](https://github.com/embarklabs/embark/commit/b0e71d9))
* **@embark/core:** set loglevel back to info ([b8f7ec2](https://github.com/embarklabs/embark/commit/b8f7ec2))
* **@embark/deploy-tracker:** fix not storing different chains ([72278aa](https://github.com/embarklabs/embark/commit/72278aa))
* **@embark/proxy:** Fix contract event subscriptions ([f9ad486](https://github.com/embarklabs/embark/commit/f9ad486))
* **@embark/templates:** ensure boilerplate template comes with valid whisper port ([bad2207](https://github.com/embarklabs/embark/commit/bad2207)), closes [/github.com/embarklabs/embark/commit/e330b338ea2a45acb14eebd93af93bc2aba62516#diff-a61fbc84e4172487789d676437f26b5fR14](https://github.com//github.com/embarklabs/embark/commit/e330b338ea2a45acb14eebd93af93bc2aba62516/issues/diff-a61fbc84e4172487789d676437f26b5fR14)
* **@embark/test-runner:** fix test contracts being tracked ([fe3e604](https://github.com/embarklabs/embark/commit/fe3e604))





# [5.0.0-alpha.0](https://github.com/embarklabs/embark/compare/v4.1.1...v5.0.0-alpha.0) (2019-10-28)


### Bug Fixes

* fix process logs not showing on errors ([#1962](https://github.com/embarklabs/embark/issues/1962)) ([913267b](https://github.com/embarklabs/embark/commit/913267b))
* **@cockpit:** PropTypes typos: boolean -> bool, function -> func ([58c55ed](https://github.com/embarklabs/embark/commit/58c55ed))
* **@contract-app:** fix contracts app tests ([#1982](https://github.com/embarklabs/embark/issues/1982)) ([6e9635c](https://github.com/embarklabs/embark/commit/6e9635c))
* **@embark/basic-pipeline:** Remove `_1_` from pipeline output ([#1941](https://github.com/embarklabs/embark/issues/1941)) ([5dbc1c7](https://github.com/embarklabs/embark/commit/5dbc1c7))
* **@embark/cmd_controller:** ensure blockchain module is started before storage ([#1821](https://github.com/embarklabs/embark/issues/1821)) ([c7eb586](https://github.com/embarklabs/embark/commit/c7eb586))
* **@embark/cmd_controller:** ensure namesystem is set up in console command ([#1822](https://github.com/embarklabs/embark/issues/1822)) ([dd82a01](https://github.com/embarklabs/embark/commit/dd82a01))
* **@embark/cmd_controller:** use the correct path for eject-webpack ([98400dc](https://github.com/embarklabs/embark/commit/98400dc))
* **@embark/core:** make blockchain command work again ([8fee0b8](https://github.com/embarklabs/embark/commit/8fee0b8))
* **@embark/core:** set loglevel back to info ([a03ffd5](https://github.com/embarklabs/embark/commit/a03ffd5))
* **@embark/embark-deploy-tracker:** Fix reading of empty file ([#1872](https://github.com/embarklabs/embark/issues/1872)) ([022a3c1](https://github.com/embarklabs/embark/commit/022a3c1))
* **@embark/ens:** fix trying to resolve when ENS is not registered ([1302f9f](https://github.com/embarklabs/embark/commit/1302f9f))
* **@embark/geth:** fix version result not available ([9803507](https://github.com/embarklabs/embark/commit/9803507))
* **@embark/parity:** fix version result not available ([a4b3ef4](https://github.com/embarklabs/embark/commit/a4b3ef4))
* **@embark/proxy:** Check if WebSocket open before sending ([#1978](https://github.com/embarklabs/embark/issues/1978)) ([db71a93](https://github.com/embarklabs/embark/commit/db71a93))
* patch for infinite loop with panic override ([#1964](https://github.com/embarklabs/embark/issues/1964)) ([80df4fa](https://github.com/embarklabs/embark/commit/80df4fa))
* **@embark/proxy:** Fix contract event subscriptions ([173d53d](https://github.com/embarklabs/embark/commit/173d53d))
* **@embark/stack/pipeline:** set missing `this.fs` to `embark.fs` ([86a9766](https://github.com/embarklabs/embark/commit/86a9766))
* **@embark/transaction-logger:** don't show logs for stray receipts ([395ae83](https://github.com/embarklabs/embark/commit/395ae83))
* **@embarkjs/swarm:** web3@1.0.0-beta.37 -> web3@1.2.1 ([25a0644](https://github.com/embarklabs/embark/commit/25a0644))
* add back log command for modules ([#1969](https://github.com/embarklabs/embark/issues/1969)) ([918a00c](https://github.com/embarklabs/embark/commit/918a00c))
* **template_generator:** fix condition for windows ([7fae609](https://github.com/embarklabs/embark/commit/7fae609))
* **test-app:** make test app test all pass ([#1980](https://github.com/embarklabs/embark/issues/1980)) ([2193d82](https://github.com/embarklabs/embark/commit/2193d82))
* do not start modules if they are disabled ([d6bf5c2](https://github.com/embarklabs/embark/commit/d6bf5c2))
* fix error logs in the cockpit due from negative blocks numbers ([#1967](https://github.com/embarklabs/embark/issues/1967)) ([4b947bb](https://github.com/embarklabs/embark/commit/4b947bb))
* fix test-app, contracts index file and reload on change ([#1892](https://github.com/embarklabs/embark/issues/1892)) ([ee634c8](https://github.com/embarklabs/embark/commit/ee634c8))
* fix windows build for pipeline and embarkjs ([#1971](https://github.com/embarklabs/embark/issues/1971)) ([08c97a2](https://github.com/embarklabs/embark/commit/08c97a2))
* re-enable plugin command module and clean up engine ([#1961](https://github.com/embarklabs/embark/issues/1961)) ([5b72620](https://github.com/embarklabs/embark/commit/5b72620))
* type checker and linter errors on master after recent PR merges ([8716373](https://github.com/embarklabs/embark/commit/8716373))


### Build System

* bump all packages' engines settings ([#1985](https://github.com/embarklabs/embark/issues/1985)) ([ed02cc8](https://github.com/embarklabs/embark/commit/ed02cc8))


### Code Refactoring

* initial steps toward 5.0.0-alpha.0 ([#1856](https://github.com/embarklabs/embark/issues/1856)) ([b736ebe](https://github.com/embarklabs/embark/commit/b736ebe))


### Features

* call action before starting the blockchain node ([c54b8d9](https://github.com/embarklabs/embark/commit/c54b8d9))
* **@embark/cmd_controller:** add back embark simulator ([#1965](https://github.com/embarklabs/embark/issues/1965)) ([915b949](https://github.com/embarklabs/embark/commit/915b949))
* **@embark/compiler:** support :before and :after hooks on event compiler:contracts:compile ([#1878](https://github.com/embarklabs/embark/issues/1878)) ([043ccc0](https://github.com/embarklabs/embark/commit/043ccc0))
* **@embark/specialconfigs:** introduce dynamic addresses ([#1873](https://github.com/embarklabs/embark/issues/1873)) ([86ee867](https://github.com/embarklabs/embark/commit/86ee867)), closes [#1690](https://github.com/embarklabs/embark/issues/1690)
* **@embark/test-runner:** add reports to tests ([#1864](https://github.com/embarklabs/embark/issues/1864)) ([230fe59](https://github.com/embarklabs/embark/commit/230fe59))
* **@embark/test-runner:** make vm default node ([#1846](https://github.com/embarklabs/embark/issues/1846)) ([f54fbf0](https://github.com/embarklabs/embark/commit/f54fbf0))
* **@embark/testing:** introduce plugin APIs to register compilers ([f289a6f](https://github.com/embarklabs/embark/commit/f289a6f))
* **@embark/utils:** "inside monorepo" APIs ([de0e12d](https://github.com/embarklabs/embark/commit/de0e12d))
* **deployement:** add back deployment message with hash ([2f09a88](https://github.com/embarklabs/embark/commit/2f09a88))


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
* There are more than several breaking changes, including DApp configuration for
accounts.





## [4.1.1](https://github.com/embarklabs/embark/compare/v4.1.0...v4.1.1) (2019-08-28)


### Bug Fixes

* **@embark/demo:** add back lights ([dd07f67](https://github.com/embarklabs/embark/commit/dd07f67))
* **@embark/deploy-tracker:** continue if getting block fails ([0fe070c](https://github.com/embarklabs/embark/commit/0fe070c))
* **@embark/pipeline:** revise require in embarkArtifacts/contracts/index ([ff97aa5](https://github.com/embarklabs/embark/commit/ff97aa5))
* **@mbark/embarkjs:** enable using wss in embarkjs and the Dapp ([d2fc210](https://github.com/embarklabs/embark/commit/d2fc210))





# [4.1.0](https://github.com/embarklabs/embark/compare/v4.1.0-beta.6...v4.1.0) (2019-08-12)

**Note:** Version bump only for package root





# [4.1.0-beta.6](https://github.com/embarklabs/embark/compare/v4.1.0-beta.5...v4.1.0-beta.6) (2019-08-09)


### Bug Fixes

* **@embark/accountParser:** exit on unsupported account configs ([78bb9bc](https://github.com/embarklabs/embark/commit/78bb9bc))
* **@embark/cli:** properly forward cli options to ethereum simulator ([beebbe6](https://github.com/embarklabs/embark/commit/beebbe6))
* **@embark/embarkjs-ipfs:** use `version()` API instead of `id()` to determine availability ([1595e4b](https://github.com/embarklabs/embark/commit/1595e4b))
* **@embark/ipfs:** fix ipfs upload with wrong error message ([27bd574](https://github.com/embarklabs/embark/commit/27bd574))
* **@embark/library-manager:** add a check/warning for `"1.0.0-beta"` web3 version in installAll ([6dd0628](https://github.com/embarklabs/embark/commit/6dd0628))
* **@embark/pipeline:** adjust ignore paths ([e58c552](https://github.com/embarklabs/embark/commit/e58c552))
* **@embark/pipeline:** check if config arg of writeStats is falsy ([9d81fc5](https://github.com/embarklabs/embark/commit/9d81fc5))
* **@embark/pipeline:** streamline contract index file creation ([810c3be](https://github.com/embarklabs/embark/commit/810c3be))
* **@embark/site:** fix configuring contract link in structure.md ([9c0923c](https://github.com/embarklabs/embark/commit/9c0923c))
* **@embark/test-runner:** fix describe in describe tests ([c2094db](https://github.com/embarklabs/embark/commit/c2094db))
* **@embark/ui:** fix errorEntities not working at all ([5ab4c22](https://github.com/embarklabs/embark/commit/5ab4c22))


### Features

* **@embark/cmd:** add a warning on build and upload if development ([9e74d32](https://github.com/embarklabs/embark/commit/9e74d32))
* **@embark/pipeline:** add minimalContractSize to remove bytecode ([b0cccae](https://github.com/embarklabs/embark/commit/b0cccae))
* **@embark/pipeline:** enable choosing which fields to filter out ([b5c81bd](https://github.com/embarklabs/embark/commit/b5c81bd))
* **@embark/site:** add docs on filteredFields ([59eb69c](https://github.com/embarklabs/embark/commit/59eb69c))
* **@embark/site:** add documentation on minimalContractSize ([f9fb302](https://github.com/embarklabs/embark/commit/f9fb302))
* **homepage:** add section with logos from companies, who use embark ([178d8cd](https://github.com/embarklabs/embark/commit/178d8cd))





# [4.1.0-beta.5](https://github.com/embarklabs/embark/compare/v4.1.0-beta.4...v4.1.0-beta.5) (2019-07-10)


### Bug Fixes

* **@cockpit:** don't send invalid value to Smart Contract methods ([3f77272](https://github.com/embarklabs/embark/commit/3f77272))
* **@cockpit/debugger:** check if `debuggingContract` is undefined ([3590197](https://github.com/embarklabs/embark/commit/3590197))
* **@cockpit/explorers:** consistently display "Mined on" timestamps ([52d54f0](https://github.com/embarklabs/embark/commit/52d54f0))
* **@embark/code-generator:** use plugins for contract generation ([c87d7da](https://github.com/embarklabs/embark/commit/c87d7da))
* **@embark/code-runner:** restore EmbarkJS.environment property in the cli dashboard ([7d27125](https://github.com/embarklabs/embark/commit/7d27125))
* **@embark/contracts-manager:** ensure ETH values sent through APIs are converted to string ([70ff3c1](https://github.com/embarklabs/embark/commit/70ff3c1))
* **@embark/deployment:** don't over estimate gas when running tests against non-simulator nodes ([d76a82a](https://github.com/embarklabs/embark/commit/d76a82a)), closes [/github.com/trufflesuite/ganache-core/blob/8ad1ab29deccbbb4018f6961d0eb7ec984ad8fcb/lib/utils/gasEstimation.js#L33-L39](https://github.com//github.com/trufflesuite/ganache-core/blob/8ad1ab29deccbbb4018f6961d0eb7ec984ad8fcb/lib/utils/gasEstimation.js/issues/L33-L39)
* **@embark/embarkjs-whisper:** Messages.isAvailable() should always return a promise ([93ca3ad](https://github.com/embarklabs/embark/commit/93ca3ad))
* **@embark/ipc:** fix functions not being printed in console ([421c340](https://github.com/embarklabs/embark/commit/421c340))
* **@embark/site:** update contractGeneration plugin api ([ad796bc](https://github.com/embarklabs/embark/commit/ad796bc))
* **@embark/storage:** revise timing for process:started and code eval to avoid race conditions ([5828ae6](https://github.com/embarklabs/embark/commit/5828ae6))
* **@embark/test-runner:** make `--tx-details` option work again ([2531fc1](https://github.com/embarklabs/embark/commit/2531fc1)), closes [/github.com/embarklabs/embark/commit/87d92b6091#diff-92b4f79a0473160fe700440b1ced5204R140](https://github.com//github.com/embarklabs/embark/commit/87d92b6091/issues/diff-92b4f79a0473160fe700440b1ced5204R140)


### Features

* **@cockpit:** Pass tx value as wei and add validation ([536a402](https://github.com/embarklabs/embark/commit/536a402))
* **@embark/solc:** add embark-solc to monorepo ([1e59b58](https://github.com/embarklabs/embark/commit/1e59b58))
* **@embark/ui:** sort contracts and functions alphabetically ([0e9a4a1](https://github.com/embarklabs/embark/commit/0e9a4a1))





# [4.1.0-beta.4](https://github.com/embarklabs/embark/compare/v4.1.0-beta.3...v4.1.0-beta.4) (2019-06-27)


### Bug Fixes

* **@cockpit/utils:** Ensure whisper channels are at least 4 characters long ([610d8f1](https://github.com/embarklabs/embark/commit/610d8f1))
* **@dapps/demo:** don't allow subscription to whisper channels with less than 4 chars ([322397f](https://github.com/embarklabs/embark/commit/322397f)), closes [#1666](https://github.com/embarklabs/embark/issues/1666)
* **@dapps/templates/demo:** ensure whisper channel state is set correctly ([1b6987e](https://github.com/embarklabs/embark/commit/1b6987e))
* **@embark/config:** disable webserver if pipeline is disabled ([24b5339](https://github.com/embarklabs/embark/commit/24b5339))
* **@embark/coverage:** function types and single statement ifs ([2ce9ca6](https://github.com/embarklabs/embark/commit/2ce9ca6))
* **@embark/dapps:** old link updated to the latest documentation at website ([09d7428](https://github.com/embarklabs/embark/commit/09d7428))
* **@embark/deploy-tracker:** fix getting the block 0 with sim --fork ([f6d7a54](https://github.com/embarklabs/embark/commit/f6d7a54))
* **@embark/deployment:** don't break when using abiDefinitions ([9e5c9c7](https://github.com/embarklabs/embark/commit/9e5c9c7))
* **@embark/solidity:** fix recursive error on Windows ([1edd68f](https://github.com/embarklabs/embark/commit/1edd68f))
* **@embark/solidity:** show a better error message in debug ([198a5dc](https://github.com/embarklabs/embark/commit/198a5dc))
* **@embark/test-runenr:** fix event listener overflow ([e288483](https://github.com/embarklabs/embark/commit/e288483))
* alleviate races re: embarkjs by introducing Plugin#addGeneratedCode and related refactors ([fc4faa8](https://github.com/embarklabs/embark/commit/fc4faa8))
* **@embark/test-runner:** only run tests on files with describe ([9646673](https://github.com/embarklabs/embark/commit/9646673))
* **docs:** ensure paginator helper has `__()` local ([ebe61f4](https://github.com/embarklabs/embark/commit/ebe61f4))
* **templates:** fix templates because tests don't like empty files ([908aa3b](https://github.com/embarklabs/embark/commit/908aa3b))


### Features

* **@embark/blockchain-connector:** Add command to get full account info ([71cb161](https://github.com/embarklabs/embark/commit/71cb161))
* **@embark/site:** add section on getting account from describe ([5044403](https://github.com/embarklabs/embark/commit/5044403))
* **@embark/test-runner:** return accounts in the describe callback ([332229f](https://github.com/embarklabs/embark/commit/332229f))
* **@embark/test-runner:** wait for deploy before enterning describe ([8c16541](https://github.com/embarklabs/embark/commit/8c16541))





# [4.1.0-beta.3](https://github.com/embarklabs/embark/compare/v4.1.0-beta.2...v4.1.0-beta.3) (2019-06-07)


### Bug Fixes

* **@cockpit/explorer:** slice contract function result string only if starts/ends with double-quote ([ac76a40](https://github.com/embarklabs/embark/commit/ac76a40)), closes [#1636](https://github.com/embarklabs/embark/issues/1636)
* **@embark/swarm:** update url-scheme to bzz-raw ([6d844d7](https://github.com/embarklabs/embark/commit/6d844d7))
* **@embark/test-runner:** don't try to deploy and register ENS domains after JS tests have run ([e5fc12e](https://github.com/embarklabs/embark/commit/e5fc12e))
* gas estimates in test ([#1650](https://github.com/embarklabs/embark/issues/1650)) ([312c631](https://github.com/embarklabs/embark/commit/312c631))
* packages/embark/package.json to reduce vulnerabilities ([9029bfe](https://github.com/embarklabs/embark/commit/9029bfe))
* **@embarkjs:** unconditionally require symlinked embarkjs-* modules ([b45b2e2](https://github.com/embarklabs/embark/commit/b45b2e2))
* **@embarkjs/whisper:** don't rely on global EmbarkJS in whisper APIs ([f2903e7](https://github.com/embarklabs/embark/commit/f2903e7)), closes [/github.com/embarklabs/embark/blob/ac76a40a6156603fa436f1fe173835cff5fb0c3d/packages/embarkjs-whisper/src/index.js#L43-L62](https://github.com//github.com/embarklabs/embark/blob/ac76a40a6156603fa436f1fe173835cff5fb0c3d/packages/embarkjs-whisper/src/index.js/issues/L43-L62) [/github.com/embarklabs/embark/blob/ac76a40a6156603fa436f1fe173835cff5fb0c3d/packages/embarkjs-whisper/src/index.js#L64-L73](https://github.com//github.com/embarklabs/embark/blob/ac76a40a6156603fa436f1fe173835cff5fb0c3d/packages/embarkjs-whisper/src/index.js/issues/L64-L73) [/github.com/embarklabs/embark/blob/ac76a40a6156603fa436f1fe173835cff5fb0c3d/packages/embark-code-runner/src/index.ts#L33](https://github.com//github.com/embarklabs/embark/blob/ac76a40a6156603fa436f1fe173835cff5fb0c3d/packages/embark-code-runner/src/index.ts/issues/L33)


### Features

* **@cockpit/explorer:** enable users to send ether through payable methods ([#1649](https://github.com/embarklabs/embark/issues/1649)) ([d10c0b7](https://github.com/embarklabs/embark/commit/d10c0b7))
* **@embark/cli:** exit with error if --template and --contracts-only are both used with 'new' cmd ([d477adc](https://github.com/embarklabs/embark/commit/d477adc))





# [4.1.0-beta.2](https://github.com/embarklabs/embark/compare/v4.1.0-beta.1...v4.1.0-beta.2) (2019-05-22)


### Bug Fixes

* **@cockpit/utils:** properly detect if ENS is enabled ([7a0609b](https://github.com/embarklabs/embark/commit/7a0609b))
* **@cockpit/whisper:** ensure message subscription call is working ([2c6c948](https://github.com/embarklabs/embark/commit/2c6c948))
* **@embark/ens:** use namehash for resolver ([4d079de](https://github.com/embarklabs/embark/commit/4d079de))
* **@embark/pipeline:** ensure color methods for logs are available ([8ca6419](https://github.com/embarklabs/embark/commit/8ca6419))
* **@embark/utils:** add find-up and globule to dependencies ([0253c90](https://github.com/embarklabs/embark/commit/0253c90))


### Features

* **@embark/utils:** introduce setUpEnv() function ([038928f](https://github.com/embarklabs/embark/commit/038928f))





# [4.1.0-beta.1](https://github.com/embarklabs/embark/compare/v4.1.0-beta.0...v4.1.0-beta.1) (2019-05-15)


### Bug Fixes

* **@embark-utils/accountParser:** fix privateKey accounts ([fc02405](https://github.com/embarklabs/embark/commit/fc02405))
* **@embark/api:** import colors pkg so type string has .stripColors ([fbfe376](https://github.com/embarklabs/embark/commit/fbfe376))
* **@embark/api:** setup the embark-ui build dir before the express instance ([c4d647c](https://github.com/embarklabs/embark/commit/c4d647c))
* **@embark/api:** specify colors package as a dependency ([ae8ec69](https://github.com/embarklabs/embark/commit/ae8ec69))
* **@embark/blockchain_process:** use correct import for ProcessWrapper ([9acf256](https://github.com/embarklabs/embark/commit/9acf256))
* **@embark/console:** fix cockpit console if using console command ([d5c3a9c](https://github.com/embarklabs/embark/commit/d5c3a9c))
* **@embark/core:** move process.on inside ProcessWrapper's constructor ([fd09488](https://github.com/embarklabs/embark/commit/fd09488))
* **@embark/demo:** link css from dependency ([438e917](https://github.com/embarklabs/embark/commit/438e917))
* **@embark/demo:** render whisper error messages not error objects ([925ed06](https://github.com/embarklabs/embark/commit/925ed06))
* **@embark/deployment:** only log error when error exists ([bf0f439](https://github.com/embarklabs/embark/commit/bf0f439))
* **@embark/library-manager:** specify colors package as a dependency ([2d22819](https://github.com/embarklabs/embark/commit/2d22819))
* **@embark/plugin-cmd:** revise package.json in light of [#1573](https://github.com/embarklabs/embark/issues/1573), [#1574](https://github.com/embarklabs/embark/issues/1574), [#1575](https://github.com/embarklabs/embark/issues/1575), [#1576](https://github.com/embarklabs/embark/issues/1576) ([c30f742](https://github.com/embarklabs/embark/commit/c30f742))
* **@embark/site:** fix strategy not put in the right section ([8781585](https://github.com/embarklabs/embark/commit/8781585))
* **@embark/specialconfig:** fix undefined contract name in onDeploy ([7eb85f0](https://github.com/embarklabs/embark/commit/7eb85f0))
* **@embark/utils:** expose longRunningProcessTimer properly ([244e2e2](https://github.com/embarklabs/embark/commit/244e2e2))
* **embark-site:** error in tracking section ([c7c923d](https://github.com/embarklabs/embark/commit/c7c923d))
* **embark-site:** remove double web3 typo ([b9c12dd](https://github.com/embarklabs/embark/commit/b9c12dd))
* improve wording on contract constructor failing ([ea7ae22](https://github.com/embarklabs/embark/commit/ea7ae22))
* **embark/generator:** add back environment to EmbarkJS ([1ae0ab6](https://github.com/embarklabs/embark/commit/1ae0ab6))
* **embark/generator:** add empty line to embarkjs ([6b16f66](https://github.com/embarklabs/embark/commit/6b16f66))
* **test:** fix accountParser test in regards to privateKey fix ([a22d8fc](https://github.com/embarklabs/embark/commit/a22d8fc))
* add missing linkjuice built ([b5db685](https://github.com/embarklabs/embark/commit/b5db685))
* dashboard auto complete ([c51ec50](https://github.com/embarklabs/embark/commit/c51ec50))
* make coverage more forgiving ([0f4e554](https://github.com/embarklabs/embark/commit/0f4e554))
* parity origins ([a75fa79](https://github.com/embarklabs/embark/commit/a75fa79))
* update solidity-parser-antlr to allow the use of the payable keyword in contracts ([7401966](https://github.com/embarklabs/embark/commit/7401966))


### Features

* **@embar/contracts-manager:** add message for interface contracts ([334d3bc](https://github.com/embarklabs/embark/commit/334d3bc))
* **@embark-site:** add troubleshooting guide on interface contracts ([1f02e49](https://github.com/embarklabs/embark/commit/1f02e49))
* **@embark/api:** Add command `service api on/off` ([634feb5](https://github.com/embarklabs/embark/commit/634feb5))
* **@embark/blockchain:** Restart Ethereum via command ([7a76516](https://github.com/embarklabs/embark/commit/7a76516))
* **@embark/storage:** Add command `service ipfs on/off` ([1e4e6e4](https://github.com/embarklabs/embark/commit/1e4e6e4))
* **@embark/storage:** Add command `service swarm on/off` ([3dcc339](https://github.com/embarklabs/embark/commit/3dcc339))
* **@embark/test-runner:** show interface contract message in tests ([f9d7a3f](https://github.com/embarklabs/embark/commit/f9d7a3f))
* **@embark/webserver:** Add support for `service webserver on/off` ([0c394fe](https://github.com/embarklabs/embark/commit/0c394fe))
* **@embark/whisper:** Remove support for `service whisper on/off` ([fc01daf](https://github.com/embarklabs/embark/commit/fc01daf))





# [4.1.0-beta.0](https://github.com/embarklabs/embark/compare/v4.0.0...v4.1.0-beta.0) (2019-04-17)


### Bug Fixes

* **@cockpit/deployment:** Check if contracts deployed when connected to metamask ([c233163](https://github.com/embarklabs/embark/commit/c233163))
* **@cockpit/services:** send only process names to embark-api-client ([eb9de68](https://github.com/embarklabs/embark/commit/eb9de68))
* **@embark/contracts_manager:** compare correct property ([9e4204a](https://github.com/embarklabs/embark/commit/9e4204a))
* **@embark/debugger:** Add error handling for missing line ([5a502b3](https://github.com/embarklabs/embark/commit/5a502b3))
* **@embark/deployment:** ensure error messages emitted are logged ([72fc80d](https://github.com/embarklabs/embark/commit/72fc80d))
* **@embark/deployment:** ensure logger is available in all hooks ([42aebb9](https://github.com/embarklabs/embark/commit/42aebb9))
* **@embark/ipfs:** Fix IPFS gateway CORS for embark-status plugin ([e4d1e4e](https://github.com/embarklabs/embark/commit/e4d1e4e))
* **@embark/pipeline:** Support embarkjs-whisper with external pipeline ([447f6f8](https://github.com/embarklabs/embark/commit/447f6f8))
* **@embark/solidity:** handle absolute paths correctly ([4b1e126](https://github.com/embarklabs/embark/commit/4b1e126))
* **@embark/storage:** Fix hang when IPFS/Swarm started externally ([eca456f](https://github.com/embarklabs/embark/commit/eca456f))
* **@embark/tests:** Fix contracts app hanging ([12cbb7b](https://github.com/embarklabs/embark/commit/12cbb7b))
* **@embark/utils:** Fix proxy crash with unknown function ([431d366](https://github.com/embarklabs/embark/commit/431d366))
* **embark/compiler:** fix errors and bugs with solc 0.4.18 ([bfebb3c](https://github.com/embarklabs/embark/commit/bfebb3c))
* **embark/simulator:** fix account object empty when no mnemonic ([a4f68cb](https://github.com/embarklabs/embark/commit/a4f68cb))
* **pipeline:** build contracts even when pipeline is disabled ([75af5c4](https://github.com/embarklabs/embark/commit/75af5c4))
* run geth and parity in archival mode for dev nodes ([542809c](https://github.com/embarklabs/embark/commit/542809c))


### Features

* **@cockpit:** implement pagination for contracts ([d71352b](https://github.com/embarklabs/embark/commit/d71352b))
* **@cockpit/editor:** Make tabs draggable ([f27cde9](https://github.com/embarklabs/embark/commit/f27cde9))
* **@cockpit/explorer:** display truncated account balances ([6b2dc95](https://github.com/embarklabs/embark/commit/6b2dc95))
* **@cockpit/explorer:** implement pagination for accounts explorer ([745edaf](https://github.com/embarklabs/embark/commit/745edaf))
* **@embark/embark-reset:** allow users to specify files to be removed in reset ([b8357b7](https://github.com/embarklabs/embark/commit/b8357b7))
* **@embark/embark-specialconfigs:** introduce new beforeDeploy hooks ([1aeb6fd](https://github.com/embarklabs/embark/commit/1aeb6fd))
* **@embark/embarkjs:** add bytecode to contract ([4d4704a](https://github.com/embarklabs/embark/commit/4d4704a))
* **@embark/generator:** transpile embarkjs.js to be used by node ([ae88cc6](https://github.com/embarklabs/embark/commit/ae88cc6))
* **@embark/proxy:** Add dev tx to proxy when request fails to get response ([36be50e](https://github.com/embarklabs/embark/commit/36be50e))





## [4.0.2](https://github.com/embarklabs/embark/compare/v4.0.1...v4.0.2) (2019-04-11)


### Bug Fixes

* **@embark/contracts_manager:** compare correct property ([06dcbd0](https://github.com/embarklabs/embark/commit/06dcbd0))
* **@embark/solidity:** handle absolute paths correctly ([3cee7cf](https://github.com/embarklabs/embark/commit/3cee7cf))
* **@embark/storage:** Fix hang when IPFS/Swarm started externally ([c5b11ae](https://github.com/embarklabs/embark/commit/c5b11ae))
* **pipeline:** build contracts even when pipeline is disabled ([88c9a60](https://github.com/embarklabs/embark/commit/88c9a60))





## [4.0.1](https://github.com/embarklabs/embark/compare/v4.0.0...v4.0.1) (2019-03-26)


### Bug Fixes

* **@embark/utils:** Fix proxy crash with unknown function ([d03481e](https://github.com/embarklabs/embark/commit/d03481e))





# [4.0.0](https://github.com/embarklabs/embark/compare/v4.0.0-beta.2...v4.0.0) (2019-03-18)


### Bug Fixes

* **embark-ui:** don't show debug button for txs of silent contracts ([5161f54](https://github.com/embarklabs/embark/commit/5161f54))





# [4.0.0-beta.2](https://github.com/embarklabs/embark/compare/v4.0.0-beta.1...v4.0.0-beta.2) (2019-03-18)


### Bug Fixes

* typed commands in console ([9d34355](https://github.com/embarklabs/embark/commit/9d34355))
* **embark-ui:** detect fallback functions in the contracts explorer ([832f16a](https://github.com/embarklabs/embark/commit/832f16a))





# [4.0.0-beta.1](https://github.com/embarklabs/embark/compare/v4.0.0-beta.0...v4.0.0-beta.1) (2019-03-18)


### Bug Fixes

* **@embark/cockpit:** Fix cockpit not suggesting console commands ([0eaad43](https://github.com/embarklabs/embark/commit/0eaad43))
* **@embark/cockpit:** Fix contract method autosuggest ([e943d03](https://github.com/embarklabs/embark/commit/e943d03))
* **@embark/cockpit:** Fix decode transaction error ([f957ba5](https://github.com/embarklabs/embark/commit/f957ba5))
* **@embark/cockpit:** fix gas estimation ([43fed4f](https://github.com/embarklabs/embark/commit/43fed4f))
* **@embark/cockpit:** Fix whisper messages not being received ([a67a4ad](https://github.com/embarklabs/embark/commit/a67a4ad))
* **@embark/cockpit:** Switching between tabs resets logs ([a6b15ae](https://github.com/embarklabs/embark/commit/a6b15ae))
* **@embark/cockpit:** Utils/Communications handle enter ([8b7a374](https://github.com/embarklabs/embark/commit/8b7a374))
* **@embark/console:** Fix console not working with VM2/monorepo ([fc823bb](https://github.com/embarklabs/embark/commit/fc823bb))
* **@embark/core:** `web3.eth.getAccounts` returning empty ([bb86b60](https://github.com/embarklabs/embark/commit/bb86b60))
* **@embark/core:** Allow errors in event actions ([9fad777](https://github.com/embarklabs/embark/commit/9fad777))
* **@embark/core:** Fix contract testing with `remix_tests` ([02305fa](https://github.com/embarklabs/embark/commit/02305fa))
* **@embark/core:** fix memory leak when contract files are loaded ([40b9ac3](https://github.com/embarklabs/embark/commit/40b9ac3))
* **@embark/core:** fix tests as paths have changed again ([07ede90](https://github.com/embarklabs/embark/commit/07ede90))
* **@embark/core:** Fix tests for shim/monorepo ([eb4da28](https://github.com/embarklabs/embark/commit/eb4da28))
* **@embark/core:** Metamask + geth warning to enable regular txs ([c233dbc](https://github.com/embarklabs/embark/commit/c233dbc))
* **@embark/core:** Prevent unnecessary re-renderings ([128ecd4](https://github.com/embarklabs/embark/commit/128ecd4))
* **@embark/core:** Re-enable regular txs commands/api ([236f6e6](https://github.com/embarklabs/embark/commit/236f6e6))
* **@embark/core): fix(@embark/core:** Fix recursive import remapping ([e0fd641](https://github.com/embarklabs/embark/commit/e0fd641))
* **@embark/demo:** Fix demo ([58ea3d9](https://github.com/embarklabs/embark/commit/58ea3d9))
* **@embark/embarkjs:** Fix potential race condition ([876eee5](https://github.com/embarklabs/embark/commit/876eee5)), closes [/github.com/embarklabs/embark/pull/1319#discussion_r256850820](https://github.com//github.com/embarklabs/embark/pull/1319/issues/discussion_r256850820)
* **@embark/ipfs:** Update IPFS config CORS with default config ([518d319](https://github.com/embarklabs/embark/commit/518d319))
* **@embark/pipeline:** Prevent crash when assets not specified ([3aafde3](https://github.com/embarklabs/embark/commit/3aafde3))
* **@embark/solc:** Import remapping update ([2f354c9](https://github.com/embarklabs/embark/commit/2f354c9))
* **@embark/solidity:** ensure SolidityProcess receives proper Logger instance ([fdd51cf](https://github.com/embarklabs/embark/commit/fdd51cf))
* **@embark/solidity:** fix binding in method call ([3eeeec3](https://github.com/embarklabs/embark/commit/3eeeec3))
* **@embark/storage:** Allow upload when storage disabled ([9ea0383](https://github.com/embarklabs/embark/commit/9ea0383))
* **@embark/storage:** Fix storage not connecting error ([0d72ebe](https://github.com/embarklabs/embark/commit/0d72ebe))
* **@embark/storage:** Storage processes race conditions ([6f5efb1](https://github.com/embarklabs/embark/commit/6f5efb1))
* **@embark/swarm:** Fix swarm not being registered ([14323f5](https://github.com/embarklabs/embark/commit/14323f5))
* **@embark/test_app:** Fix tests as paths have chagned ([0ba1627](https://github.com/embarklabs/embark/commit/0ba1627))
* **@embark/tests:** Make `web3` available in test descriptions ([563ba15](https://github.com/embarklabs/embark/commit/563ba15))
* **blockchain:** check if node is synched after connection ([0639717](https://github.com/embarklabs/embark/commit/0639717))
* **blockchain-process:** display error message when bad port ([ed77fc7](https://github.com/embarklabs/embark/commit/ed77fc7))
* **build:** start code-generator service even for contracts only ([7fffc44](https://github.com/embarklabs/embark/commit/7fffc44))
* **cockpit:** fix converter inputs and copy-button position ([35648ee](https://github.com/embarklabs/embark/commit/35648ee))
* **cockpit:editor:** fix arrow not turning ([359c28f](https://github.com/embarklabs/embark/commit/359c28f))
* **cockpit/console:** fix cockpit's console outputting "console >" ([22e771b](https://github.com/embarklabs/embark/commit/22e771b))
* **cockpit/console:** increase number of suggestions ([71da423](https://github.com/embarklabs/embark/commit/71da423))
* **cockpit/console:** replace br with backslash n ([a341a4f](https://github.com/embarklabs/embark/commit/a341a4f))
* **cockpit/contract:** remove contract profiling and use functions ([99dcd78](https://github.com/embarklabs/embark/commit/99dcd78))
* **cockpit/dashboard:** fix logs not in  cockpit with dashboard ([be38178](https://github.com/embarklabs/embark/commit/be38178))
* **cockpit/deployment:** filter out silent contracts ([da76c8d](https://github.com/embarklabs/embark/commit/da76c8d))
* **cockpit/editor:** add delete modal to confirm deletion ([3f488e1](https://github.com/embarklabs/embark/commit/3f488e1))
* **cockpit/editor:** remove delay on tooltips ([c30c420](https://github.com/embarklabs/embark/commit/c30c420))
* **cockpit/estimator:** make estimator clearer ([1759aac](https://github.com/embarklabs/embark/commit/1759aac))
* **cockpit/firefox:** fix bug with entities in firefox (ordering) ([dddc9d0](https://github.com/embarklabs/embark/commit/dddc9d0))
* **cockpit/header:** fix nav not highlighted for children pages ([0648824](https://github.com/embarklabs/embark/commit/0648824))
* **cockpit/sidebar:** fix closed sidebar in the dark-theme ([5816a79](https://github.com/embarklabs/embark/commit/5816a79))
* **cockpit/suggestions:** fix suggestions with slashes ([9bb33e9](https://github.com/embarklabs/embark/commit/9bb33e9))
* **cockpit/transactions:** enable filtering constructor ([447f3ed](https://github.com/embarklabs/embark/commit/447f3ed))
* **cockpit/transactions:** fix a typo in the transactions page ([cba7c85](https://github.com/embarklabs/embark/commit/cba7c85))
* **code-generator:** use isDev instead of checking env ([540ff75](https://github.com/embarklabs/embark/commit/540ff75))
* **console:** fix ENS tests not working with embark side by side ([e20c08a](https://github.com/embarklabs/embark/commit/e20c08a))
* **console/logger:** fix console and logger not outputting objects ([32e8bd2](https://github.com/embarklabs/embark/commit/32e8bd2))
* **contract-artifacts:** set address as deployedAddress on artifacts ([a895e83](https://github.com/embarklabs/embark/commit/a895e83))
* **contracts:** fix contracts being instanceOf a contract with libs ([b5a3897](https://github.com/embarklabs/embark/commit/b5a3897))
* **contractsConfig:** fix using ints as gas and gasPrice ([dd14262](https://github.com/embarklabs/embark/commit/dd14262))
* **coverage:** fix coverage regex on Windows ([5e9955e](https://github.com/embarklabs/embark/commit/5e9955e))
* **embark:** require embark-compiler in packages/embark's tests ([37080c5](https://github.com/embarklabs/embark/commit/37080c5))
* **embark:** specify "rxjs" as a dependency vs. "@reactivex/rxjs" ([db40f03](https://github.com/embarklabs/embark/commit/db40f03))
* **embark-graph:** add packages/embark-graph/tslint.json ([733d804](https://github.com/embarklabs/embark/commit/733d804))
* **embark-ui:** AccountContainer should get txs for cold load case ([fd79090](https://github.com/embarklabs/embark/commit/fd79090))
* **embark-ui:** correctly calculate which blocks to display ([cc8363a](https://github.com/embarklabs/embark/commit/cc8363a))
* **embark-ui:** correctly calculate which transactions to display ([fbeea47](https://github.com/embarklabs/embark/commit/fbeea47))
* **embark-ui:** pagination ([f5f610d](https://github.com/embarklabs/embark/commit/f5f610d))
* **embark-ui:** specify PUBLIC_URL=/ for production builds ([f4626f8](https://github.com/embarklabs/embark/commit/f4626f8)), closes [/github.com/facebook/create-react-app/blob/master/packages/react-scripts/config/paths.js#L36](https://github.com//github.com/facebook/create-react-app/blob/master/packages/react-scripts/config/paths.js/issues/L36)
* **embark/contracts:** add the contracts back to the autocomplete ([618ceb6](https://github.com/embarklabs/embark/commit/618ceb6))
* **embark/dashboard:** fix dashboard not printing repl errors ([dd1133d](https://github.com/embarklabs/embark/commit/dd1133d))
* **embark/dashboard:** show command in the dashboard ([54698cc](https://github.com/embarklabs/embark/commit/54698cc))
* **embark/logger:** fix logs in the dashboard ([88a41e7](https://github.com/embarklabs/embark/commit/88a41e7))
* **embark/solidity:** fix getting the original filename of contracts ([4d424c0](https://github.com/embarklabs/embark/commit/4d424c0))
* **embark/storage:** fix hang when storage is disabled ([5e4a80e](https://github.com/embarklabs/embark/commit/5e4a80e))
* **embarkjs/blockchain:** only call doFirst once on connect ([a0d336e](https://github.com/embarklabs/embark/commit/a0d336e))
* **embarkjs/blockchain:** pass error only when there is an error ([fdd8ad5](https://github.com/embarklabs/embark/commit/fdd8ad5))
* **ens:** fix ens transactions getting stuck ([84d4f3a](https://github.com/embarklabs/embark/commit/84d4f3a))
* **ens/logger:** add ens contracts to contract manager before deploy ([d80641c](https://github.com/embarklabs/embark/commit/d80641c))
* **generator:** fix warnAboutMetamask being undefined ([0d8f233](https://github.com/embarklabs/embark/commit/0d8f233))
* **logger:** filter undefined and null out of logs ([6662731](https://github.com/embarklabs/embark/commit/6662731))
* **pipeline:** fix contract magic imports ([fc113e8](https://github.com/embarklabs/embark/commit/fc113e8))
* add watch script on top level ([#1320](https://github.com/embarklabs/embark/issues/1320)) ([edd1e0f](https://github.com/embarklabs/embark/commit/edd1e0f))
* **solidity:** make original really original ([90adaab](https://github.com/embarklabs/embark/commit/90adaab))
* allow to debug instanceOf contracts ([1e4eaa5](https://github.com/embarklabs/embark/commit/1e4eaa5))
* allow to use embark in dev deps ([daf6e64](https://github.com/embarklabs/embark/commit/daf6e64))
* blockchain logs show in cockpit ([#1367](https://github.com/embarklabs/embark/issues/1367)) ([41256cf](https://github.com/embarklabs/embark/commit/41256cf))
* cockpit search with tx hash shows tx page ([#1386](https://github.com/embarklabs/embark/issues/1386)) ([891174e](https://github.com/embarklabs/embark/commit/891174e))
* command handlers named consistently ([e36ea5d](https://github.com/embarklabs/embark/commit/e36ea5d))
* contract length check now checks the correct thing ([a295a5b](https://github.com/embarklabs/embark/commit/a295a5b))
* don't eval function calls for suggestions ([#1382](https://github.com/embarklabs/embark/issues/1382)) ([73a0672](https://github.com/embarklabs/embark/commit/73a0672))
* editor wasn't saving changes ([4340a9b](https://github.com/embarklabs/embark/commit/4340a9b))
* estimate gas automatically when not specified ([8fd6a6d](https://github.com/embarklabs/embark/commit/8fd6a6d))
* fetch accounts ([7d5935d](https://github.com/embarklabs/embark/commit/7d5935d))
* first parallel deploy ([7ac27a0](https://github.com/embarklabs/embark/commit/7ac27a0))
* format \n as <br> in cockpit console ([#1385](https://github.com/embarklabs/embark/issues/1385)) ([58ab76d](https://github.com/embarklabs/embark/commit/58ab76d))
* handle the case where account is an object ([24a6a47](https://github.com/embarklabs/embark/commit/24a6a47))
* limit cockpit editor file size ([f12ca22](https://github.com/embarklabs/embark/commit/f12ca22))
* log command in console ([1334900](https://github.com/embarklabs/embark/commit/1334900))
* node_modules should be part of hidden files ([0b530f3](https://github.com/embarklabs/embark/commit/0b530f3))
* pressing enter on "Display additional results" does the expected thing ([2cc0d30](https://github.com/embarklabs/embark/commit/2cc0d30))
* prevent HTML injection in the cockpit ([#1381](https://github.com/embarklabs/embark/issues/1381)) ([78201ce](https://github.com/embarklabs/embark/commit/78201ce))
* remove unneeded test_dapps/ directory in the monorepo root ([5c2e30c](https://github.com/embarklabs/embark/commit/5c2e30c))
* revise test urls to reflect test_dapps/ -> dapps/tests/ ([eb1b693](https://github.com/embarklabs/embark/commit/eb1b693))
* simulator proxy with ws ([5968eef](https://github.com/embarklabs/embark/commit/5968eef))
* specify full path for password files (geth) ([c1d08c6](https://github.com/embarklabs/embark/commit/c1d08c6))
* supply missing tsconfig.json in packages/* ([376b6ca](https://github.com/embarklabs/embark/commit/376b6ca))
* swarm command registers and warns when swarm is disabled ([afe2512](https://github.com/embarklabs/embark/commit/afe2512))
* template dependency errors don't exit ([271a219](https://github.com/embarklabs/embark/commit/271a219))
* track and debug last transaction correctly ([aba4e0e](https://github.com/embarklabs/embark/commit/aba4e0e))
* upgrade packages with vulnerabilities ([#1388](https://github.com/embarklabs/embark/issues/1388)) ([913b4e1](https://github.com/embarklabs/embark/commit/913b4e1))
* **test:** fix tests getting stuck when embark is run next to it ([e64ed36](https://github.com/embarklabs/embark/commit/e64ed36))
* use a yarn.lock that wasn't completely regenerated ([41fb31a](https://github.com/embarklabs/embark/commit/41fb31a)), closes [/github.com/embarklabs/embark/pull/1307#issuecomment-461184291](https://github.com//github.com/embarklabs/embark/pull/1307/issues/issuecomment-461184291)
* use our global Web3 and not Metamask's ([9ccc453](https://github.com/embarklabs/embark/commit/9ccc453))
* use right accounts for contract deployment ([576836d](https://github.com/embarklabs/embark/commit/576836d))
* **test/blockchain:** fix race condition of installing web3 and test ([8ebba40](https://github.com/embarklabs/embark/commit/8ebba40))
* **vyper:** file path ([e6eea1d](https://github.com/embarklabs/embark/commit/e6eea1d))
* using async with async npm ([0ddebc7](https://github.com/embarklabs/embark/commit/0ddebc7))
* validate whisper channel name in communication tab ([616af6d](https://github.com/embarklabs/embark/commit/616af6d))
* warn when contract bytecode too large for EVM ([387d33a](https://github.com/embarklabs/embark/commit/387d33a))


### Features

* **@cockpit/transaction-decoder:** allow for decoding raw transaction hashes ([e72d648](https://github.com/embarklabs/embark/commit/e72d648))
* **@embark/core:** Add events oracle ([84ca98f](https://github.com/embarklabs/embark/commit/84ca98f))
* **@embark/core:** Auto generate EmbarkJS events ([d378ccf](https://github.com/embarklabs/embark/commit/d378ccf))
* **@embark/core:** Disable regular txs until needed ([135fde0](https://github.com/embarklabs/embark/commit/135fde0))
* **@embark/core:** Improve VM ([c1a5bfe](https://github.com/embarklabs/embark/commit/c1a5bfe))
* **@embark/core:** Recursively import contracts ([2613e6d](https://github.com/embarklabs/embark/commit/2613e6d))
* **@embark/core:** Run all code in VM2 ([9a9eb45](https://github.com/embarklabs/embark/commit/9a9eb45))
* **@embark/pipeline:** Add `enabled` property to pipeline config ([5ea4807](https://github.com/embarklabs/embark/commit/5ea4807))
* **blockchain/config:** adds a cors command to add it to the config ([84a74ac](https://github.com/embarklabs/embark/commit/84a74ac))
* **blockchainConfig:** enable having auto cors plus other origins ([9e349ff](https://github.com/embarklabs/embark/commit/9e349ff))
* **cockpit/console:** display cmds from cockpit in embark console ([e339641](https://github.com/embarklabs/embark/commit/e339641))
* **cockpit/contracts:** don't display contracts marked as silent ([0e63d6b](https://github.com/embarklabs/embark/commit/0e63d6b))
* **cockpit/editor:** add status messages for file operations ([ecdfd47](https://github.com/embarklabs/embark/commit/ecdfd47))
* **cockpit/transaction:** display a link for contracts and accounts ([74847ee](https://github.com/embarklabs/embark/commit/74847ee))
* **compiler:** add a new compiler api that checks for compatibility ([df872fd](https://github.com/embarklabs/embark/commit/df872fd))
* **console:** print console results as log so cockpit gets it ([57cd6d3](https://github.com/embarklabs/embark/commit/57cd6d3))
* **console:** wait for connector onReady to have warning ([8ee32c1](https://github.com/embarklabs/embark/commit/8ee32c1))
* **contract:** contracts can point to an artifact file to bypass deploy and compile ([1543f6a](https://github.com/embarklabs/embark/commit/1543f6a))
* **coverage:** load contracts from plugin ([46221a3](https://github.com/embarklabs/embark/commit/46221a3))
* **dapp-config:** add dapp connection to dapp  config (artifact) ([52aebeb](https://github.com/embarklabs/embark/commit/52aebeb))
* **deployer:** add event to return the contract send object ([1d459e4](https://github.com/embarklabs/embark/commit/1d459e4))
* **embark-ui:** add storybook ([eab9aa5](https://github.com/embarklabs/embark/commit/eab9aa5))
* **embark/generation:** remove generation of web3instance.js ([3b0a2b9](https://github.com/embarklabs/embark/commit/3b0a2b9))
* add repository.directory field to package.json ([a9c5e1a](https://github.com/embarklabs/embark/commit/a9c5e1a))
* allow to stop debugger ([52d830a](https://github.com/embarklabs/embark/commit/52d830a))
* avoid infinite loop ([e8da329](https://github.com/embarklabs/embark/commit/e8da329))
* create async wrapper ([bc24598](https://github.com/embarklabs/embark/commit/bc24598))
* enable embark to be run with an external pipeline ([ebcc3c4](https://github.com/embarklabs/embark/commit/ebcc3c4))
* import resolver ([29db66b](https://github.com/embarklabs/embark/commit/29db66b))
* normalize README and package.json bugs, homepage, description ([5418f16](https://github.com/embarklabs/embark/commit/5418f16))
* **embarkjs/blockchain:** remove dependency on web3instance.js ([bd9fc66](https://github.com/embarklabs/embark/commit/bd9fc66))
* **generattion:** remove web3 generation to let EmbarkJS handle it ([4023392](https://github.com/embarklabs/embark/commit/4023392))
* **plugins:** enable external plugin to be classes ([5ab3e46](https://github.com/embarklabs/embark/commit/5ab3e46))
* **test/reporter:** log tx functions during tests ([87d92b6](https://github.com/embarklabs/embark/commit/87d92b6))
* **test/reporter:** only show tx details on option ([2173576](https://github.com/embarklabs/embark/commit/2173576))
* **ui:** color console item info as success ([193abd4](https://github.com/embarklabs/embark/commit/193abd4))
* **ui:** keep state in frame ([cd32630](https://github.com/embarklabs/embark/commit/cd32630))
* **web3-connector:** convert web3connector to class and add connect ([7eceaf6](https://github.com/embarklabs/embark/commit/7eceaf6))
* **web3connector:** add web3 connector plugin to connect to web3 ([976f994](https://github.com/embarklabs/embark/commit/976f994))

# [4.0.0-beta.0](https://github.com/embarklabs/embark/compare/v4.0.0-alpha.3...v4.0.0-beta.0) (2019-01-10)


### Bug Fixes

* **@embark/coderunner:** use custom require function in vm context ([2dea50a](https://github.com/embarklabs/embark/commit/2dea50a))
* **@embark/core:** fix to allow large ether values ([f549822](https://github.com/embarklabs/embark/commit/f549822))
* **blockchain:** fix metamask using the old web3 ([749c32c](https://github.com/embarklabs/embark/commit/749c32c))
* **contracts:** fix linking libraries with long paths using output ([d071130](https://github.com/embarklabs/embark/commit/d071130))


### Features

* add API server ([d67863c](https://github.com/embarklabs/embark/commit/d67863c))
* **@embark-ui:** Change page title and description ([2613c56](https://github.com/embarklabs/embark/commit/2613c56))
* **@embark/cli:** unify command history without needing a restart ([919d271](https://github.com/embarklabs/embark/commit/919d271))
* add development mode to cockpit ([2505fa5](https://github.com/embarklabs/embark/commit/2505fa5))
* add option --no-single-use-cockpit-token ([34f5f97](https://github.com/embarklabs/embark/commit/34f5f97))
* allow cockpit with docker ([8efa889](https://github.com/embarklabs/embark/commit/8efa889))
* coverage without emit ([df3435f](https://github.com/embarklabs/embark/commit/df3435f)), closes [#1230](https://github.com/embarklabs/embark/issues/1230)





# [4.0.0-alpha.3](https://github.com/embarklabs/embark/compare/v4.0.0-alpha.2...v4.0.0-alpha.3) (2018-12-31)


### Bug Fixes

* all ws endpoint use new technique ([bbcfe9b](https://github.com/embarklabs/embark/commit/bbcfe9b))
* allow message signing with wallet address ([3a8808e](https://github.com/embarklabs/embark/commit/3a8808e))
* consistent service order in cockpit ([7574e14](https://github.com/embarklabs/embark/commit/7574e14))
* do not override web3 in embark ([94a8bad](https://github.com/embarklabs/embark/commit/94a8bad))
* record contract transaction history ([435e1e6](https://github.com/embarklabs/embark/commit/435e1e6))
* **simulator:** fix simulator when there is no accounts ([34d5923](https://github.com/embarklabs/embark/commit/34d5923))
* windows path separator being wrong ([72f8701](https://github.com/embarklabs/embark/commit/72f8701))
* **@embark:** single use tokens ([6aa8781](https://github.com/embarklabs/embark/commit/6aa8781))
* **@embark/blockchain_process:** proxy listens on the specified host ([9e7bc53](https://github.com/embarklabs/embark/commit/9e7bc53))
* **@embark/cli:** start the dashboard after services are started ([6c7782c](https://github.com/embarklabs/embark/commit/6c7782c))
* **@embark/cockpit/converter:** allow decimal numbers ([8a5871e](https://github.com/embarklabs/embark/commit/8a5871e))
* **@embark/core:** Disable swarm if URL can’t be determined ([c24536d](https://github.com/embarklabs/embark/commit/c24536d))
* **@embark/core:** Fix `—template` URL support ([f1206b4](https://github.com/embarklabs/embark/commit/f1206b4))
* **@embark/core:** Proxy support for raw transactions ([ffcff4a](https://github.com/embarklabs/embark/commit/ffcff4a))
* **@embark/core:** Restart IPFS after CORS Update ([27babf0](https://github.com/embarklabs/embark/commit/27babf0))
* **@embark/core:** Support legacy Parity version parsing ([1ccc3e7](https://github.com/embarklabs/embark/commit/1ccc3e7))
* **@embark/ens:** make resolve() work with promises and callbacks ([2195475](https://github.com/embarklabs/embark/commit/2195475))
* **@embark/whisper:** ensure web3 is ready when whisper info is requested ([fd311f9](https://github.com/embarklabs/embark/commit/fd311f9))
* **@embark/whisper:** use a new WebsocketProvider on each retry ([27ad343](https://github.com/embarklabs/embark/commit/27ad343))
* **blockchain:** add cert options to blockchain initialization ([bf8629d](https://github.com/embarklabs/embark/commit/bf8629d))
* **blockchain/geth:** create geth dev account before other accounts ([7811211](https://github.com/embarklabs/embark/commit/7811211))
* **cockpit/editor:** remove arrows next to files in file explorer ([d30b00e](https://github.com/embarklabs/embark/commit/d30b00e))
* **compiler:** fix compiler being fired twice ([ebd827b](https://github.com/embarklabs/embark/commit/ebd827b))
* **debugger:** fix and improve console commands ([37c28b9](https://github.com/embarklabs/embark/commit/37c28b9))
* **debugger:** fix debugger displays ([9c37f97](https://github.com/embarklabs/embark/commit/9c37f97))
* **embarkjs/web3:** make global web3 available again ([6e4a612](https://github.com/embarklabs/embark/commit/6e4a612))
* **ens:** fix error message by checking for directives before ([06553b5](https://github.com/embarklabs/embark/commit/06553b5))
* **ens/web3:** use blockchain connector for ens and fix global web3 ([d5f6da3](https://github.com/embarklabs/embark/commit/d5f6da3))
* **gethClient:** clear timeout when call backing ([9a6149f](https://github.com/embarklabs/embark/commit/9a6149f))
* **logHandler:** stringify objects instead of trying to split it ([33d6e29](https://github.com/embarklabs/embark/commit/33d6e29))
* **names:** fix ens console commands ([50858dc](https://github.com/embarklabs/embark/commit/50858dc))
* **parity:** create password file even when there are no accounts ([7d2ceaa](https://github.com/embarklabs/embark/commit/7d2ceaa))
* **profiler:** do not exit on error but print it ([e207537](https://github.com/embarklabs/embark/commit/e207537))
* **proxy:** delete old ids for accounts ([604e267](https://github.com/embarklabs/embark/commit/604e267))
* **test:** use logger instead of engine.logger ([af48788](https://github.com/embarklabs/embark/commit/af48788))
* **test/console:** register in the console in tests when ipc connected ([503a79c](https://github.com/embarklabs/embark/commit/503a79c))
* **whisper:** fix crash on using whisper with the simualtor ([1461e95](https://github.com/embarklabs/embark/commit/1461e95))
* **ws:** up fragmentation threshold to patch Geth bug with WS ([b20bce9](https://github.com/embarklabs/embark/commit/b20bce9))


### Features

* add coverage events ([8a6d075](https://github.com/embarklabs/embark/commit/8a6d075))
* apply contract change to test ([e3a7b74](https://github.com/embarklabs/embark/commit/e3a7b74))
* code runner use fs overrided ([944b392](https://github.com/embarklabs/embark/commit/944b392))
* **ui:** auto updates services in cockpit ([a92a986](https://github.com/embarklabs/embark/commit/a92a986))
* enable ethereum manually ([5a375d9](https://github.com/embarklabs/embark/commit/5a375d9))
* **@embark/core:** Allow search to find contract by name ([1e2cb64](https://github.com/embarklabs/embark/commit/1e2cb64))
* **@embark/core:** improve long running webpack UI ([b49839a](https://github.com/embarklabs/embark/commit/b49839a))
* **@embark/core:** store IPC files in a dir within os.tmpdir() ([a91a4dd](https://github.com/embarklabs/embark/commit/a91a4dd)), closes [#1202](https://github.com/embarklabs/embark/issues/1202) [#450](https://github.com/embarklabs/embark/issues/450)
* **@embark/core:** Support directives in ENS config ([7511156](https://github.com/embarklabs/embark/commit/7511156))
* **@embark/deployment:** output transaction hash during deployment asap ([0bb7d63](https://github.com/embarklabs/embark/commit/0bb7d63))
* **@embark/deployment:** output transaction hash of contract deployment ([3099894](https://github.com/embarklabs/embark/commit/3099894))
* **console:** add new api to register console commands ([3229e15](https://github.com/embarklabs/embark/commit/3229e15))
* **coverage:** gas usage improvements ([0118b1a](https://github.com/embarklabs/embark/commit/0118b1a))
* **scaffold:** use ipfs in scaffold and upload file ([9854368](https://github.com/embarklabs/embark/commit/9854368))
* **ui:** auto updates contracts in cockpit ([d10d906](https://github.com/embarklabs/embark/commit/d10d906))





# [4.0.0-alpha.2](https://github.com/embarklabs/embark/compare/v4.0.0-alpha.1...v4.0.0-alpha.2) (2018-12-05)


### Bug Fixes

* **@embark/blockchain_process:** ignore socket disconnect bytes ([1fac391](https://github.com/embarklabs/embark/commit/1fac391))
* **@embark/cmd:** output contract json ([4dca723](https://github.com/embarklabs/embark/commit/4dca723))
* **@embark/contracts_manager:** set contract `deployedAddress` if address is set ([2ff119d](https://github.com/embarklabs/embark/commit/2ff119d))
* **@embark/core:** don't expect `balance` on `accounts` ([4961f70](https://github.com/embarklabs/embark/commit/4961f70)), closes [#1067](https://github.com/embarklabs/embark/issues/1067)
* **@embark/core:** ensure 0x0 address are extended to full zero addresses ([d3f6b43](https://github.com/embarklabs/embark/commit/d3f6b43)), closes [#956](https://github.com/embarklabs/embark/issues/956)
* **@embark/core:** expect `afterDeploy` hook on contracts config environment ([903e9d4](https://github.com/embarklabs/embark/commit/903e9d4))
* **@embark/ens:** use local ZERO_ADDRESS in ENSFunctions ([6526e83](https://github.com/embarklabs/embark/commit/6526e83))
* **@embark/webserver:** load embark-ui sources from the correct path ([96f7688](https://github.com/embarklabs/embark/commit/96f7688))
* **accounts:** remove warning for simulator configs ([de58cab](https://github.com/embarklabs/embark/commit/de58cab))
* **blockchain:** fix setting proxy to false not applying ([f50f106](https://github.com/embarklabs/embark/commit/f50f106))
* **ci:** make CI happy again by updating http paths to master branch ([af1bc90](https://github.com/embarklabs/embark/commit/af1bc90))
* **cmd:** removes -h as an option for host for the simulator ([43be2a2](https://github.com/embarklabs/embark/commit/43be2a2))
* **cockpit:** disable autocomplete in Login component ([3ddcd1f](https://github.com/embarklabs/embark/commit/3ddcd1f))
* **cockpit:** fix aside not opening correctly and typos ([a714e07](https://github.com/embarklabs/embark/commit/a714e07))
* **contracts:** replace $accounts for onDeploy too ([8831dfb](https://github.com/embarklabs/embark/commit/8831dfb))
* **contracts_manager:** fix object contract arguments ([6b61c8a](https://github.com/embarklabs/embark/commit/6b61c8a))
* **dependencies:** lock remix-test and debug version ([f938473](https://github.com/embarklabs/embark/commit/f938473))
* **deployment:** add a message when the errror is about the input ([7a5035e](https://github.com/embarklabs/embark/commit/7a5035e))
* **ENS:** register subdomain when not registered ([ca212e3](https://github.com/embarklabs/embark/commit/ca212e3))
* **ens/embarkjs:** fix using await with embarkjs functions ([c64c093](https://github.com/embarklabs/embark/commit/c64c093))
* **ipc:** sends requests and events only when connected ([cabfa93](https://github.com/embarklabs/embark/commit/cabfa93)), closes [#1063](https://github.com/embarklabs/embark/issues/1063)
* **module/authenticator:** do not display log if no webserver ([97829c0](https://github.com/embarklabs/embark/commit/97829c0))
* **simulator:** adds `node` to sim command to comply with Windows ([1a29a8f](https://github.com/embarklabs/embark/commit/1a29a8f))
* **simulator:** change port depending of the type in config ([51e39c5](https://github.com/embarklabs/embark/commit/51e39c5))
* **simulator:** use config's gas limit if no option provided ([3353a05](https://github.com/embarklabs/embark/commit/3353a05)), closes [#1054](https://github.com/embarklabs/embark/issues/1054)
* **tests:** enable coverage only when --coverage ([0032569](https://github.com/embarklabs/embark/commit/0032569)), closes [#1091](https://github.com/embarklabs/embark/issues/1091)
* **tests:** fix tests that fetched files from devleop ([ea2a656](https://github.com/embarklabs/embark/commit/ea2a656))
* **tests:** fix using node config inside a test ([3a3c81e](https://github.com/embarklabs/embark/commit/3a3c81e))
* **ui:** click on debug button start the debugger ([1600153](https://github.com/embarklabs/embark/commit/1600153))
* **ui:** switch aside ([66e431c](https://github.com/embarklabs/embark/commit/66e431c))
* add missing external declaration ([6e784de](https://github.com/embarklabs/embark/commit/6e784de))
* adjust module resolution behavior ([bc6e0e3](https://github.com/embarklabs/embark/commit/bc6e0e3))
* coverage count ([f32ddc9](https://github.com/embarklabs/embark/commit/f32ddc9))
* deploy hangs ([92610ed](https://github.com/embarklabs/embark/commit/92610ed))
* handle contracts being removed ([485b8ef](https://github.com/embarklabs/embark/commit/485b8ef)), closes [#1077](https://github.com/embarklabs/embark/issues/1077)
* open/close aside container ([7728c54](https://github.com/embarklabs/embark/commit/7728c54))
* **ui:** white screen on text editor ([10caddd](https://github.com/embarklabs/embark/commit/10caddd))
* **whisper:** fix disabling whisper crashing blockchain ([b48d29a](https://github.com/embarklabs/embark/commit/b48d29a)), closes [#1027](https://github.com/embarklabs/embark/issues/1027)
* runtime environment needs to support locally installed embark ([23f19a0](https://github.com/embarklabs/embark/commit/23f19a0))


### Features

* add CRUD to file explorer ([f82d3de](https://github.com/embarklabs/embark/commit/f82d3de))
* add debug button to transaction and contract log ([184e1e2](https://github.com/embarklabs/embark/commit/184e1e2))
* add new event before build ([db35d7f](https://github.com/embarklabs/embark/commit/db35d7f))
* adds support for swarm imports in Solidity ([62607b0](https://github.com/embarklabs/embark/commit/62607b0)), closes [#766](https://github.com/embarklabs/embark/issues/766)
* Allow parallel deploy ([3406ae8](https://github.com/embarklabs/embark/commit/3406ae8))
* expose dappPath ([5fb687c](https://github.com/embarklabs/embark/commit/5fb687c))
* handle missing directive ([bae3116](https://github.com/embarklabs/embark/commit/bae3116))
* introduce function support for deploy lifecycle hooks ([8b68bec](https://github.com/embarklabs/embark/commit/8b68bec)), closes [#1029](https://github.com/embarklabs/embark/issues/1029)
* **@embark/cli:** add --template option to embark demo cli command ([89e3eb6](https://github.com/embarklabs/embark/commit/89e3eb6))
* permanently save logs/events ([51b8224](https://github.com/embarklabs/embark/commit/51b8224))
* run coverage for bytecode and deployedBytecode ([f84d7f1](https://github.com/embarklabs/embark/commit/f84d7f1))
* strategy for deployment ([f9f4c28](https://github.com/embarklabs/embark/commit/f9f4c28))
* **@embark/cli:** introduce `eject-build-config` alias ([ffb8f54](https://github.com/embarklabs/embark/commit/ffb8f54)), closes [#1121](https://github.com/embarklabs/embark/issues/1121) [#1121](https://github.com/embarklabs/embark/issues/1121)
* **@embark/cli:** repl support inside dashboard ([53780aa](https://github.com/embarklabs/embark/commit/53780aa)), closes [#768](https://github.com/embarklabs/embark/issues/768)
* **@embark/console:** better determine suggestions for any js object not just with the dot.' ([d427e62](https://github.com/embarklabs/embark/commit/d427e62))
* **@embark/console:** determine suggestions automatically for a js object of the type 'command.' ([f206062](https://github.com/embarklabs/embark/commit/f206062))
* **@embark/contracts_manager:** allow ABI definition non-owned contracts ([17cec1b](https://github.com/embarklabs/embark/commit/17cec1b))
* **@embark/plugins:** introduce API to register a contract factory ([90aac83](https://github.com/embarklabs/embark/commit/90aac83)), closes [#1066](https://github.com/embarklabs/embark/issues/1066)
* **@embark/whister:** Add signature and recipient public key to whisper envelope ([46e351e](https://github.com/embarklabs/embark/commit/46e351e))
* **cockpit:** add searching ENS names in search bar ([dca52d0](https://github.com/embarklabs/embark/commit/dca52d0))
* **cockpit:** make editor resizable ([1030607](https://github.com/embarklabs/embark/commit/1030607))
* update to solc 0.5.0 ([45afe83](https://github.com/embarklabs/embark/commit/45afe83))
* **coverage:** count node by line only ([154a4f0](https://github.com/embarklabs/embark/commit/154a4f0))
* **scaffold:** allow association/file ([f68f1fc](https://github.com/embarklabs/embark/commit/f68f1fc))
