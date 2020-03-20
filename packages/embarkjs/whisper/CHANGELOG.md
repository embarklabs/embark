# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.3.0-nightly.11](https://github.com/embarklabs/embark/compare/v5.3.0-nightly.10...v5.3.0-nightly.11) (2020-03-20)

**Note:** Version bump only for package embarkjs-whisper





# [5.3.0-nightly.4](https://github.com/embarklabs/embark/compare/v5.3.0-nightly.3...v5.3.0-nightly.4) (2020-03-05)

**Note:** Version bump only for package embarkjs-whisper





## [5.2.3](https://github.com/embarklabs/embark/compare/v5.2.3-nightly.1...v5.2.3) (2020-02-25)


### Bug Fixes

* ensure that packages properly specify their dependencies ([3693ebd](https://github.com/embarklabs/embark/commit/3693ebd))





## [5.1.1](https://github.com/embarklabs/embark/compare/v5.1.1-nightly.4...v5.1.1) (2020-02-03)

**Note:** Version bump only for package embarkjs-whisper





## [5.1.1-nightly.2](https://github.com/embarklabs/embark/compare/v5.1.1-nightly.1...v5.1.1-nightly.2) (2020-01-31)

**Note:** Version bump only for package embarkjs-whisper





# [5.1.0](https://github.com/embarklabs/embark/compare/v5.1.0-nightly.6...v5.1.0) (2020-01-27)

**Note:** Version bump only for package embarkjs-whisper





# [5.1.0-nightly.1](https://github.com/embarklabs/embark/compare/v5.1.0-nightly.0...v5.1.0-nightly.1) (2020-01-20)


### Features

* support Node.js v12.x and newer ([c093cf8](https://github.com/embarklabs/embark/commit/c093cf8))





# [5.1.0-nightly.0](https://github.com/embarklabs/embark/compare/v5.0.0...v5.1.0-nightly.0) (2020-01-17)

**Note:** Version bump only for package embarkjs-whisper





# [5.0.0](https://github.com/embarklabs/embark/compare/v5.0.0-beta.0...v5.0.0) (2020-01-07)

**Note:** Version bump only for package embarkjs-whisper





# [5.0.0-alpha.9](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.8...v5.0.0-alpha.9) (2019-12-20)


### Build System

* **deps:** bump web3[-*] from 1.2.1 to 1.2.4 ([7e550f0](https://github.com/embarklabs/embark/commit/7e550f0))


### BREAKING CHANGES

* **deps:** bump embark's minimum supported version of parity from
`>=2.0.0` to `>=2.2.1`. This is necessary since web3 1.2.4 makes use of the
`eth_chainId` RPC method (EIP 695) and that parity version is the earliest one
to implement it.

[bug]: https://github.com/ethereum/web3.js/issues/3283





# [5.0.0-alpha.5](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.4...v5.0.0-alpha.5) (2019-12-16)

**Note:** Version bump only for package embarkjs-whisper





# [5.0.0-alpha.2](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.1...v5.0.0-alpha.2) (2019-12-05)

**Note:** Version bump only for package embarkjs-whisper





# [5.0.0-alpha.1](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.0...v5.0.0-alpha.1) (2019-11-05)

**Note:** Version bump only for package embarkjs-whisper





# [5.0.0-alpha.0](https://github.com/embarklabs/embark/compare/v4.1.1...v5.0.0-alpha.0) (2019-10-28)


### Build System

* bump all packages' engines settings ([#1985](https://github.com/embarklabs/embark/issues/1985)) ([ed02cc8](https://github.com/embarklabs/embark/commit/ed02cc8))


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

**Note:** Version bump only for package embarkjs-whisper





# [4.1.0](https://github.com/embarklabs/embark/compare/v4.1.0-beta.6...v4.1.0) (2019-08-12)

**Note:** Version bump only for package embarkjs-whisper





# [4.1.0-beta.6](https://github.com/embarklabs/embark/compare/v4.1.0-beta.5...v4.1.0-beta.6) (2019-08-09)

**Note:** Version bump only for package embarkjs-whisper





# [4.1.0-beta.3](https://github.com/embarklabs/embark/compare/v4.1.0-beta.2...v4.1.0-beta.3) (2019-06-07)


### Bug Fixes

* **@embarkjs/whisper:** don't rely on global EmbarkJS in whisper APIs ([f2903e7](https://github.com/embarklabs/embark/commit/f2903e7)), closes [/github.com/embarklabs/embark/blob/ac76a40a6156603fa436f1fe173835cff5fb0c3d/packages/embarkjs-whisper/src/index.js#L43-L62](https://github.com//github.com/embarklabs/embark/blob/ac76a40a6156603fa436f1fe173835cff5fb0c3d/packages/embarkjs-whisper/src/index.js/issues/L43-L62) [/github.com/embarklabs/embark/blob/ac76a40a6156603fa436f1fe173835cff5fb0c3d/packages/embarkjs-whisper/src/index.js#L64-L73](https://github.com//github.com/embarklabs/embark/blob/ac76a40a6156603fa436f1fe173835cff5fb0c3d/packages/embarkjs-whisper/src/index.js/issues/L64-L73) [/github.com/embarklabs/embark/blob/ac76a40a6156603fa436f1fe173835cff5fb0c3d/packages/embark-code-runner/src/index.ts#L33](https://github.com//github.com/embarklabs/embark/blob/ac76a40a6156603fa436f1fe173835cff5fb0c3d/packages/embark-code-runner/src/index.ts/issues/L33)





# [4.1.0-beta.2](https://github.com/embarklabs/embark/compare/v4.1.0-beta.1...v4.1.0-beta.2) (2019-05-22)

**Note:** Version bump only for package embarkjs-whisper





# [4.1.0-beta.1](https://github.com/embarklabs/embark/compare/v4.1.0-beta.0...v4.1.0-beta.1) (2019-05-15)

**Note:** Version bump only for package embarkjs-whisper





# [4.1.0-beta.0](https://github.com/embarklabs/embark/compare/v4.0.0...v4.1.0-beta.0) (2019-04-17)

**Note:** Version bump only for package embarkjs-whisper
