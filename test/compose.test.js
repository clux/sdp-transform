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

test('normalCompose', function *(t) {
  yield verifyCompose('normal.sdp', t);
});

test('chromeCompose', function *(t) {
  yield verifyCompose('hacky.sdp', t);
});

test('jssipCompose', function *(t) {
  yield verifyCompose('jssip.sdp', t);
});

test('jsepCompose', function *(t) {
  yield verifyCompose('jsep.sdp', t);
});

test('alacCompose', function *(t) {
  yield verifyCompose('alac.sdp', t);
});

test('onvifCompose', function *(t) {
  yield verifyCompose('onvif.sdp', t);
});

test('ssrcCompose', function *(t) {
  yield verifyCompose('ssrc.sdp', t);
});
