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
  'icelite.sdp',
  'jssip.sdp',
  'jsep.sdp',
  // 'alac.sdp', // deliberate invalids
  'onvif.sdp',
  'ssrc.sdp',
  'simulcast.sdp',
  'st2022-6.sdp',
  // 'st2110-20.sdp', // deliberate invalids
  'sctp-dtls-26.sdp',
  'extmap-encrypt.sdp',
  'dante-aes67.sdp',
  'bfcp.sdp',
  'tcp-active.sdp',
  'tcp-passive.sdp',
  'mediaclk-avbtp.sdp',
  'mediaclk-ptp-v2-w-rate.sdp',
  'mediaclk-ptp-v2.sdp',
  'mediaclk-rtp.sdp',
  'ts-refclk-media.sdp',
  'ts-refclk-sess.sdp'
];

sdps.forEach((name) => {
  test(name.split('.')[0] + 'Coverage', function *(t) {
    yield verifyCoverage(name, t);
  });
});
