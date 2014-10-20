var fs = require('fs')
  , main = require(process.env.SDP_TRANSFORM_COV ? '../lib-cov' : '../')
  , parse = main.parse
  , write = main.write
  , parseFmtpConfig = main.parseFmtpConfig;

exports.normalSdp = function (t) {
  fs.readFile(__dirname + '/normal.sdp', function (err, sdp) {
    if (err) {
      t.ok(false, "failed to read file:" + err);
      t.done();
      return;
    }
    var session = parse(sdp+'');
    t.ok(session, "got session info");
    var media = session.media;
    t.ok(media && media.length > 0, "got media");

    //t.equal(session.identifier, '- 20518 0 IN IP4 203.0.113.1', 'identifier');
    t.equal(session.origin.username, '-', 'origin username');
    t.equal(session.origin.sessionId, 20518, 'origin sessionId');
    t.equal(session.origin.sessionVersion, 0, 'origin sessionVersion');
    t.equal(session.origin.netType, 'IN', 'origin netType');
    t.equal(session.origin.ipVer, 4, 'origin ipVer');
    t.equal(session.origin.address, '203.0.113.1', 'origin address');

    t.equal(session.connection.ip, '203.0.113.1');
    t.equal(session.connection.version, 4);

    // global ICE and fingerprint
    t.equal(session.iceUfrag, "F7gI", "global ufrag");
    t.equal(session.icePwd, "x9cml/YzichV2+XlhiMu8g", "global pwd");

    var audio = media[0];
    t.equal(audio.type, "audio", "audio");
    t.equal(audio.port, 54400, "audio port");
    t.equal(audio.protocol, "RTP/SAVPF", "audio protocol");
    t.equal(audio.direction, "sendrecv", "audio direction");
    t.equal(audio.rtp[0].payload, 0, "audio rtp 0 payload");
    t.equal(audio.rtp[0].codec, "PCMU", "audio rtp 0 codec");
    t.equal(audio.rtp[0].rate, 8000, "audio rtp 0 rate");
    t.equal(audio.rtp[1].payload, 96, "audio rtp 1 payload");
    t.equal(audio.rtp[1].codec, "opus", "audio rtp 1 codec");
    t.equal(audio.rtp[1].rate, 48000, "audio rtp 1 rate");
    t.deepEqual(audio.ext[0], {
      value: "1",
      uri: "URI-toffset"
    }, "audio extension 0");
    t.deepEqual(audio.ext[1], {
      value: "2/recvonly",
      uri: "URI-gps-string"
    }, "audio extension 1");

    var video = media[1];
    t.equal(video.type, "video", "video");
    t.equal(video.port, 55400, "video port");
    t.equal(video.protocol, "RTP/SAVPF", "video protocol");
    t.equal(video.direction, "sendrecv", "video direction");
    t.equal(video.rtp[0].payload, 97, "video rtp 0 payload");
    t.equal(video.rtp[0].codec, "H264", "video rtp 0 codec");
    t.equal(video.rtp[0].rate, 90000, "video rtp 0 rate");
    t.equal(video.fmtp[0].payload, 97, "video fmtp 0 payload");
    var vidFmtp = parseFmtpConfig(video.fmtp[0].config);
    t.equal(vidFmtp['profile-level-id'], "4d0028", "video fmtp 0 profile-level-id");
    t.equal(vidFmtp['packetization-mode'], 1, "video fmtp 0 packetization-mode");
    t.equal(video.rtp[1].payload, 98, "video rtp 1 payload");
    t.equal(video.rtp[1].codec, "VP8", "video rtp 1 codec");
    t.equal(video.rtp[1].rate, 90000, "video rtp 1 rate");
    t.equal(video.rtcpFb[0].payload, '*', "video rtcp-fb 0 payload");
    t.equal(video.rtcpFb[0].type, 'nack', "video rtcp-fb 0 type");
    t.equal(video.rtcpFb[1].payload, 98, "video rtcp-fb 0 payload");
    t.equal(video.rtcpFb[1].type, 'nack', "video rtcp-fb 0 type");
    t.equal(video.rtcpFb[1].subtype, 'rpsi', "video rtcp-fb 0 subtype");
    t.equal(video.rtcpFbTrrInt[0].payload, 98, "video rtcp-fb trr-int 0 payload");
    t.equal(video.rtcpFbTrrInt[0].value, 100, "video rtcp-fb trr-int 0 value");
    t.equal(video.crypto[0].id, 1, "video crypto 0 id");
    t.equal(video.crypto[0].suite, 'AES_CM_128_HMAC_SHA1_32', "video crypto 0 suite");
    t.equal(video.crypto[0].config, 'inline:keNcG3HezSNID7LmfDa9J4lfdUL8W1F7TNJKcbuy|2^20|1:32', "video crypto 0 config");

    // ICE candidates (same for both audio and video in this case)
    [audio.candidates, video.candidates].forEach(function (cs, i) {
      var str = (i === 0) ? "audio " : "video ";
      var port = (i === 0) ? 54400 : 55400;
      t.equal(cs.length, 2, str + "got 2 candidates");
      t.equal(cs[0].foundation, 0, str + "ice candidate 0 foundation");
      t.equal(cs[0].component, 1, str + "ice candidate 0 component");
      t.equal(cs[0].transport, "UDP", str + "ice candidate 0 transport");
      t.equal(cs[0].priority, 2113667327, str + "ice candidate 0 priority");
      t.equal(cs[0].ip, "203.0.113.1", str + "ice candidate 0 ip");
      t.equal(cs[0].port, port, str + "ice candidate 0 port");
      t.equal(cs[0].type, "host", str + "ice candidate 0 type");
      t.equal(cs[1].foundation, 1, str + "ice candidate 1 foundation");
      t.equal(cs[1].component, 2, str + "ice candidate 1 component");
      t.equal(cs[1].transport, "UDP", str + "ice candidate 1 transport");
      t.equal(cs[1].priority, 2113667326, str + "ice candidate 1 priority");
      t.equal(cs[1].ip, "203.0.113.1", str + "ice candidate 1 ip");
      t.equal(cs[1].port, port+1, str + "ice candidate 1 port");
      t.equal(cs[1].type, "host", str + "ice candidate 1 type");
    });

    t.equal(media.length, 2, "got 2 m-lines");

    t.done();
  });
};

