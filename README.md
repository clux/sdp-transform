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

## Author

Eirik Albrigtsen
[[website](https://clux.dev)|[github](https://github.com/clux)]

## License

MIT-Licensed. See [LICENSE.md](./LICENSE.md) file for details.
