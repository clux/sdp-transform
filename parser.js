var lineReg = /^([a-z])=(.*)/;
var regs = {
  i: [{
      name: 'description',
      reg: /(.*)/
  }],
  o: [{ //o=- 20518 0 IN IP4 203.0.113.1
    name: 'origin',
    reg: /(\S*) (\d*) (\d*) (\S*) IP(\d) (.*)/,
    names: ['username', 'sessionId', 'sessionVersion', 'netType', 'ipVer', 'address']
  }],
  c: [
    { //c=IN IP4 10.47.197.26
      name: 'connection',
      reg: /^IN IP(\d) (.*)/,
      names: ['version', 'ip']
    }
  ],
  b: [
    { //b=AS:4000
      push: 'bandwidth',
      reg: /(TIAS|AS|CT|RR|RS)\:(\d*)/,
      names: ['type', 'limit']
    }
  ],
  m: [
    { //m=video 51744 RTP/AVP 126 97 98 34 31
      //NB: special - can write directly to `location` does not need a 'name'
      // TODO: rtp/fmtp should filter by the payloads found here
      reg: /(\w*) (\d{4,5}) ([A-Z\/]*) (.*)?/,
      names: ['type', 'port', 'protocol', 'payloads']
    }
  ],
  a: [
    // TODO: add a separator somehow to indicate mLine only properties
    { //a=rtpmap:110 MP4A-LATM/90000
      push: 'rtp',
      reg: /^rtpmap\:(\d*) (\w*)\/(\d*)/,
      names: ['payload', 'codec', 'rate']
    },
    { //a=fmtp:108 profile-level-id=24;object=23;bitrate=64000
      push: 'fmtp',
      reg: /^fmtp\:(\d*) (.*)/,
      names: ['payload', 'config']
    },
    { //a=setup:actpass
      name: 'setup',
      reg: /^setup\:(\w*)/
    },
    { //a=mid:1
      name: 'mid',
      reg: /^mid\:(\d*)/,
    },
    { //a=ptime:20
      name: 'ptime',
      reg: /^ptime\:(\d*)/
    },
    { //a=sendrecv
      name: 'sendrecv',
      reg: /^(sendrecv|recvonly|sendonly|inactive)/,
    },
    { //a=fingerprint:SHA-1 00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33
      name: 'fingerprint',
      reg: /^fingerprint\:(\S*) (.*)/,
      names: ['type', 'hash']
    },
    { //a=ice-ufrag:F7gI
      name: 'iceUfrag',
      reg: /^ice\-ufrag\:(.*)/,
    },
    { //a=ice-pwd:x9cml/YzichV2+XlhiMu8g
      name: 'icePwd',
      reg: /^ice\-pwd\:(.*)/,
    },
    // TODO: verify these are m-line only
    { //a=candidate:0 1 UDP 2113667327 203.0.113.1 54400 typ host
      push: 'candidates',
      reg: /^candidate:(\S*) (\d*) (\S*) (\d*) (\S*) (\d*) typ (\S*)/,
      names: ['foundation', 'component', 'transport', 'priority', 'ip', 'port', 'type']
    }
  ]
};

var toIntIfInt = function (v) {
  return String(Number(v)) === v ? Number(v) : v;
};
var fmtpReducer = function (acc, expr) {
  var s = expr.split('=');
  if (s.length === 2) {
    acc[s[0]] = toIntIfInt(s[1]);
  }
  return acc;
};

var attachProperties = function (match, location, names, rawName) {
  if (rawName && !names) {
    location[rawName] = toIntIfInt(match[1]);
  }
  else {
    for (var i = 0; i < names.length; i += 1) {
      location[names[i]] = toIntIfInt(match[i+1]);
    }
  }
};

var parseReg = function (obj, location, content) {
  var needsBlank = obj.name && obj.names;
  if (obj.push && !location[obj.push]) {
    location[obj.push] = [];
  }
  else if (needsBlank && !location[obj.name]) {
    location[obj.name] = {};
  }
  var keyLocation = obj.push ?
    {} :  // blank object that will be pushed
    needsBlank ? location[obj.name] : location; // otherwise, named location or root

  attachProperties(content.match(obj.reg), keyLocation, obj.names, obj.name);

  if (obj.push) {
    location[obj.push].push(keyLocation);
  }
};

var parse = function (sdp) {
  var session = {}; // session data not related to an m-line
  var mLines = [];
  var location = session;  // will be updated to point at current mLine

  // parse lines we understand
  sdp.split('\n').filter(RegExp.prototype.test.bind(lineReg)).forEach(function (l) {
    var match = l.match(lineReg);
    var type = match[1];
    var content = match[2];
    if (!regs[type]) {
      return;
    }

    if (type === 'm') {
      mLines.push({rtp: [], fmtp: []});
      location = mLines[mLines.length-1];
    }

    for (var j = 0; j < regs[type].length; j += 1) {
      var obj = regs[type][j];
      if (obj.reg.test(content)) {
        parseReg(obj, location, content)
        break;
      }
    }
  });

  // post processing
  for (var i = 0; i < mLines.length; i += 1) {
    var l = mLines[i];
    if (l.payloads) {
      l.payloads = l.payloads.split(' ').map(Number);
    }
    for (var j = 0; j < l.fmtp.length; j += 1) {
      if (l.fmtp[j].config) {
        l.fmtp[j].config = l.fmtp[j].config.split(';').reduce(fmtpReducer, {});
      }
    }
  }

  session.media = mLines; // link it up
  return session;
};

module.exports = parse;

if (module === require.main) {
  var fs = require('fs');
  var sdp = fs.readFileSync('./test/normal.sdp')+'';
  var res = parse(sdp);
  console.log(res);
}