/*
var S = require('./'); var sdp = fs.readFileSync('./test/chrome.sdp')+'';
S.write(S.parse(sdp)).split('\r\n')
*/

exports.chromeSdp = function (t) {
  fs.readFile(__dirname + '/chrome.sdp', function (err, sdp) {
    if (err) {
      t.ok(false, "failed to read file:" + err);
      t.done();
      return;
    }
    var session = parse(sdp+'');
    t.ok(session, "got session info");
    var media = session.media;
    t.ok(media && media.length > 0, "got media");

    t.equal(session.origin.sessionId, '3710604898417546434', 'origin sessionId');
    t.ok(session.groups, "parsing session groups");
    t.equal(session.groups.length, 1, "one grouping");
    t.equal(session.groups[0].type, "BUNDLE", "grouping is BUNDLE");
    t.equal(session.groups[0].mids, "audio video", "bundling audio video");
    t.ok(session.msidSemantic, "have an msid semantic");
    t.equal(session.msidSemantic.semantic, "WMS", "webrtc semantic");
    t.equal(session.msidSemantic.token, "Jvlam5X3SX1OP6pn20zWogvaKJz5Hjf9OnlV", "semantic token");

    // verify a=rtcp:65179 IN IP4 193.84.77.194
    t.equal(media[0].rtcp.port, 1, 'rtcp port');
    t.equal(media[0].rtcp.netType, 'IN', 'rtcp netType');
    t.equal(media[0].rtcp.ipVer, 4, 'rtcp ipVer');
    t.equal(media[0].rtcp.address, '0.0.0.0', 'rtcp address');

    // and verify it works without specifying the ip
    t.equal(media[1].rtcp.port, 12312, 'rtcp port');
    t.equal(media[1].rtcp.netType, undefined, 'rtcp netType');
    t.equal(media[1].rtcp.ipVer, undefined, 'rtcp ipVer');
    t.equal(media[1].rtcp.address, undefined, 'rtcp address');

    // verify a=rtpmap:126 telephone-event/8000
    var lastRtp = media[0].rtp.length-1;
    t.equal(media[0].rtp[lastRtp].codec, 'telephone-event', 'dtmf codec');
    t.equal(media[0].rtp[lastRtp].rate, 8000, 'dtmf rate');


    t.equal(media[0].iceOptions, 'google-ice', "ice options parsed");
    t.equal(media[0].maxptime, 60, 'maxptime parsed');
    t.equal(media[0].rtcpMux, 'rtcp-mux', 'rtcp-mux present');

    t.equal(media[0].rtp[0].codec, 'opus', 'audio rtp 0 codec');
    t.equal(media[0].rtp[0].encoding, 2, 'audio rtp 0 encoding');

    t.ok(media[0].ssrcs, "have ssrc lines");
    t.equal(media[0].ssrcs.length, 4, "got 4 ssrc lines");
    var ssrcs = media[0].ssrcs;
    t.deepEqual(ssrcs[0], {
      id: 2754920552,
      attribute: "cname",
      value: "t9YU8M1UxTF8Y1A1"
    }, "1st ssrc line");

    t.deepEqual(ssrcs[1], {
      id: 2754920552,
      attribute: "msid",
      value: "Jvlam5X3SX1OP6pn20zWogvaKJz5Hjf9OnlV Jvlam5X3SX1OP6pn20zWogvaKJz5Hjf9OnlVa0"
    }, "2nd ssrc line");

    t.deepEqual(ssrcs[2], {
      id: 2754920552,
      attribute: "mslabel",
      value: "Jvlam5X3SX1OP6pn20zWogvaKJz5Hjf9OnlV"
    }, "3rd ssrc line");

    t.deepEqual(ssrcs[3], {
      id: 2754920552,
      attribute: "label",
      value: "Jvlam5X3SX1OP6pn20zWogvaKJz5Hjf9OnlVa0"
    }, "4th ssrc line");

    t.done();
  });
};

