# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.0.0-alpha.1](https://github.com/embark-framework/embark/compare/v5.0.0-alpha.0...v5.0.0-alpha.1) (2019-11-05)


### Bug Fixes

* **@cockpit/dashboard:** "Deployed Contracts" should auto-update after deployment ([#2020](https://github.com/embark-framework/embark/issues/2020)) ([1a43dca](https://github.com/embark-framework/embark/commit/1a43dca))





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

**Note:** Version bump only for package embark-ui





# [4.1.0](https://github.com/embark-framework/embark/compare/v4.1.0-beta.6...v4.1.0) (2019-08-12)

**Note:** Version bump only for package embark-ui





# [4.1.0-beta.6](https://github.com/embark-framework/embark/compare/v4.1.0-beta.5...v4.1.0-beta.6) (2019-08-09)


### Bug Fixes

* **@embark/ui:** fix errorEntities not working at all ([5ab4c22](https://github.com/embark-framework/embark/commit/5ab4c22))





# [4.1.0-beta.5](https://github.com/embark-framework/embark/compare/v4.1.0-beta.4...v4.1.0-beta.5) (2019-07-10)


### Bug Fixes

* **@cockpit:** don't send invalid value to Smart Contract methods ([3f77272](https://github.com/embark-framework/embark/commit/3f77272))
* **@cockpit/debugger:** check if `debuggingContract` is undefined ([3590197](https://github.com/embark-framework/embark/commit/3590197))
* **@cockpit/explorers:** consistently display "Mined on" timestamps ([52d54f0](https://github.com/embark-framework/embark/commit/52d54f0))


### Features

* **@cockpit:** Pass tx value as wei and add validation ([536a402](https://github.com/embark-framework/embark/commit/536a402))
* **@embark/ui:** sort contracts and functions alphabetically ([0e9a4a1](https://github.com/embark-framework/embark/commit/0e9a4a1))





# [4.1.0-beta.4](https://github.com/embark-framework/embark/compare/v4.1.0-beta.3...v4.1.0-beta.4) (2019-06-27)


### Bug Fixes

* **@cockpit/utils:** Ensure whisper channels are at least 4 characters long ([610d8f1](https://github.com/embark-framework/embark/commit/610d8f1))





# [4.1.0-beta.3](https://github.com/embark-framework/embark/compare/v4.1.0-beta.2...v4.1.0-beta.3) (2019-06-07)


### Bug Fixes

* **@cockpit/explorer:** slice contract function result string only if starts/ends with double-quote ([ac76a40](https://github.com/embark-framework/embark/commit/ac76a40)), closes [#1636](https://github.com/embark-framework/embark/issues/1636)


### Features

* **@cockpit/explorer:** enable users to send ether through payable methods ([#1649](https://github.com/embark-framework/embark/issues/1649)) ([d10c0b7](https://github.com/embark-framework/embark/commit/d10c0b7))





# [4.1.0-beta.2](https://github.com/embark-framework/embark/compare/v4.1.0-beta.1...v4.1.0-beta.2) (2019-05-22)


### Bug Fixes

* **@cockpit/utils:** properly detect if ENS is enabled ([7a0609b](https://github.com/embark-framework/embark/commit/7a0609b))
* **@cockpit/whisper:** ensure message subscription call is working ([2c6c948](https://github.com/embark-framework/embark/commit/2c6c948))





# [4.1.0-beta.1](https://github.com/embark-framework/embark/compare/v4.1.0-beta.0...v4.1.0-beta.1) (2019-05-15)


### Features

* **@embark/api:** Add command `service api on/off` ([634feb5](https://github.com/embark-framework/embark/commit/634feb5))





# [4.1.0-beta.0](https://github.com/embark-framework/embark/compare/v4.0.0...v4.1.0-beta.0) (2019-04-17)


### Bug Fixes

* **@cockpit/deployment:** Check if contracts deployed when connected to metamask ([c233163](https://github.com/embark-framework/embark/commit/c233163))
* **@cockpit/services:** send only process names to embark-api-client ([eb9de68](https://github.com/embark-framework/embark/commit/eb9de68))


### Features

* **@cockpit:** implement pagination for contracts ([d71352b](https://github.com/embark-framework/embark/commit/d71352b))
* **@cockpit/editor:** Make tabs draggable ([f27cde9](https://github.com/embark-framework/embark/commit/f27cde9))
* **@cockpit/explorer:** display truncated account balances ([6b2dc95](https://github.com/embark-framework/embark/commit/6b2dc95))
* **@cockpit/explorer:** implement pagination for accounts explorer ([745edaf](https://github.com/embark-framework/embark/commit/745edaf))
* **@embark/proxy:** Add dev tx to proxy when request fails to get response ([36be50e](https://github.com/embark-framework/embark/commit/36be50e))





## [4.0.1](https://github.com/embark-framework/embark/compare/v4.0.0...v4.0.x) (2019-03-26)

**Note:** Version bump only for package embark-ui





# [4.0.0](https://github.com/embark-framework/embark/compare/v4.0.0-beta.2...v4.0.0) (2019-03-18)


### Bug Fixes

* **embark-ui:** don't show debug button for txs of silent contracts ([5161f54](https://github.com/embark-framework/embark/commit/5161f54))





# [4.0.0-beta.2](https://github.com/embark-framework/embark/compare/v4.0.0-beta.1...v4.0.0-beta.2) (2019-03-18)


### Bug Fixes

* typed commands in console ([9d34355](https://github.com/embark-framework/embark/commit/9d34355))
* **embark-ui:** detect fallback functions in the contracts explorer ([832f16a](https://github.com/embark-framework/embark/commit/832f16a))





# [4.0.0-beta.1](https://github.com/embark-framework/embark/compare/v4.0.0-beta.0...v4.0.0-beta.1) (2019-03-18)


### Bug Fixes

* **@embark/cockpit:** Fix decode transaction error ([f957ba5](https://github.com/embark-framework/embark/commit/f957ba5))
* **@embark/cockpit:** Switching between tabs resets logs ([a6b15ae](https://github.com/embark-framework/embark/commit/a6b15ae))
* **@embark/cockpit:** Utils/Communications handle enter ([8b7a374](https://github.com/embark-framework/embark/commit/8b7a374))
* **@embark/core:** Metamask + geth warning to enable regular txs ([c233dbc](https://github.com/embark-framework/embark/commit/c233dbc))
* **@embark/core:** Prevent unnecessary re-renderings ([128ecd4](https://github.com/embark-framework/embark/commit/128ecd4))
* **cockpit:** fix converter inputs and copy-button position ([35648ee](https://github.com/embark-framework/embark/commit/35648ee))
* **cockpit:editor:** fix arrow not turning ([359c28f](https://github.com/embark-framework/embark/commit/359c28f))
* **cockpit/console:** increase number of suggestions ([71da423](https://github.com/embark-framework/embark/commit/71da423))
* **cockpit/console:** replace br with backslash n ([a341a4f](https://github.com/embark-framework/embark/commit/a341a4f))
* **cockpit/contract:** remove contract profiling and use functions ([99dcd78](https://github.com/embark-framework/embark/commit/99dcd78))
* **cockpit/sidebar:** fix closed sidebar in the dark-theme ([5816a79](https://github.com/embark-framework/embark/commit/5816a79))
* editor wasn't saving changes ([4340a9b](https://github.com/embark-framework/embark/commit/4340a9b))
* **cockpit/deployment:** filter out silent contracts ([da76c8d](https://github.com/embark-framework/embark/commit/da76c8d))
* **cockpit/editor:** add delete modal to confirm deletion ([3f488e1](https://github.com/embark-framework/embark/commit/3f488e1))
* **cockpit/editor:** remove delay on tooltips ([c30c420](https://github.com/embark-framework/embark/commit/c30c420))
* **cockpit/estimator:** make estimator clearer ([1759aac](https://github.com/embark-framework/embark/commit/1759aac))
* **cockpit/firefox:** fix bug with entities in firefox (ordering) ([dddc9d0](https://github.com/embark-framework/embark/commit/dddc9d0))
* **cockpit/header:** fix nav not highlighted for children pages ([0648824](https://github.com/embark-framework/embark/commit/0648824))
* **cockpit/transactions:** enable filtering constructor ([447f3ed](https://github.com/embark-framework/embark/commit/447f3ed))
* **cockpit/transactions:** fix a typo in the transactions page ([cba7c85](https://github.com/embark-framework/embark/commit/cba7c85))
* **embark-ui:** AccountContainer should get txs for cold load case ([fd79090](https://github.com/embark-framework/embark/commit/fd79090))
* **embark-ui:** correctly calculate which blocks to display ([cc8363a](https://github.com/embark-framework/embark/commit/cc8363a))
* **embark-ui:** correctly calculate which transactions to display ([fbeea47](https://github.com/embark-framework/embark/commit/fbeea47))
* **embark-ui:** pagination ([f5f610d](https://github.com/embark-framework/embark/commit/f5f610d))
* **embark-ui:** specify PUBLIC_URL=/ for production builds ([f4626f8](https://github.com/embark-framework/embark/commit/f4626f8)), closes [/github.com/facebook/create-react-app/blob/master/packages/react-scripts/config/paths.js#L36](https://github.com//github.com/facebook/create-react-app/blob/master/packages/react-scripts/config/paths.js/issues/L36)
* cockpit search with tx hash shows tx page ([#1386](https://github.com/embark-framework/embark/issues/1386)) ([891174e](https://github.com/embark-framework/embark/commit/891174e))
* format \n as <br> in cockpit console ([#1385](https://github.com/embark-framework/embark/issues/1385)) ([58ab76d](https://github.com/embark-framework/embark/commit/58ab76d))
* limit cockpit editor file size ([f12ca22](https://github.com/embark-framework/embark/commit/f12ca22))
* pressing enter on "Display additional results" does the expected thing ([2cc0d30](https://github.com/embark-framework/embark/commit/2cc0d30))
* upgrade packages with vulnerabilities ([#1388](https://github.com/embark-framework/embark/issues/1388)) ([913b4e1](https://github.com/embark-framework/embark/commit/913b4e1))
* validate whisper channel name in communication tab ([616af6d](https://github.com/embark-framework/embark/commit/616af6d))


### Features

* **cockpit/console:** display cmds from cockpit in embark console ([e339641](https://github.com/embark-framework/embark/commit/e339641))
* **cockpit/contracts:** don't display contracts marked as silent ([0e63d6b](https://github.com/embark-framework/embark/commit/0e63d6b))
* **cockpit/editor:** add status messages for file operations ([ecdfd47](https://github.com/embark-framework/embark/commit/ecdfd47))
* add repository.directory field to package.json ([a9c5e1a](https://github.com/embark-framework/embark/commit/a9c5e1a))
* **cockpit/transaction:** display a link for contracts and accounts ([74847ee](https://github.com/embark-framework/embark/commit/74847ee))
* **ui:** color console item info as success ([193abd4](https://github.com/embark-framework/embark/commit/193abd4))
* **ui:** keep state in frame ([cd32630](https://github.com/embark-framework/embark/commit/cd32630))
* normalize README and package.json bugs, homepage, description ([5418f16](https://github.com/embark-framework/embark/commit/5418f16))
