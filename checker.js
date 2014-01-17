#!/usr/bin/env node

var transform = require('./')
  , file = require('path').join(process.cwd(), process.argv[2])
  , sdp = require('fs').readFileSync(file).toString()
  , parsed = transform.parse(sdp)
  , written = transform.write(parsed)
  , writtenLines = written.split('\r\n')
  , origLines = sdp.split('\r\n')
  , numMissing = 0
  , numNew = 0
  ;


origLines.forEach(function (line, i) {
  if (writtenLines.indexOf(line) < 0) {
    console.error('l' + i + ' lost (' + line + ')');
    numMissing += 1;
  }
});

writtenLines.forEach(function (line, i) {
  if (origLines.indexOf(line) < 0) {
    console.error('l' + i + ' new (' + line + ')');
    numNew += 1;
  }
});

var failed = (numMissing > 0 || numNew > 0);
if (failed) {
  console.log('\n' + file + ' changes during transform:');
  console.log(numMissing + ' missing lines, ' + numNew + ' new lines')
}
else {
  console.log(file + ' verified');
}
process.exit(failed ? 1 : 0);
