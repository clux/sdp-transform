var fs = require('fs')
  , main = require(process.env.SDP_TRANSFORM_COV ? '../lib-cov' : '../')
  , parse = main.parse
  , write = main.write;

exports.normalCompose = function (t) {
  fs.readFile(__dirname + '/normal.sdp', function (err, sdp) {
    if (err) {
      t.ok(false, "failed to read file:" + err);
      t.done();
      return;
    }
    sdp += '';

    var session = parse(sdp);
    var newsdp = write(session);
    var sessionNew = parse(newsdp);

    t.deepEqual(session, sessionNew, "parse ∘ write ∘ parse === parse | normal.sdp");
    // This only tests that (parse ∘ write) == Id on the image of the parse.

    // It also doesn't test if (write ∘ parse) is the identity: which it isnt.
    // Properties may get reordered slightly (up to RFC legality).

    // However: (write ∘ parse) should be the identity on the image of write
    // because our own ordering is deterministic.
    t.equal(newsdp, write(sessionNew), "write ∘ parse === Id on image of write");

    t.done();
  });
};

exports.chromeCompose = function (t) {
  fs.readFile(__dirname + '/chrome.sdp', function (err, sdp) {
    if (err) {
      t.ok(false, "failed to read file:" + err);
      t.done();
      return;
    }
    sdp += '';

    var session = parse(sdp);
    var newsdp = write(session);
    var sessionNew = parse(newsdp);

    t.deepEqual(session, sessionNew, "parse ∘ write ∘ parse === parse | chrome.sdp");
    t.equal(newsdp, write(sessionNew), "write ∘ parse === Id on image of write");

    t.done();
  });
};

exports.jssipCompose = function (t) {
  fs.readFile(__dirname + '/jssip.sdp', function (err, sdp) {
    if (err) {
      t.ok(false, "failed to read file:" + err);
      t.done();
      return;
    }
    sdp += '';

    var session = parse(sdp);
    var newsdp = write(session);
    var sessionNew = parse(newsdp);

    t.deepEqual(session, sessionNew, "parse ∘ write ∘ parse === parse | jssip.sdp");
    t.equal(newsdp, write(sessionNew), "write ∘ parse === Id on image of write");

    t.done();
  });
};
