var tap = require('tap')
  , fs = require('fs')
  , test = tap.test
  , parse = require('../').parse
  , write = require('../writer');

test("identity ops on normal.sdp", function (t) {
  fs.readFile('./normal.sdp', function (err, sdp) {
    if (err) {
      t.ok(false, "failed to read file:" + err);
      t.end();
      return;
    }
    sdp += '';

    var session = parse(sdp);
    var newsdp = write(session);
    var sessionNew = parse(newsdp);
    
    t.deepEquals(session, sessionNew, "parse ∘ write ∘ parse === parse | normal.sdp");
    // This only tests that (parse ∘ write) == Id on the image of the parse.

    // It also doesn't test if (write ∘ parse) is the identity: which it isnt.
    // Properties may get reordered slightly (up to RFC legality).

    // However: (write ∘ parse) should be the identity on the image of write
    // because our own ordering is deterministic.
    t.equal(newsdp, write(sessionNew), "write ∘ parse === Id on image of write");

    t.end();
  });
});
