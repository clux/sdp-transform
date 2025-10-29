# SDP Transform

[![npm status](http://img.shields.io/npm/v/sdp-transform.svg)](https://www.npmjs.org/package/sdp-transform)
[![CI](https://github.com/clux/sdp-transform/actions/workflows/ci.yml/badge.svg)](https://github.com/clux/sdp-transform/actions/workflows/sdp-transform.yml)
[![codecov](https://codecov.io/gh/clux/sdp-transform/graph/badge.svg?token=OqDbVhIP3f)](https://codecov.io/gh/clux/sdp-transform)

A simple parser and writer of SDP written in TypeScript. Defines internal grammar based on [RFC4566 - SDP](http://tools.ietf.org/html/rfc4566), [RFC5245 - ICE](http://tools.ietf.org/html/rfc5245), and many more.

For simplicity it will force values that are integers to integers and leave everything else as strings when parsing. The module should be simple to extend or build upon, and is constructed rigorously.

## Installation

```sh
npm install sdp-transform
```

## Usage

Load it using ES6 or CommonJS syntax:

```js
// ES6
import * as sdpTransform from 'sdp-transform';

// CommonJS
const sdpTransform = require('sdp-transform');
```

Main exported functions are:

- `parse()`: Parses the given unprocessed SDP string.
- `write()`: Serializes the given session description object into a SDP string.

Extra helpers for parsing:

- `parseParams()`
- `parsePayloads()`
- `parseSimulcast()`
- `parseImageAttributes()`
- `parseRemoteCandidates()`

## API documentation

Check the full API documentation: https://clux.github.io/sdp-transform

## Development

- `npm run typescript:build`: Transpiles TypeScript code in `src/` to JavaScript code in `lib/`.
- `npm run typescript:watch`: The same, but in live mode.
- `npm run lint`: ESLint and Prettier checks.
- `npm run format`: Fixes Prettier issues.
- `npm run test`: Runs tests. No need to transpile TypeScript to JavaScript first.
- `npm run coverage`: Runs tests and generates test coverage output in `coverage/` folder.
- `npm run docs`: Generates API documentation in HTML in `docs/` folder using [TypeDoc](https://typedoc.org).
- `npm run docs:watch`: The same, but in live mode.
- `npm run docs:check`: Checks if TypeDoc configuration and TypeDoc documentation in TypeScript source files are correct (used in GitHub CI actions).

## Author

Eirik Albrigtsen
[[website](https://clux.dev)|[github](https://github.com/clux)]

## License

MIT-Licensed. See [LICENSE.md](./LICENSE.md) file for details.
