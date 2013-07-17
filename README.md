# SDP Parser [![Build Status](https://secure.travis-ci.org/clux/sdp-parser.png)](http://travis-ci.org/clux/sdp-parser)
A simple parser of SDP. Just because. Cool to try. Easy to extend. Good starting point.

## Usage
Require it and pass it an unprocessed SDP string.

```js
var parse = require('sdp-parser');
var sdp = "c=IN IP4 0.0.0.0\no=hi there";
parse(sdp);

{ meta: 
   { connection: '0.0.0.0',
     identifier: 'hi there' },
  media: [] }
```

## Installation

```bash
$ npm install sdp-parser
```

## License
MIT-Licensed. See LICENSE file for details.
