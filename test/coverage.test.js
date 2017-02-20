var fs = require('co-fs')
  , test = require('bandage')
  , main = require('..')
  , parse = main.parse
  ;

var verifyCoverage = function *(file, t) {
  var sdp = yield fs.readFile(__dirname + '/' + file, 'utf8');
  var obj = parse(sdp);
  obj.media.forEach(function (m) {
    t.ok(!m.invalid, 'no invalids in ' + file + ' at m=' + m.type);
    if (Array.isArray(m.invalid)) {
      t.deepEqual(m.invalid, [], 'no invalids in ' + file + ' at m=' + m.type);
    }
  });
};

test('normalCoverage', function *(t) {
  yield verifyCoverage('normal.sdp', t);
});

test('chromeCoverage', function *(t) {
  yield verifyCoverage('hacky.sdp', t);
});

test('jssipCoverage', function *(t) {
  yield verifyCoverage('jssip.sdp', t);
});

test('jsepCoverage', function *(t) {
  yield verifyCoverage('jsep.sdp', t);
});

test('ssrcCoverage', function *(t) {
  yield verifyCoverage('ssrc.sdp', t);
});