exports.iceliteSdp = function (t) {
  fs.readFile(__dirname + '/icelite.sdp', function (err, sdp) {
    if (err) {
      t.ok(false, "failed to read file:" + err);
      t.done();
      return;
    }
    var session = parse(sdp+'');
    t.ok(session, "got session info");
    t.equal(session.icelite, 'ice-lite', 'icelite parsed');

    var rew = write(session);
    t.ok(rew.indexOf("a=ice-lite\r\n") >= 0, "got ice-lite");
    t.ok(rew.indexOf("m=") > rew.indexOf("a=ice-lite"), 'session level icelite');
    t.done();
  });
};

exports.invalidSdp = function (t) {
  fs.readFile(__dirname + '/invalid.sdp', function (err, sdp) {
    if (err) {
      t.ok(false, "failed to read file:" + err);
      t.done();
      return;
    }
    var session = parse(sdp+'');
    t.ok(session, "got session info");
    var media = session.media;
    t.ok(media && media.length > 0, "got media");

    // verify a=rtcp:65179 IN IP4 193.84.77.194
    t.equal(media[0].rtcp.port, 1, 'rtcp port');
    t.equal(media[0].rtcp.netType, 'IN', 'rtcp netType');
    t.equal(media[0].rtcp.ipVer, 7, 'rtcp ipVer');
    t.equal(media[0].rtcp.address, 'X', 'rtcp address');
    t.equal(media[0].invalid.length, 1, 'found exactly 1 invalid line'); // f= lost
    t.equal(media[0].invalid[0].value, 'goo:hithere', 'copied verbatim');
       
    t.done();
  });
};
