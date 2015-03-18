var fs = require('fs')
  , main = require(process.env.SDP_TRANSFORM_COV ? '../lib-cov' : '../')
  , parse = main.parse
  , write = main.write;

var verifyCompose = function (file, t) {
  fs.readFile(__dirname + '/' + file, function (err, sdp) {
    if (err) {
      t.ok(false, "failed to read file:" + err);
      return t.done();
    }
    sdp += '';

    var obj = parse(sdp);
    var sdp2 = write(obj);
    var obj2 = parse(sdp2);

    t.deepEqual(obj, obj2, "parse ∘ write ∘ parse === parse | " + file);
    // This only tests that (parse ∘ write) == Id on the image of the parse.

    // It also doesn't test if (write ∘ parse) is the identity: which it isnt.
    // Properties may get reordered slightly (up to RFC legality).

    // However: (write ∘ parse) should be the identity on the image of write
    // because our own ordering is deterministic.
    t.equal(sdp2, write(obj2), "write ∘ parse === Id on Im(write) for " + file);
    t.done();
  })
};

exports.normalCompose = function (t) {
  verifyCompose('normal.sdp', t);
};

exports.chromeCompose = function (t) {
  verifyCompose('chrome.sdp', t);
};

exports.jssipCompose = function (t) {
  verifyCompose('jssip.sdp', t);
};

exports.jsepCompose = function (t) {
  verifyCompose('jsep.sdp', t);
};
