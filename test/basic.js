var tap = require('tap')
  , fs = require('fs')
  , test = tap.test
  , parse = require('../');

test("normal.sdp", function (t) {
  fs.readFile('./normal.sdp', function (err, sdp) {
    if (err) {
      t.ok(false, "failed to read file:" + err);
      t.end();
      return;
    }
    var res = parse(sdp+'');
    var meta = res.meta;
    var media = res.media;
    t.ok(meta, "got meta info");
    t.ok(media && media.length > 0, "got media");

    t.equal(meta.identifier, '- 20518 0 IN IP4 203.0.113.1', 'identifier');
    t.equal(meta.connection, '203.0.113.1');

    // global ICE and fingerprint
    t.equal(meta.ice.ufrag, "F7gI", "global ufrag");
    t.equal(meta.ice.pwd, "x9cml/YzichV2+XlhiMu8g", "global pwd");

    var audio = media[0];
    t.equal(audio.type, "audio", "audio");
    t.equal(audio.port, 54400, "audio port");
    t.ok(audio.encrypted, "audio encrypted");
    t.equal(audio.sendrecv, "sendrecv", "audio sendrecv");
    t.equal(audio.rtpMaps[0].payload, 0, "audio rtp 0 payload");
    t.equal(audio.rtpMaps[0].codec, "PCMU", "audio rtp 0 codec");
    t.equal(audio.rtpMaps[0].rate, 8000, "audio rtp 0 rate");
    t.equal(audio.rtpMaps[1].payload, 96, "audio rtp 1 payload");
    t.equal(audio.rtpMaps[1].codec, "opus", "audio rtp 1 codec");
    t.equal(audio.rtpMaps[1].rate, 48000, "audio rtp 1 rate");

    var video = media[1];
    t.equal(video.type, "video", "video");
    t.equal(video.port, 55400, "video port");
    t.ok(video.encrypted, "video encrypted");
    t.equal(video.sendrecv, "sendrecv", "video sendrecv");
    t.equal(video.rtpMaps[0].payload, 97, "video rtp 0 payload");
    t.equal(video.rtpMaps[0].codec, "H264", "video rtp 0 codec");
    t.equal(video.rtpMaps[0].rate, 90000, "video rtp 0 rate");
    t.equal(video.fmtpMaps[0].payload, 97, "video fmtp 0 payload");
    t.equal(video.fmtpMaps[0].config['profile-level-id'], "4d0028", "video fmtp 0 profile-level-id");
    t.equal(video.fmtpMaps[0].config['packetization-mode'], 1, "video fmtp 0 packetization-mode");
    t.equal(video.rtpMaps[1].payload, 98, "video rtp 1 payload");
    t.equal(video.rtpMaps[1].codec, "VP8", "video rtp 1 codec");
    t.equal(video.rtpMaps[1].rate, 90000, "video rtp 1 rate");

        // ICE candidates (same for both audio and video in this case)
    [audio.ice.candidates, video.ice.candidates].forEach(function (cs, i) {
      var str = (i === 0) ? "audio " : "video ";
      var port = (i === 0) ? 54400 : 55400;
      t.equal(cs.length, 2, str + "got 2 candidates");
      t.equal(cs[0].foundation, "0", str + "ice candidate 0 foundation");
      t.equal(cs[0].component, 1, str + "ice candidate 0 component");
      t.equal(cs[0].transport, "UDP", str + "ice candidate 0 transport");
      t.equal(cs[0].priority, 2113667327, str + "ice candidate 0 priority");
      t.equal(cs[0].ip, "203.0.113.1", str + "ice candidate 0 ip");
      t.equal(cs[0].port, port, str + "ice candidate 0 port");
      t.equal(cs[0].type, "host", str + "ice candidate 0 type");
      t.equal(cs[1].foundation, "1", str + "ice candidate 1 foundation");
      t.equal(cs[1].component, 2, str + "ice candidate 1 component");
      t.equal(cs[1].transport, "UDP", str + "ice candidate 1 transport");
      t.equal(cs[1].priority, 2113667326, str + "ice candidate 1 priority");
      t.equal(cs[1].ip, "203.0.113.1", str + "ice candidate 1 ip");
      t.equal(cs[1].port, port+1, str + "ice candidate 1 port");
      t.equal(cs[1].type, "host", str + "ice candidate 1 type");
    });

    t.equal(media.length, 2, "got 2 m-lines");

    t.end();
  });
});
