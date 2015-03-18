var fs = require('fs')
  , main = require(process.env.SDP_TRANSFORM_COV ? '../lib-cov' : '../')
  , parse = main.parse
  , write = main.write;

var verifyCoverage = function (file, t) {
  fs.readFile(__dirname + '/' + file, function (err, sdp) {
    if (err) {
      t.ok(false, "failed to read file:" + err);
      return t.done();
    }
    sdp += '';

    var obj = parse(sdp);
    obj.media.forEach(function (m) {
      t.ok(!m.invalid, "no invalids in " + file + " at m=" + m.type);
      if (Array.isArray(m.invalid)) {
        t.deepEqual(m.invalid, [], "no invalids in " + file + " at m=" + m.type);
      }
    });
    t.done();
  })
};

exports.normalCoverage = function (t) {
  verifyCoverage('normal.sdp', t);
};

exports.chromeCoverage = function (t) {
  verifyCoverage('chrome.sdp', t);
};

exports.jssipCoverage = function (t) {
  verifyCoverage('jssip.sdp', t);
};

exports.jsepCoverage = function (t) {
  verifyCoverage('jsep.sdp', t);
};
