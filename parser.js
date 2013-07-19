var r = {
  line : /^([a-z])=(.*)/,
  //c=IN IP4 10.47.197.26
  cIp: /^IN IP(\d) (.*)/,
  //b=AS:4000
  bLine: /(TIAS|AS|CT)\:(\d*)/,
  //m=video 51744 RTP/AVP 126 97 98 34 31
  mRtp: /(\w*) (\d{4,5}) RTP\/(S?)AVP(F?) (.*)/,
  //a=rtpmap:110 MP4A-LATM/90000
  aRtp: /^rtpmap\:(\d*) (\w*)\/(\d*)/,
  //a=fmtp:108 profile-level-id=24;object=23;bitrate=64000
  aFmtp: /^fmtp\:(\d*) (.*)/,
  //a=setup:actpass
  aSetup: /^setup\:(\w*)/,
  //a=mid:1
  aMid: /^mid\:(\d*)/,
  //a=sendrecv
  aSendRecv: /^(sendrecv|recvonly|sendonly|inactive)/,
  //a=fingerprint:SHA-1 00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33
  aFinger: /^fingerprint\:(\S*) (.*)/,
  //a=ice-ufrag:F7gI
  aIceUfrag: /^ice\-ufrag\:(.*)/,
  //a=ice-pwd:x9cml/YzichV2+XlhiMu8g
  aIcePwd: /^ice\-pwd\:(.*)/,
  //a=candidate:0 1 UDP 2113667327 203.0.113.1 54400 typ host
  aCandidate: /^candidate:(\S*) (\d*) (\S*) (\d*) (\S*) (\d*) typ (\S*)/
};

// fmtpConfigs are parsed to an object where all values are left as strings
// unless they clearly are integers
var fmtpReducer = function (acc, expr) {
  var s = expr.split('=');
  if (s.length === 2) {
    acc[s[0]] = String(Number(s[1])) === s[1] ? Number(s[1]) : s[1];
  }
  return acc;
};

var parse = function (sdp) {
  var lines = sdp.split('\n');

  // keep track of which mLine we are in
  var mLines = [];
  var mLineIdx = -1; // by default not inside any mLine

  var meta = {ice: {}}; // meta data not related to an m-line

  for (var i = 0; i < lines.length; i += 1) {
    var l = lines[i];
    if (!r.line.test(l)) {
      continue; // skip lines we dont understand
    }
    var match = l.match(r.line);

    var content = match[2]; // everything to the left of the equals
    switch (match[1]) {
      // skip these header ones for now
    case "v": // protocol version
    case "s":
      break;
    case "t":
      break;
    case "i": // session information || media information
      var savePt = (mLineIdx < 0) ? meta : mLines[mLineIdx];
      savePt.information = content;
      break;
    case "o": // session identifier
      meta.identifier = content;
      break;
    case "b":
      if (r.bLine.test(content)) {
        var bMatch = content.match(r.bLine);
        var savePt = (mLineIdx < 0) ? meta : mLines[mLineIdx];
        savePt.bandwidth = {
          type: bMatch[1],
          bandwidth: bMatch[2] | 0
        };
      }
      break; // bandwidth TODO!

    case "m":  // actual media
      if (r.mRtp.test(content)) {
        mLineIdx += 1;
        var mMatch = content.match(r.mRtp);
        mLines.push({
          type: mMatch[1], // audio/video/application/..
          port: mMatch[2] | 0,
          encrypted: !!mMatch[3], // true => required
          feedback: !!mMatch[4], // may be false but still use rtcp feedback..
          maps: mMatch[5].split(' ').map(Number),
          rtpMaps: [],
          fmtpMaps: [],
          ice: {
            candidates: []
          }
        });
      }
      break;
    case "a":
      // (potentially) global properties
      if (r.aIcePwd.test(content)) {
        var aMatch = content.match(r.aIcePwd);
        var savePt = (mLineIdx < 0) ? meta : mLines[mLineIdx];
        savePt.ice.pwd = aMatch[1];
      }
      else if (r.aIceUfrag.test(content)) {
        var aMatch = content.match(r.aIceUfrag);
        var savePt = (mLineIdx < 0) ? meta : mLines[mLineIdx];
        savePt.ice.ufrag = aMatch[1];
      }

      if (mLineIdx < 0) {
        continue;
      }

      if (r.aCandidate.test(content)) { // TODO: verify these are m-line only
        var aMatch = content.match(r.aCandidate);
        mLines[mLineIdx].ice.candidates.push({
          foundation: aMatch[1],
          component: aMatch[2] | 0,
          transport: aMatch[3],
          priority: aMatch[4] | 0,
          ip: aMatch[5],
          port: aMatch[6] | 0,
          type: aMatch[7]
        });
      }

      // properties affecting the current m-line
      if (r.aRtp.test(content)) {
        var aMatch = content.match(r.aRtp);
        // add the rtpmap if it was advertised in the main m-line
        if (mLines[mLineIdx].maps.indexOf(aMatch[1] | 0) >= 0) {
          mLines[mLineIdx].rtpMaps.push({
            payload: aMatch[1] | 0,
            codec: aMatch[2],
            rate: aMatch[3] | 0
          });
        }
      }
      else if (r.aFmtp.test(content)) {
        var aMatch = content.match(r.aFmtp);
        if (mLines[mLineIdx].maps.indexOf(aMatch[1] | 0) >= 0) {
          mLines[mLineIdx].fmtpMaps.push({
            payload: aMatch[1] | 0,
            config: aMatch[2].split(';').reduce(fmtpReducer, {})
          });
        }
      }
      else if (r.aMid.test(content)) {
        var aMatch = content.match(r.aMid);
        mLines[mLineIdx].mid = aMatch[1] | 0;
      }
      else if (r.aSetup.test(content)) {
        var aMatch = content.match(r.aSetup);
        mLines[mLineIdx].setup = aMatch[1];
      }
      else if (r.aFinger.test(content)) {
        var aMatch = content.match(r.aFinger);
        mLines[mLineIdx].encryption = {
          type: aMatch[1],
          fingerprint: aMatch[2]
        };
      }
      else if (r.aSendRecv.test(content)) {
        var aMatch = content.match(r.aSendRecv);
        mLines[mLineIdx].sendrecv = aMatch[1];
      }
      break;

    case "c": // connection info (could be global or under an m-line)
      if (r.cIp.test(content)) {
        var ipMatch = content.match(r.cIp);
        // NB: ipMatch[1] | 0 is IP version
        var savePt = (mLineIdx < 0) ? meta : mLines[mLineIdx];
        savePt.connection = ipMatch[2];
      }
      break;
    default:
      // fine as long as kept in sync with r.line
      throw new Error("unimplemented line type");
    }
  }

  return {
    meta: meta,
    media: mLines
  };
};

module.exports = parse;

if (module === require.main) {
  var fs = require('fs');
  var sdp = fs.readFileSync('./test/normal.sdp')+'';
  var res = parse(sdp);
  console.log(res.meta);
  console.log(res.media);
}
