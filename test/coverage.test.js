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

var sdps = [
  'normal.sdp',
  'hacky.sdp',
  'jssip.sdp',
  'jsep.sdp',
  //'alac.sdp', // deliberate invalids
  //'onvif.sdp', // SHOULD PASS
  'ssrc.sdp',
];

sdps.forEach((name) => {
  test(name.split('.')[0] + 'Coverage', function *(t) {
    yield verifyCoverage(name, t);
  });
});
