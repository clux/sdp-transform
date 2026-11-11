var fs = require('co-fs')
  , test = require('bandage')
  , main = require('..')
  , parse = main.parse
  , write = main.write
  ;

var verifyCompose = function *(file, t) {
  var sdp = yield fs.readFile(__dirname + '/' + file, 'utf8');

  var obj = parse(sdp);
  var sdp2 = write(obj);
  var obj2 = parse(sdp2);

  t.deepEqual(obj, obj2, 'parse ∘ write ∘ parse === parse | ' + file);
  // This only tests that (parse ∘ write) == Id on the image of the parse.

  // It also doesn't test if (write ∘ parse) is the identity: which it isnt.
  // Properties may get reordered slightly (up to RFC legality).

  // However: (write ∘ parse) should be the identity on the image of write
  // because our own ordering is deterministic.
  t.equal(sdp2, write(obj2), 'write ∘ parse === Id on Im(write) for ' + file);
};

var sdps = [
  'normal.sdp',
  'hacky.sdp',
  'icelite.sdp',
  'invalid.sdp',
  'jssip.sdp',
  'jsep.sdp',
  'alac.sdp',
  'onvif.sdp',
  'ssrc.sdp',
  'simulcast.sdp',
  'st2022-6.sdp',
  'st2110-20.sdp',
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
  'ts-refclk-sess.sdp',
  'rtcp-fb.sdp'
];

sdps.forEach((name) => {
  test(name.split('.')[0] + 'Compose', function *(t) {
    yield verifyCompose(name, t);
  });
});

test('candidate optional fields stay aligned', function *(t) {
  yield verifyCompose('candidate-optional.sdp', t);

  var prefix = [
    'v=0',
    'o=- 1 2 IN IP4 127.0.0.1',
    's=-',
    't=0 0',
    'm=audio 9 UDP/TLS/RTP/SAVPF 111'
  ];

  ['udp', 'tcp'].forEach(function (transport) {
    for (var mask = 0; mask < 16; mask += 1) {
      var candidate = 'a=candidate:1 1 ' + transport +
        ' 2113937151 192.0.2.1 5000 typ ' + ((mask & 1) ? 'srflx' : 'host');
      if (mask & 1) {
        candidate += ' raddr 192.0.2.2 rport 6000';
      }
      if (transport === 'tcp') {
        candidate += ' tcptype passive';
      }
      if (mask & 2) {
        candidate += ' generation 0';
      }
      if (mask & 4) {
        candidate += ' network-id 1';
      }
      if (mask & 8) {
        candidate += ' network-cost 10';
      }
      var sdp = prefix.concat(candidate, '').join('\r\n');
      var parsed = parse(sdp);
      var written = write(parsed);
      t.equal(written, sdp, transport + ' optional fields ' + mask);
      t.deepEqual(parse(written), parsed, 'preserves parsed candidate ' + mask);
    }
  });
});
