var tap = require('tap')
  , fs = require('fs')
  , test = tap.test
  , parse = require('../');

test("normal.sdp", function (t) {
  var sdp = fs.readFile('./normal.sdp', function (err, sdp) {
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

    // TODO: global ICE and fingerprint

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

    // TODO: ICE candidates

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

    // TODO: ICE candidates

    t.equal(media.length, 2, "got 2 m-lines");

    t.end();
  });
});
