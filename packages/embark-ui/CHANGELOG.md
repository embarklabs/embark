# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
