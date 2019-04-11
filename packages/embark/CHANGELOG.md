# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [4.0.2](https://github.com/embark-framework/embark/compare/v4.0.1...v4.0.2) (2019-04-11)


### Bug Fixes

* **@embark/contracts_manager:** compare correct property ([06dcbd0](https://github.com/embark-framework/embark/commit/06dcbd0))
* **@embark/solidity:** handle absolute paths correctly ([3cee7cf](https://github.com/embark-framework/embark/commit/3cee7cf))
* **@embark/storage:** Fix hang when IPFS/Swarm started externally ([c5b11ae](https://github.com/embark-framework/embark/commit/c5b11ae))
* **pipeline:** build contracts even when pipeline is disabled ([88c9a60](https://github.com/embark-framework/embark/commit/88c9a60))





## [4.0.1](https://github.com/embark-framework/embark/compare/v4.0.0...v4.0.1) (2019-03-26)


### Bug Fixes

* **@embark/utils:** Fix proxy crash with unknown function ([d03481e](https://github.com/embark-framework/embark/commit/d03481e))





# [4.0.0](https://github.com/embark-framework/embark/compare/v4.0.0-beta.2...v4.0.0) (2019-03-18)

**Note:** Version bump only for package embark





# [4.0.0-beta.2](https://github.com/embark-framework/embark/compare/v4.0.0-beta.1...v4.0.0-beta.2) (2019-03-18)

**Note:** Version bump only for package embark





# [4.0.0-beta.1](https://github.com/embark-framework/embark/compare/v4.0.0-beta.0...v4.0.0-beta.1) (2019-03-18)


### Bug Fixes

* **@embark/cockpit:** Fix cockpit not suggesting console commands ([0eaad43](https://github.com/embark-framework/embark/commit/0eaad43))
* **@embark/cockpit:** Fix contract method autosuggest ([e943d03](https://github.com/embark-framework/embark/commit/e943d03))
* **@embark/cockpit:** Fix decode transaction error ([f957ba5](https://github.com/embark-framework/embark/commit/f957ba5))
* **@embark/cockpit:** Fix whisper messages not being received ([a67a4ad](https://github.com/embark-framework/embark/commit/a67a4ad))
* **@embark/cockpit:** Switching between tabs resets logs ([a6b15ae](https://github.com/embark-framework/embark/commit/a6b15ae))
* **@embark/console:** Fix console not working with VM2/monorepo ([fc823bb](https://github.com/embark-framework/embark/commit/fc823bb))
* **@embark/core:** `web3.eth.getAccounts` returning empty ([bb86b60](https://github.com/embark-framework/embark/commit/bb86b60))
* **@embark/core:** Allow errors in event actions ([9fad777](https://github.com/embark-framework/embark/commit/9fad777))
* **@embark/core:** fix memory leak when contract files are loaded ([40b9ac3](https://github.com/embark-framework/embark/commit/40b9ac3))
* **@embark/core:** fix tests as paths have changed again ([07ede90](https://github.com/embark-framework/embark/commit/07ede90))
* **@embark/core:** Fix tests for shim/monorepo ([eb4da28](https://github.com/embark-framework/embark/commit/eb4da28))
* **@embark/core:** Metamask + geth warning to enable regular txs ([c233dbc](https://github.com/embark-framework/embark/commit/c233dbc))
* **@embark/core:** Re-enable regular txs commands/api ([236f6e6](https://github.com/embark-framework/embark/commit/236f6e6))
* **@embark/demo:** Fix demo ([58ea3d9](https://github.com/embark-framework/embark/commit/58ea3d9))
* **@embark/pipeline:** Prevent crash when assets not specified ([3aafde3](https://github.com/embark-framework/embark/commit/3aafde3))
* **@embark/solc:** Import remapping update ([2f354c9](https://github.com/embark-framework/embark/commit/2f354c9))
* **@embark/solidity:** ensure SolidityProcess receives proper Logger instance ([fdd51cf](https://github.com/embark-framework/embark/commit/fdd51cf))
* **@embark/storage:** Allow upload when storage disabled ([9ea0383](https://github.com/embark-framework/embark/commit/9ea0383))
* **@embark/storage:** Fix storage not connecting error ([0d72ebe](https://github.com/embark-framework/embark/commit/0d72ebe))
* **@embark/storage:** Storage processes race conditions ([6f5efb1](https://github.com/embark-framework/embark/commit/6f5efb1))
* **@embark/swarm:** Fix swarm not being registered ([14323f5](https://github.com/embark-framework/embark/commit/14323f5))
* **@embark/test_app:** Fix tests as paths have chagned ([0ba1627](https://github.com/embark-framework/embark/commit/0ba1627))
* **@embark/tests:** Make `web3` available in test descriptions ([563ba15](https://github.com/embark-framework/embark/commit/563ba15))
* **blockchain:** check if node is synched after connection ([0639717](https://github.com/embark-framework/embark/commit/0639717))
* **blockchain-process:** display error message when bad port ([ed77fc7](https://github.com/embark-framework/embark/commit/ed77fc7))
* **build:** start code-generator service even for contracts only ([7fffc44](https://github.com/embark-framework/embark/commit/7fffc44))
* **cockpit/console:** fix cockpit's console outputting "console >" ([22e771b](https://github.com/embark-framework/embark/commit/22e771b))
* **cockpit/dashboard:** fix logs not in  cockpit with dashboard ([be38178](https://github.com/embark-framework/embark/commit/be38178))
* **cockpit/firefox:** fix bug with entities in firefox (ordering) ([dddc9d0](https://github.com/embark-framework/embark/commit/dddc9d0))
* **cockpit/suggestions:** fix suggestions with slashes ([9bb33e9](https://github.com/embark-framework/embark/commit/9bb33e9))
* **console:** fix ENS tests not working with embark side by side ([e20c08a](https://github.com/embark-framework/embark/commit/e20c08a))
* **console/logger:** fix console and logger not outputting objects ([32e8bd2](https://github.com/embark-framework/embark/commit/32e8bd2))
* **contract-artifacts:** set address as deployedAddress on artifacts ([a895e83](https://github.com/embark-framework/embark/commit/a895e83))
* **contracts:** fix contracts being instanceOf a contract with libs ([b5a3897](https://github.com/embark-framework/embark/commit/b5a3897))
* **contractsConfig:** fix using ints as gas and gasPrice ([dd14262](https://github.com/embark-framework/embark/commit/dd14262))
* **coverage:** fix coverage regex on Windows ([5e9955e](https://github.com/embark-framework/embark/commit/5e9955e))
* **embark:** require embark-compiler in packages/embark's tests ([37080c5](https://github.com/embark-framework/embark/commit/37080c5))
* **embark:** specify "rxjs" as a dependency vs. "@reactivex/rxjs" ([db40f03](https://github.com/embark-framework/embark/commit/db40f03))
* **embark-ui:** correctly calculate which transactions to display ([fbeea47](https://github.com/embark-framework/embark/commit/fbeea47))
* **embark-ui:** specify PUBLIC_URL=/ for production builds ([f4626f8](https://github.com/embark-framework/embark/commit/f4626f8)), closes [/github.com/facebook/create-react-app/blob/master/packages/react-scripts/config/paths.js#L36](https://github.com//github.com/facebook/create-react-app/blob/master/packages/react-scripts/config/paths.js/issues/L36)
* **embark/contracts:** add the contracts back to the autocomplete ([618ceb6](https://github.com/embark-framework/embark/commit/618ceb6))
* **embark/dashboard:** fix dashboard not printing repl errors ([dd1133d](https://github.com/embark-framework/embark/commit/dd1133d))
* **embark/dashboard:** show command in the dashboard ([54698cc](https://github.com/embark-framework/embark/commit/54698cc))
* specify full path for password files (geth) ([c1d08c6](https://github.com/embark-framework/embark/commit/c1d08c6))
* **embark/logger:** fix logs in the dashboard ([88a41e7](https://github.com/embark-framework/embark/commit/88a41e7))
* **embark/solidity:** fix getting the original filename of contracts ([4d424c0](https://github.com/embark-framework/embark/commit/4d424c0))
* **embark/storage:** fix hang when storage is disabled ([5e4a80e](https://github.com/embark-framework/embark/commit/5e4a80e))
* **embarkjs/blockchain:** pass error only when there is an error ([fdd8ad5](https://github.com/embark-framework/embark/commit/fdd8ad5))
* contract length check now checks the correct thing ([a295a5b](https://github.com/embark-framework/embark/commit/a295a5b))
* **ens:** fix ens transactions getting stuck ([84d4f3a](https://github.com/embark-framework/embark/commit/84d4f3a))
* blockchain logs show in cockpit ([#1367](https://github.com/embark-framework/embark/issues/1367)) ([41256cf](https://github.com/embark-framework/embark/commit/41256cf))
* don't eval function calls for suggestions ([#1382](https://github.com/embark-framework/embark/issues/1382)) ([73a0672](https://github.com/embark-framework/embark/commit/73a0672))
* estimate gas automatically when not specified ([8fd6a6d](https://github.com/embark-framework/embark/commit/8fd6a6d))
* fetch accounts ([7d5935d](https://github.com/embark-framework/embark/commit/7d5935d))
* handle the case where account is an object ([24a6a47](https://github.com/embark-framework/embark/commit/24a6a47))
* log command in console ([1334900](https://github.com/embark-framework/embark/commit/1334900))
* node_modules should be part of hidden files ([0b530f3](https://github.com/embark-framework/embark/commit/0b530f3))
* prevent HTML injection in the cockpit ([#1381](https://github.com/embark-framework/embark/issues/1381)) ([78201ce](https://github.com/embark-framework/embark/commit/78201ce))
* revise test urls to reflect test_dapps/ -> dapps/tests/ ([eb1b693](https://github.com/embark-framework/embark/commit/eb1b693))
* supply missing tsconfig.json in packages/* ([376b6ca](https://github.com/embark-framework/embark/commit/376b6ca))
* template dependency errors don't exit ([271a219](https://github.com/embark-framework/embark/commit/271a219))
* track and debug last transaction correctly ([aba4e0e](https://github.com/embark-framework/embark/commit/aba4e0e))
* **ens/logger:** add ens contracts to contract manager before deploy ([d80641c](https://github.com/embark-framework/embark/commit/d80641c))
* **logger:** filter undefined and null out of logs ([6662731](https://github.com/embark-framework/embark/commit/6662731))
* **pipeline:** fix contract magic imports ([fc113e8](https://github.com/embark-framework/embark/commit/fc113e8))
* **solidity:** make original really original ([90adaab](https://github.com/embark-framework/embark/commit/90adaab))
* **test:** fix tests getting stuck when embark is run next to it ([e64ed36](https://github.com/embark-framework/embark/commit/e64ed36))
* **test/blockchain:** fix race condition of installing web3 and test ([8ebba40](https://github.com/embark-framework/embark/commit/8ebba40))
* upgrade packages with vulnerabilities ([#1388](https://github.com/embark-framework/embark/issues/1388)) ([913b4e1](https://github.com/embark-framework/embark/commit/913b4e1))
* use right accounts for contract deployment ([576836d](https://github.com/embark-framework/embark/commit/576836d))


### Features

* **@embark/core:** Add events oracle ([84ca98f](https://github.com/embark-framework/embark/commit/84ca98f))
* **@embark/core:** Auto generate EmbarkJS events ([d378ccf](https://github.com/embark-framework/embark/commit/d378ccf))
* **@embark/pipeline:** Add `enabled` property to pipeline config ([5ea4807](https://github.com/embark-framework/embark/commit/5ea4807))
* **cockpit/console:** display cmds from cockpit in embark console ([e339641](https://github.com/embark-framework/embark/commit/e339641))
* **console:** print console results as log so cockpit gets it ([57cd6d3](https://github.com/embark-framework/embark/commit/57cd6d3))
* **console:** wait for connector onReady to have warning ([8ee32c1](https://github.com/embark-framework/embark/commit/8ee32c1))
* **coverage:** load contracts from plugin ([46221a3](https://github.com/embark-framework/embark/commit/46221a3))
* **embark/generation:** remove generation of web3instance.js ([3b0a2b9](https://github.com/embark-framework/embark/commit/3b0a2b9))
* **embarkjs/blockchain:** remove dependency on web3instance.js ([bd9fc66](https://github.com/embark-framework/embark/commit/bd9fc66))
* **plugins:** enable external plugin to be classes ([5ab3e46](https://github.com/embark-framework/embark/commit/5ab3e46))
* add repository.directory field to package.json ([a9c5e1a](https://github.com/embark-framework/embark/commit/a9c5e1a))
* **test/reporter:** log tx functions during tests ([87d92b6](https://github.com/embark-framework/embark/commit/87d92b6))
* **test/reporter:** only show tx details on option ([2173576](https://github.com/embark-framework/embark/commit/2173576))
* **web3connector:** add web3 connector plugin to connect to web3 ([976f994](https://github.com/embark-framework/embark/commit/976f994))
* enable embark to be run with an external pipeline ([ebcc3c4](https://github.com/embark-framework/embark/commit/ebcc3c4))
* normalize README and package.json bugs, homepage, description ([5418f16](https://github.com/embark-framework/embark/commit/5418f16))





# [4.0.0-beta.0](https://github.com/embark-framework/embark/compare/v4.0.0-alpha.3...v4.0.0-beta.0) (2019-01-10)


### Bug Fixes

* **@embark/coderunner:** use custom require function in vm context ([2dea50a](https://github.com/embark-framework/embark/commit/2dea50a))
* **@embark/core:** fix to allow large ether values ([f549822](https://github.com/embark-framework/embark/commit/f549822))
* **blockchain:** fix metamask using the old web3 ([749c32c](https://github.com/embark-framework/embark/commit/749c32c))
* **contracts:** fix linking libraries with long paths using output ([d071130](https://github.com/embark-framework/embark/commit/d071130))


### Features

* add API server ([d67863c](https://github.com/embark-framework/embark/commit/d67863c))
* **@embark-ui:** Change page title and description ([2613c56](https://github.com/embark-framework/embark/commit/2613c56))
* **@embark/cli:** unify command history without needing a restart ([919d271](https://github.com/embark-framework/embark/commit/919d271))
* add development mode to cockpit ([2505fa5](https://github.com/embark-framework/embark/commit/2505fa5))
* add option --no-single-use-cockpit-token ([34f5f97](https://github.com/embark-framework/embark/commit/34f5f97))
* allow cockpit with docker ([8efa889](https://github.com/embark-framework/embark/commit/8efa889))
* coverage without emit ([df3435f](https://github.com/embark-framework/embark/commit/df3435f)), closes [#1230](https://github.com/embark-framework/embark/issues/1230)





# [4.0.0-alpha.3](https://github.com/embark-framework/embark/compare/v4.0.0-alpha.2...v4.0.0-alpha.3) (2018-12-31)


### Bug Fixes

* all ws endpoint use new technique ([bbcfe9b](https://github.com/embark-framework/embark/commit/bbcfe9b))
* allow message signing with wallet address ([3a8808e](https://github.com/embark-framework/embark/commit/3a8808e))
* consistent service order in cockpit ([7574e14](https://github.com/embark-framework/embark/commit/7574e14))
* do not override web3 in embark ([94a8bad](https://github.com/embark-framework/embark/commit/94a8bad))
* record contract transaction history ([435e1e6](https://github.com/embark-framework/embark/commit/435e1e6))
* **simulator:** fix simulator when there is no accounts ([34d5923](https://github.com/embark-framework/embark/commit/34d5923))
* windows path separator being wrong ([72f8701](https://github.com/embark-framework/embark/commit/72f8701))
* **@embark:** single use tokens ([6aa8781](https://github.com/embark-framework/embark/commit/6aa8781))
* **@embark/blockchain_process:** proxy listens on the specified host ([9e7bc53](https://github.com/embark-framework/embark/commit/9e7bc53))
* **@embark/cli:** start the dashboard after services are started ([6c7782c](https://github.com/embark-framework/embark/commit/6c7782c))
* **@embark/cockpit/converter:** allow decimal numbers ([8a5871e](https://github.com/embark-framework/embark/commit/8a5871e))
* **@embark/core:** Disable swarm if URL can’t be determined ([c24536d](https://github.com/embark-framework/embark/commit/c24536d))
* **@embark/core:** Fix `—template` URL support ([f1206b4](https://github.com/embark-framework/embark/commit/f1206b4))
* **@embark/core:** Proxy support for raw transactions ([ffcff4a](https://github.com/embark-framework/embark/commit/ffcff4a))
* **@embark/core:** Restart IPFS after CORS Update ([27babf0](https://github.com/embark-framework/embark/commit/27babf0))
* **@embark/core:** Support legacy Parity version parsing ([1ccc3e7](https://github.com/embark-framework/embark/commit/1ccc3e7))
* **@embark/ens:** make resolve() work with promises and callbacks ([2195475](https://github.com/embark-framework/embark/commit/2195475))
* **@embark/whisper:** ensure web3 is ready when whisper info is requested ([fd311f9](https://github.com/embark-framework/embark/commit/fd311f9))
* **@embark/whisper:** use a new WebsocketProvider on each retry ([27ad343](https://github.com/embark-framework/embark/commit/27ad343))
* **blockchain:** add cert options to blockchain initialization ([bf8629d](https://github.com/embark-framework/embark/commit/bf8629d))
* **blockchain/geth:** create geth dev account before other accounts ([7811211](https://github.com/embark-framework/embark/commit/7811211))
* **cockpit/editor:** remove arrows next to files in file explorer ([d30b00e](https://github.com/embark-framework/embark/commit/d30b00e))
* **compiler:** fix compiler being fired twice ([ebd827b](https://github.com/embark-framework/embark/commit/ebd827b))
* **debugger:** fix and improve console commands ([37c28b9](https://github.com/embark-framework/embark/commit/37c28b9))
* **debugger:** fix debugger displays ([9c37f97](https://github.com/embark-framework/embark/commit/9c37f97))
* **embarkjs/web3:** make global web3 available again ([6e4a612](https://github.com/embark-framework/embark/commit/6e4a612))
* **ens:** fix error message by checking for directives before ([06553b5](https://github.com/embark-framework/embark/commit/06553b5))
* **ens/web3:** use blockchain connector for ens and fix global web3 ([d5f6da3](https://github.com/embark-framework/embark/commit/d5f6da3))
* **gethClient:** clear timeout when call backing ([9a6149f](https://github.com/embark-framework/embark/commit/9a6149f))
* **logHandler:** stringify objects instead of trying to split it ([33d6e29](https://github.com/embark-framework/embark/commit/33d6e29))
* **names:** fix ens console commands ([50858dc](https://github.com/embark-framework/embark/commit/50858dc))
* **parity:** create password file even when there are no accounts ([7d2ceaa](https://github.com/embark-framework/embark/commit/7d2ceaa))
* **profiler:** do not exit on error but print it ([e207537](https://github.com/embark-framework/embark/commit/e207537))
* **proxy:** delete old ids for accounts ([604e267](https://github.com/embark-framework/embark/commit/604e267))
* **test:** use logger instead of engine.logger ([af48788](https://github.com/embark-framework/embark/commit/af48788))
* **test/console:** register in the console in tests when ipc connected ([503a79c](https://github.com/embark-framework/embark/commit/503a79c))
* **whisper:** fix crash on using whisper with the simualtor ([1461e95](https://github.com/embark-framework/embark/commit/1461e95))
* **ws:** up fragmentation threshold to patch Geth bug with WS ([b20bce9](https://github.com/embark-framework/embark/commit/b20bce9))


### Features

* add coverage events ([8a6d075](https://github.com/embark-framework/embark/commit/8a6d075))
* apply contract change to test ([e3a7b74](https://github.com/embark-framework/embark/commit/e3a7b74))
* code runner use fs overrided ([944b392](https://github.com/embark-framework/embark/commit/944b392))
* **ui:** auto updates services in cockpit ([a92a986](https://github.com/embark-framework/embark/commit/a92a986))
* enable ethereum manually ([5a375d9](https://github.com/embark-framework/embark/commit/5a375d9))
* **@embark/core:** Allow search to find contract by name ([1e2cb64](https://github.com/embark-framework/embark/commit/1e2cb64))
* **@embark/core:** improve long running webpack UI ([b49839a](https://github.com/embark-framework/embark/commit/b49839a))
* **@embark/core:** store IPC files in a dir within os.tmpdir() ([a91a4dd](https://github.com/embark-framework/embark/commit/a91a4dd)), closes [#1202](https://github.com/embark-framework/embark/issues/1202) [#450](https://github.com/embark-framework/embark/issues/450)
* **@embark/core:** Support directives in ENS config ([7511156](https://github.com/embark-framework/embark/commit/7511156))
* **@embark/deployment:** output transaction hash during deployment asap ([0bb7d63](https://github.com/embark-framework/embark/commit/0bb7d63))
* **@embark/deployment:** output transaction hash of contract deployment ([3099894](https://github.com/embark-framework/embark/commit/3099894))
* **console:** add new api to register console commands ([3229e15](https://github.com/embark-framework/embark/commit/3229e15))
* **coverage:** gas usage improvements ([0118b1a](https://github.com/embark-framework/embark/commit/0118b1a))
* **scaffold:** use ipfs in scaffold and upload file ([9854368](https://github.com/embark-framework/embark/commit/9854368))
* **ui:** auto updates contracts in cockpit ([d10d906](https://github.com/embark-framework/embark/commit/d10d906))





# [4.0.0-alpha.2](https://github.com/embark-framework/embark/compare/v4.0.0-alpha.1...v4.0.0-alpha.2) (2018-12-05)


### Bug Fixes

* **@embark/blockchain_process:** ignore socket disconnect bytes ([1fac391](https://github.com/embark-framework/embark/commit/1fac391))
* **@embark/cmd:** output contract json ([4dca723](https://github.com/embark-framework/embark/commit/4dca723))
* **@embark/contracts_manager:** set contract `deployedAddress` if address is set ([2ff119d](https://github.com/embark-framework/embark/commit/2ff119d))
* **@embark/core:** don't expect `balance` on `accounts` ([4961f70](https://github.com/embark-framework/embark/commit/4961f70)), closes [#1067](https://github.com/embark-framework/embark/issues/1067)
* **@embark/core:** ensure 0x0 address are extended to full zero addresses ([d3f6b43](https://github.com/embark-framework/embark/commit/d3f6b43)), closes [#956](https://github.com/embark-framework/embark/issues/956)
* **@embark/core:** expect `afterDeploy` hook on contracts config environment ([903e9d4](https://github.com/embark-framework/embark/commit/903e9d4))
* **@embark/ens:** use local ZERO_ADDRESS in ENSFunctions ([6526e83](https://github.com/embark-framework/embark/commit/6526e83))
* **@embark/webserver:** load embark-ui sources from the correct path ([96f7688](https://github.com/embark-framework/embark/commit/96f7688))
* **accounts:** remove warning for simulator configs ([de58cab](https://github.com/embark-framework/embark/commit/de58cab))
* **blockchain:** fix setting proxy to false not applying ([f50f106](https://github.com/embark-framework/embark/commit/f50f106))
* **ci:** make CI happy again by updating http paths to master branch ([af1bc90](https://github.com/embark-framework/embark/commit/af1bc90))
* **cmd:** removes -h as an option for host for the simulator ([43be2a2](https://github.com/embark-framework/embark/commit/43be2a2))
* **cockpit:** disable autocomplete in Login component ([3ddcd1f](https://github.com/embark-framework/embark/commit/3ddcd1f))
* **cockpit:** fix aside not opening correctly and typos ([a714e07](https://github.com/embark-framework/embark/commit/a714e07))
* **contracts:** replace $accounts for onDeploy too ([8831dfb](https://github.com/embark-framework/embark/commit/8831dfb))
* **contracts_manager:** fix object contract arguments ([6b61c8a](https://github.com/embark-framework/embark/commit/6b61c8a))
* **dependencies:** lock remix-test and debug version ([f938473](https://github.com/embark-framework/embark/commit/f938473))
* **deployment:** add a message when the errror is about the input ([7a5035e](https://github.com/embark-framework/embark/commit/7a5035e))
* **ENS:** register subdomain when not registered ([ca212e3](https://github.com/embark-framework/embark/commit/ca212e3))
* **ens/embarkjs:** fix using await with embarkjs functions ([c64c093](https://github.com/embark-framework/embark/commit/c64c093))
* **ipc:** sends requests and events only when connected ([cabfa93](https://github.com/embark-framework/embark/commit/cabfa93)), closes [#1063](https://github.com/embark-framework/embark/issues/1063)
* **module/authenticator:** do not display log if no webserver ([97829c0](https://github.com/embark-framework/embark/commit/97829c0))
* **simulator:** adds `node` to sim command to comply with Windows ([1a29a8f](https://github.com/embark-framework/embark/commit/1a29a8f))
* **simulator:** change port depending of the type in config ([51e39c5](https://github.com/embark-framework/embark/commit/51e39c5))
* **simulator:** use config's gas limit if no option provided ([3353a05](https://github.com/embark-framework/embark/commit/3353a05)), closes [#1054](https://github.com/embark-framework/embark/issues/1054)
* **tests:** enable coverage only when --coverage ([0032569](https://github.com/embark-framework/embark/commit/0032569)), closes [#1091](https://github.com/embark-framework/embark/issues/1091)
* **tests:** fix tests that fetched files from devleop ([ea2a656](https://github.com/embark-framework/embark/commit/ea2a656))
* **tests:** fix using node config inside a test ([3a3c81e](https://github.com/embark-framework/embark/commit/3a3c81e))
* **ui:** click on debug button start the debugger ([1600153](https://github.com/embark-framework/embark/commit/1600153))
* **ui:** switch aside ([66e431c](https://github.com/embark-framework/embark/commit/66e431c))
* add missing external declaration ([6e784de](https://github.com/embark-framework/embark/commit/6e784de))
* adjust module resolution behavior ([bc6e0e3](https://github.com/embark-framework/embark/commit/bc6e0e3))
* coverage count ([f32ddc9](https://github.com/embark-framework/embark/commit/f32ddc9))
* deploy hangs ([92610ed](https://github.com/embark-framework/embark/commit/92610ed))
* handle contracts being removed ([485b8ef](https://github.com/embark-framework/embark/commit/485b8ef)), closes [#1077](https://github.com/embark-framework/embark/issues/1077)
* open/close aside container ([7728c54](https://github.com/embark-framework/embark/commit/7728c54))
* **ui:** white screen on text editor ([10caddd](https://github.com/embark-framework/embark/commit/10caddd))
* **whisper:** fix disabling whisper crashing blockchain ([b48d29a](https://github.com/embark-framework/embark/commit/b48d29a)), closes [#1027](https://github.com/embark-framework/embark/issues/1027)
* runtime environment needs to support locally installed embark ([23f19a0](https://github.com/embark-framework/embark/commit/23f19a0))


### Features

* add CRUD to file explorer ([f82d3de](https://github.com/embark-framework/embark/commit/f82d3de))
* add debug button to transaction and contract log ([184e1e2](https://github.com/embark-framework/embark/commit/184e1e2))
* add new event before build ([db35d7f](https://github.com/embark-framework/embark/commit/db35d7f))
* adds support for swarm imports in Solidity ([62607b0](https://github.com/embark-framework/embark/commit/62607b0)), closes [#766](https://github.com/embark-framework/embark/issues/766)
* Allow parallel deploy ([3406ae8](https://github.com/embark-framework/embark/commit/3406ae8))
* expose dappPath ([5fb687c](https://github.com/embark-framework/embark/commit/5fb687c))
* handle missing directive ([bae3116](https://github.com/embark-framework/embark/commit/bae3116))
* introduce function support for deploy lifecycle hooks ([8b68bec](https://github.com/embark-framework/embark/commit/8b68bec)), closes [#1029](https://github.com/embark-framework/embark/issues/1029)
* **@embark/cli:** add --template option to embark demo cli command ([89e3eb6](https://github.com/embark-framework/embark/commit/89e3eb6))
* permanently save logs/events ([51b8224](https://github.com/embark-framework/embark/commit/51b8224))
* run coverage for bytecode and deployedBytecode ([f84d7f1](https://github.com/embark-framework/embark/commit/f84d7f1))
* strategy for deployment ([f9f4c28](https://github.com/embark-framework/embark/commit/f9f4c28))
* **@embark/cli:** introduce `eject-build-config` alias ([ffb8f54](https://github.com/embark-framework/embark/commit/ffb8f54)), closes [#1121](https://github.com/embark-framework/embark/issues/1121) [#1121](https://github.com/embark-framework/embark/issues/1121)
* **@embark/cli:** repl support inside dashboard ([53780aa](https://github.com/embark-framework/embark/commit/53780aa)), closes [#768](https://github.com/embark-framework/embark/issues/768)
* **@embark/console:** better determine suggestions for any js object not just with the dot.' ([d427e62](https://github.com/embark-framework/embark/commit/d427e62))
* **@embark/console:** determine suggestions automatically for a js object of the type 'command.' ([f206062](https://github.com/embark-framework/embark/commit/f206062))
* **@embark/contracts_manager:** allow ABI definition non-owned contracts ([17cec1b](https://github.com/embark-framework/embark/commit/17cec1b))
* **@embark/plugins:** introduce API to register a contract factory ([90aac83](https://github.com/embark-framework/embark/commit/90aac83)), closes [#1066](https://github.com/embark-framework/embark/issues/1066)
* **@embark/whister:** Add signature and recipient public key to whisper envelope ([46e351e](https://github.com/embark-framework/embark/commit/46e351e))
* **cockpit:** add searching ENS names in search bar ([dca52d0](https://github.com/embark-framework/embark/commit/dca52d0))
* **cockpit:** make editor resizable ([1030607](https://github.com/embark-framework/embark/commit/1030607))
* update to solc 0.5.0 ([45afe83](https://github.com/embark-framework/embark/commit/45afe83))
* **coverage:** count node by line only ([154a4f0](https://github.com/embark-framework/embark/commit/154a4f0))
* **scaffold:** allow association/file ([f68f1fc](https://github.com/embark-framework/embark/commit/f68f1fc))
