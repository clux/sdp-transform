#!/usr/bin/env node

var transform = require('./');
var file = require('path').join(process.cwd(), process.argv[2]);

console.log('Verifying:', file + ':\n');
var sdp = require('fs').readFileSync(file).toString();

var parsed = transform.parse(sdp);
var written = transform.write(parsed);

var writtenLines = written.split('\r\n');
var origLines = sdp.split('\r\n');

var numMissing = 0;
origLines.forEach(function (line, i) {
  if (writtenLines.indexOf(line) < 0) {
    console.error('l' + i + ' lost (' + line + ')');
    numMissing = 0;
  }
});

var numNew = 0;
writtenLines.forEach(function (line, i) {
  if (origLines.indexOf(line) < 0) {
    console.error('l' + i + ' new (' + line + ')');
    numNew += 1;
  }
});

var failed = (numMissing === 0 && numNew === 0);
if (failed) {
  console.log('\nVerified');
}
else {
  console.log('\nSome mismatches:', numMissing, 'missing,', numNew, 'new');
}
process.exit(failed ? 0 : 1);
